const Plugin = function (Alpine) {
    // TODO: add support for groups of checkboxes and/or radio buttons with x-validate.group
    // TODO: make way for fieldsets to know if every field in it is valid
    // TODO: possibly use Alpine.bind() to make an x-bind disabled for the submit button

    const pluginName = 'validate'

    /* -------------------------------------------------------------------------- */
    /*                              Helper Functions                              */
    /* -------------------------------------------------------------------------- */

    function isTextField(el) {
        return (el.nodeName === 'INPUT' || el.nodeName === 'TEXTAREA')
    }

    function isClickField(el) {
        allowedTypes = ['checkbox', 'radio']
        return (el.nodeName === 'INPUT' && allowedTypes.includes(el.type))
    }

    function event(el,event,callback) {
        el.addEventListener(event, callback)
    }

    function setAttr(el,attr,value) {
        el.setAttribute(attr,value)
    }

    /* -------------------------------------------------------------------------- */
    /*                                 Validators                                 */
    /* -------------------------------------------------------------------------- */


    function cleanText(str) {
        return String(str).trim()
    }

    function isEmpty(str) {
        return cleanText(str) === ''
    }

    function isEmail(str) {
        return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(cleanText(str))
    }

    function isPhone(str) {
        return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(cleanText(str))
    }

    function isWebsite(str) {
        return /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/.test(cleanText(str))
    }

    function isUrl(str) {
        return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/.test(cleanText(str))
    }

    function isWholeNumber(str) {
        const num = Number(str)
        return Number.isInteger(num) && num > 0
    }

    function isInteger(str) {
        return Number.isInteger(Number(str))
    }

    function isDate(str, format) {
        const [p1, p2, p3] = str.split(/[-\/.]/)

        let isoFormattedStr
        if (format === 'mm-dd-yyyy' && /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.test(str)) {
            isoFormattedStr = `${p3}-${p1}-${p2}`
        } else if (format === 'dd-mm-yyyy' && /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.test(str)) {
            isoFormattedStr = `${p3}-${p2}-${p1}`
        } else if (format === 'yyyy-mm-dd' && /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/.test(str)) {
            isoFormattedStr = `${p1}-${p2}-${p3}`
        } else return false

        const date = new Date(isoFormattedStr)

        const timestamp = date.getTime()

        if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
            return false;
        }

        return date.toISOString().startsWith(isoFormattedStr)
    }

    /* -------------------------------------------------------------------------- */
    /*                       Validation Reactive Data Store                       */
    /* -------------------------------------------------------------------------- */

    const formData = Alpine.reactive({});

    /* -------------------------------------------------------------------------- */
    /*                           formData functions                               */
    /* -------------------------------------------------------------------------- */

    function replaceFieldData(formId, name, value, error) {
        if (formId) {
            const valid = !(error)
            const data = (Array.isArray(value)) ? {value: value.toString(), array: value} : {value: value}
            formData[formId] = formData[formId].map(val => {
                if (val.name === name) {
                    // console.log('replaceFieldData', {...val, ...data, valid: valid, error: error});
                    return {...val, ...data, valid: valid, error: error}
                } else return val
            })
            const dataArray = formData[formId].map(val => Object.getOwnPropertyNames(val).reduce((data, key) => ({ ...data, [key]: val[key] }), {}))
            // console.log(`replaceFieldData formData[${formId}]`, dataArray )
        }
    }

    function addFieldData(formId, name, value, valid) {
        if (formId) {
            const data = (Array.isArray(value)) ? {value: value.toString(), array: value} : {value: value}
            formData[formId] = formData[formId] || []
            formData[formId].push({name:name, ...data, valid: valid})
            const dataArray = formData[formId].map(val => Object.getOwnPropertyNames(val).reduce((data, key) => ({ ...data, [key]: val[key] }), {}))
            // console.log(`addFieldData formData[${formId}]`, dataArray )
        }
    }

    /* -------------------------------------------------------------------------- */
    /*                            Validation Functions                            */
    /* -------------------------------------------------------------------------- */

    const validate = str => {
        return !isEmpty(str)
    }

    validate.email = str => isEmail(str)
    validate.phone = str => isPhone(str)
    validate.website = str => isWebsite(str)
    validate.url = str => isUrl(str)
    validate.number = str => Number(str)
    validate.wholenumber = str => isWholeNumber(str)
    validate.integer = str => isInteger(str)
    validate.date = str => isDate(str,'mm-dd-yyyy')
    validate['date-mm-dd-yyyy'] = str => isDate(str,'mm-dd-yyyy')
    validate['date-dd-mm-yyyy'] = str => isDate(str,'dd-mm-yyyy')
    validate['date-yyyy-mm-dd'] = str => isDate(str,'yyyy-mm-dd')
    // Display reactive formData
    validate.formData = formId => formData[formId]
    // Check if form is completed
    validate.isFormComplete = formId => {
        // Reactive proxies cause problems with validation, so we need to build our own array of objects
        const dataArray = formData[formId].map(val => Object.getOwnPropertyNames(val).reduce((data, key) => ({ ...data, [key]: val[key] }), {}))
        return dataArray.every(val => val.valid === true)
    }
    validate.submit = e => {
        const formId = e.target.getAttribute('id')
        formData[formId].forEach(val => {
            if (val.valid === false) {
                e.preventDefault();
                console.log(`${formId}:${val.name} not valid`)
                const field = document.querySelector(`#${formId} [name='${val.name}']`)
                field.focus();
                field.blur();
            }
        })
    }

    // specific validators; 'required' is special
    const validatorModifiers = ['phone', 'email', 'website', 'url', 'number', 'integer', 'wholenumber','date','date-mm-dd-yyyy', 'date-dd-mm-yyyy', 'date-yyyy-mm-dd']

    /* -------------------------------------------------------------------------- */
    /*                           Validate Value Function                          */
    /* -------------------------------------------------------------------------- */

    function getValidationError(value,modifiers,test) {
        // Returns false if no validation triggered and error message if invalid

        // set base error message
        let error = false

        function isRequired() {
            return modifiers.includes('required')
        }

        /* ------------------------- 1. Required or not ---------------------------- */
        // if not required and empty then skip other tests; else assume required
        if (isEmpty(value)) {
            if (!isRequired()) return false;
            if (isRequired()) error = 'required';
        }

        /* ---------------------- 2. Run modifier validations ----------------------- */

        for (let modifier of modifiers) {
            if (validatorModifiers.includes(modifier) && typeof validate[modifier] === 'function') {
                if (!validate[modifier](value)) {
                    if (modifier.includes('date')) {
                        const format = (modifier.length > 4) ? modifier.slice(5) : 'mm-dd-yyyy'
                        error = `date required in ${format} format`
                    } else error = `${modifier} required`
                    break;
                }
            }
        }

        /* ------------------------ Ad Hoc User Defined Test ------------------------ */
        // Adhoc test runs after all other tests
        if (test === false) error = error || 'validation failed'

        return error;
    }

    /* -------------------------------------------------------------------------- */
    /*                               $validate magic                              */
    /* -------------------------------------------------------------------------- */

    Alpine.magic(pluginName, () => validate)

    /* -------------------------------------------------------------------------- */
    /*                            x-validate directive                            */
    /* -------------------------------------------------------------------------- */

    Alpine.directive(pluginName, (el, {
        modifiers,
        expression
    }, {
        evaluate
    }) => {

        /* -------------------------------------------------------------------------- */
        /*                               Main Variables                               */
        /* -------------------------------------------------------------------------- */
        
        // options allows error for error message and test for ad hoc test; test should be boolean
        let options = (expression) ? evaluate(expression) : {}

        const formId = el.closest('form').getAttribute('id')
        const name = el.name || el.getAttribute('id')

        /* -------------------------------------------------------------------------- */
        /*                              Helper Functions                              */
        /* -------------------------------------------------------------------------- */

        // Specific validators
        const validators = modifiers.filter(modifier => validatorModifiers.includes(modifier))

        function hasModifier(type) {
            return modifiers.includes(type)
        }

        function isRequired() {
            return hasModifier('required')
        }

        /* -------------------------------------------------------------------------- */
        /*                 validation for checkboxes and radio buttons                */
        /* -------------------------------------------------------------------------- */
        function validateChecked() {
            let error = false
            // checks if 'required' or for backwards compatibility 'checked'
            if (isRequired() && !el.checked) {
                 error = options.error || 'required'
            }
            updateField(error)
            replaceFieldData(formId,name, el.value, error)
        }

        /* -------------------------------------------------------------------------- */
        /*          validation for input fields, textareas, and select fields         */
        /* -------------------------------------------------------------------------- */
        function validateInput() {

            // grab again as reactive values may have changed
            options = (expression) ? evaluate(expression) : {}

            let error = getValidationError(el.value, modifiers, options.test)

            error = (error) ? options.error || error : false;

            // Refocus if modifier set
            if (error && hasModifier('refocus')) el.focus()
            updateField(error)
            replaceFieldData(formId, name, el.value, (error))
        }

        /* -------------------------------------------------------------------------- */
        /*                       Update field validity function                       */
        /* -------------------------------------------------------------------------- */

        function updateField(error = false, errorNode = el.parentNode) {
            // if error than set to invalid and show error message
            if (error) {
                setAttr(errorNode,'data-error',error)
                setAttr(el,'data-valid',false)
                // add 'input' event after validation on blur fails for input and textarea
                if (isTextField(el)) event(el,'input',validateInput)
            } else {
                errorNode.removeAttribute('data-error')
                setAttr(el,'data-valid',true)
            }
        }

        /* -------------------------------------------------------------------------- */
        /*                   Set up event handlers and add fieldData                  */
        /* -------------------------------------------------------------------------- */

        // valid defaults to false if there are validation modifiers or an ad hoc test, otherwise valid is intrinsically true
        const validDefault = isRequired() && validators === 0 && options.test !== undefined && true

        // Set base data-valid attribute
        setAttr(el,'data-valid',validDefault)

        // Add base fieldData
        const defaultValue = (hasModifier('group')) ? [] : el.value;
        addFieldData(formId, name, defaultValue, validDefault)

        /* ------------------- Set up checkboxes and radio buttons ------------------ */
        if (isClickField(el)) {
            event(el,'click',validateChecked)
        } else if (!isTextField(el) || el.nodeName === 'SELECT') {
            /* ------------ Set up (some) inputs, textareas, and select menus ------------- */
            event(el,'blur',validateInput)
            if (hasModifier('input')) event(el,'input',validateInput)
        }
        
        /* ------------------------- Set up groups of fields ------------------------ */
        if (hasModifier('group')) {
            const fields = el.querySelectorAll('input[type="checkbox"], input[type="radio"]');
            let fieldsValue = []

            function eventTrigger(field) {
                // modify fieldsValue based on checked status
                if (field.checked) {
                    fieldsValue.push(field.value)
                } else {
                    fieldsValue = fieldsValue.filter(item => item !== field.value)
                }

                const error = (isRequired() && fieldsValue.length === 0) ? 'at least one selection required' : false;

                updateField(error, el)
                if (name) replaceFieldData(formId, name, fieldsValue, error)
            }

            // Add event triggers
            fields.forEach(field => event(field,'click',() => eventTrigger(field)))
        }

    });
}

export default Plugin
