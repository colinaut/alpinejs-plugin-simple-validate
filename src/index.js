const Plugin = function (Alpine) {
    // TODO: add support for groups of checkboxes and/or radio buttons with x-validate.group
    // TODO: make way for fieldsets to know if every field in it is valid
    // TODO: possibly use Alpine.bind() to make an x-bind disabled for the submit button

    const pluginName = 'validate'

    /* -------------------------------------------------------------------------- */
    /*                              Helper Functions                              */
    /* -------------------------------------------------------------------------- */

    const isField = (el) => el.matches('input,textarea,select')

    const findFields = (el) => el.querySelectorAll('input, select, text')

    const isClickField = (el) => ['checkbox', 'radio', 'range'].includes(el.type)

    const isCheckRadio = (el) => ['checkbox', 'radio'].includes(el.type)

    const isButton = (el) => ['button','reset', 'submit','search'].includes(el.type)

    const addEvent = (el,event,callback) => el.addEventListener(event, callback)

    const getAttr = (el,attr) => el.getAttribute(attr)

    const getFormId = (el) => (el.matches('form')) ? getAttr(el,'id') : getAttr(el.closest('form'),'id')

    const setAttr = (el,attr,value = '') => el.setAttribute(attr,value)

    function getAdjacentSibling (elem, selector) {
        // Get the next sibling element
        var sibling = elem.nextElementSibling;
        // If there's no selector, return the first sibling
        if (!selector) return sibling;
        // If selector then return if matches, otherwise return false
        if (sibling?.matches(selector)) return sibling;
        return false;
    };

    const getName = (field) => field.name || getAttr(field,'id');

    const dateFormats = ['mmddyyyy','ddmmyyyy','yyyymmdd']

    const cleanText = (str) => String(str).trim()

    const isEmpty = (str) => cleanText(str) === ''

    /* -------------------------------------------------------------------------- */
    /*                                 Validators                                 */
    /* -------------------------------------------------------------------------- */

    function isDate(str, format) {
        const [p1, p2, p3] = str.split(/[-\/.]/)

        let isoFormattedStr
        if (format === dateFormats[0] && /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.test(str)) {
            isoFormattedStr = `${p3}-${p1}-${p2}`
        } else if (format === dateFormats[1] && /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.test(str)) {
            isoFormattedStr = `${p3}-${p2}-${p1}`
        } else if (format === dateFormats[2] && /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/.test(str)) {
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

    // non-reactive variable for modifiers on a per form basis
    const formModifiers = {}

    /* -------------------------------------------------------------------------- */
    /*                           formData functions                               */
    /* -------------------------------------------------------------------------- */

    function updateFormData(formId, data) {
        // console.log("🚀 ~ file: index.js ~ line 86 ~ updateFormData ~ data", data)
        // data = {name: 'field id or name if no id', type: 'field type', value:'field value', array:[optional used for groups], valid: true}
        // Only run if has formId and data has name
        if (typeof formId === 'string' && data.name) {
            // create a temp copy of formData array
            let tempFormData = formData[formId] || []

            // If the field name exists then replace it
            if (tempFormData.some(val => val.name === data.name)) {
                // Grab this data
                let fieldData = tempFormData.filter(val => val.name === data.name)[0]
                // filter out this data from the tempFormData
                tempFormData = tempFormData.filter(val => val.name !== data.name)
                // If checkbox then assume it's a group so update array and string value
                if (fieldData.type === 'checkbox') {
                    let tempArray = fieldData.array || []
                    if (data.value !== '') {
                        // If value exists remove it, otherwise add it
                        tempArray = (tempArray.some(val => val === data.value)) ? tempArray.filter(val => val !== data.value) : [...tempArray, data.value]
                    }
                    // update with revised array
                    data = {...fieldData, ...data, array: tempArray, value: tempArray.toString()}
                } else {
                    // update data
                    data = {...fieldData, ...data}
                }
                // console.log('replaceFormData',formId, data);
            }

            // Add data to tempFormData
            tempFormData.push(data)
            // Update formData[formId]
            formData[formId] = tempFormData
            // console.log(`formData[${formId}]`,formData[formId]);
        }
    }

    /* -------------------------------------------------------------------------- */
    /*                            Validation Functions                            */
    /* -------------------------------------------------------------------------- */

    const validate = {}

    validate.email = str => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(cleanText(str))
    validate.tel = str => /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(cleanText(str))
    validate.website = str => /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/.test(cleanText(str))
    validate.url = str => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/.test(cleanText(str))
    validate.number = str => Number(str)
    validate.wholenumber = str => Number.isInteger(Number(str)) && Number(str) > 0
    validate.integer = str => Number.isInteger(Number(str))
    validate.date = str => isDate(str,dateFormats[0])
    validate.date[dateFormats[0]] = str => isDate(str,dateFormats[0])
    validate.date[dateFormats[1]] = str => isDate(str,dateFormats[1])
    validate.date[dateFormats[2]] = str => isDate(str,dateFormats[2])

    /* -------------------------------------------------------------------------- */
    /*                          Validate Magic Function                           */
    /* -------------------------------------------------------------------------- */
    let validateMagic = {}
    // Display reactive formData
    validateMagic.formData = formId => {
        return formData[formId].map(val => Object.getOwnPropertyNames(val).reduce((data, key) => ({ ...data, [key]: val[key] }), {}))
    }
    // add or update formData
    validateMagic.updateFormData = (formId,data) => updateFormData(formId,data)
    // toggle error message
    validateMagic.toggleErrorMessage = (field,valid,options) => toggleErrorMessage(field,valid,options)
    // Check if form is completed
    validateMagic.isFormComplete = formId => {
        // Reactive proxies cause problems with validation, so we need to build our own array of objects
        const dataArray = formData[formId].map(val => Object.getOwnPropertyNames(val).reduce((data, key) => ({ ...data, [key]: val[key] }), {}))
        return dataArray.every(val => val.valid === true)
    }
    validateMagic.submit = e => {
        const form = e.target
        // e.preventDefault();
        const formId = getFormId(form)
        formData[formId].forEach(val => {
            if (val.valid === false) {
                const field = document.querySelector(`#${formId} [name='${val.name}'], #${formId} input#${val.name}`)
                // click groups should set their error two parents up.
                const options = (val.group) ? {errorNode: field.parentNode.parentNode} : {}
                toggleErrorMessage(field,false,options)
                e.preventDefault();
                console.error(`${formId}:${val.name} not valid`)
            }
        })
    }

    // Add validate functions to validateMagic object
    Object.keys(validate).forEach(key => {
        validateMagic = {...validateMagic, [key]: validate[key]}
    })

    Alpine.magic(pluginName, () => validateMagic)

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
        /*                  Directive Specific Helper Functions                       */
        /* -------------------------------------------------------------------------- */

        const formId = getFormId(el)

        formModifiers[formId] = formModifiers[formId] || []

        const allModifiers = [...modifiers, ...formModifiers[formId]]

        const hasModifier = (type, mods = allModifiers) => mods.includes(type)

        const isRequired = (field) => hasModifier('required') || field.hasAttribute('required') || false

        function defaultData(field) {
            let data = {name:getName(field), type:field.type, value:field.value, valid:!isRequired(field)}
            // If this is a checkbox we don't want the value until checked and need an array
            if (field.type === 'checkbox') data = {...data, value: '', array:[]}
            // If this is a radio we don't want it's value until checked
            if (field.type === 'radio') data = {...data, value: ''}
            return data;
        }

        /* -------------------------------------------------------------------------- */
        /*                 If x-validate on <form> validate all fields                */
        /* -------------------------------------------------------------------------- */

        if (el.matches('form')) {
            // el is form
            // get all input, select, and textareas
            const fields = findFields(el)
            // save all form modifiers
            formModifiers[formId] = modifiers

            /* ---------------------------- Populate formData --------------------------- */

            /* -------------------- Add event triggers and formData -------------------- */
            fields.forEach(field => {
                // check for x-validate on field so we don't add event listeners twice
                const xValidate = field.getAttributeNames().some(attr => attr.includes('x-validate'))
                // Don't add events to buttons nor fields with x-validate
                if (!isButton(field) && !xValidate) {
                    updateFormData(formId, defaultData(field))
                    if (isClickField(field)) {
                        addEvent(field,'click', checkIfValid)
                    } else {
                        addEvent(field,'blur',checkIfValid)
                        if (hasModifier('input')) addEvent(field,'input', checkIfValid)
                    }
                }
            })
        }

        /* -------------------------------------------------------------------------- */
        /*      If x-validate on input, select, or textarea validate this field       */
        /* -------------------------------------------------------------------------- */

        if (isField(el) && !isButton(el)) {
            // el is field element
            const formId = getFormId(el)

            let data = defaultData(el)

            if (el.type === 'checkbox' && hasModifier('group')) {
                data = {...data, valid: false, group:true}

                function checkGroupValid () {
                    // groupArray = (!el.checked) ? groupArray.filter(item => item !== el.value) : [...groupArray, el.value]
                    let fieldDataArrayLength = formData[formId].filter(val => val.name === el.name)[0].array.length
                    // if checked than it is adding 1, otherwise subtracting 1
                    fieldDataArrayLength = (el.checked) ? fieldDataArrayLength + 1 : fieldDataArrayLength - 1
                    
                    // get min number from expression
                    const num = parseInt(expression && evaluate(expression)) || 1
                    let valid = (fieldDataArrayLength >= num)

                    // click groups should set their error two parents up
                    toggleErrorMessage(el, valid, {errorNode: el.parentNode.parentNode})

                    updateFormData(formId, {name:getName(el), value:el.value, valid:valid})
                }

                addEvent(el,'click', checkGroupValid)
                
            } else if (isClickField(el)) {
                addEvent(el,'click', checkIfValid)
                if (el.type === 'radio' && hasModifier('group')) data = {...data, value: '', valid: false}
            } else {
                addEvent(el,'blur',checkIfValid)
                if (hasModifier('input')) addEvent(el,'input', checkIfValid)
            }
            updateFormData(getFormId(el), data)
        }

        /* -------------------------------------------------------------------------- */
        /*                           Check Validity Function                          */
        /* -------------------------------------------------------------------------- */

        function checkIfValid() {
            const field = this
            const formId = getFormId(field)

            // validation default based on type
            let validators = [field.type]

            // If this x-validate is on a field then get add modifiers
            if (isField(el)) validators = [...validators, ...modifiers]
            // console.log("🚀 ~ file: index.js ~ line 294 ~ checkIfValid ~ validators", validators)

            /* --------------------- Check validity the browser way --------------------- */
            let valid = field.checkValidity();

            // Allow for 'required' modifier if don't want to use the normal browser required attribute
            if (isRequired(field) && (isEmpty(field.value) || (isCheckRadio(field) && !field.checked))) valid = false;

            /* -------------- If field.value is not empty run other validators --------------- */
            if (!isEmpty(field.value)) {
                for (let type of validators) {
                    if (typeof validate[type] === 'function') {
                        if(type === 'date') {
                            let dateFormat = dateFormats[0]
                            dateFormats.forEach(format => {
                                if (validators.includes(format)) dateFormat = format
                            })
                            valid = valid && validate.date[dateFormat](field.value);
                            break;
                        } else {
                            valid = valid && validate[type](field.value);
                            break;
                        }
                    }
                }

                /* -------------------- If field then run any ad hoc tests ------------------- */

                if (isField(el)) {
                    // get optional test from expression
                    const test = expression && evaluate(expression)
                    if (test === false) valid = false
                }
            }

            toggleErrorMessage(field, valid)

            /* ----------------------------- Update formData ---------------------------- */
            updateFormData(formId, {name:getName(field), value:field.value, valid:valid})

            // add input event to text fields once it fails the first time
            if (!valid && field.matches('input, textarea') && !isClickField(field) && !hasModifier('bluronly')) addEvent(field,'input', checkIfValid)

            if (!valid && hasModifier('refocus')) field.focus()

            return valid
        }

    });

    /* -------------------------------------------------------------------------- */
    /*                              Add Error Message                             */
    /* -------------------------------------------------------------------------- */

    function toggleErrorMessage(field,valid,options = {}) {
        let {errorNode, errorMsg} = options
        const name = getName(field) || '';
        /* ---------------------------- Add Error Message --------------------------- */

        // If adjacent element with .error-msg class use that. Otherwise use parent.
        errorNode = errorNode || getAdjacentSibling(field,'.error-msg') || field.parentNode;
        errorMsg = errorMsg || getAttr(field,'data-error-msg') || `${name} required`;
        // console.log("🚀 ~ file: index.js ~ line 312 ~ checkIfValid ~ errorNode", errorNode)

        if (!valid) {
            // console.log(`${name} not valid`);
            setAttr(errorNode,'data-error',errorMsg)
            setAttr(field,'invalid','')
        } else {
            // console.log(`${name} valid`);
            errorNode.removeAttribute('data-error')
            field.removeAttribute('invalid')
        }
    }

    /* ------------------------- End Validate Directive ------------------------- */

}

export default Plugin
