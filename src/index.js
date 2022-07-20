const Plugin = function (Alpine) {
    // TODO: add support for groups of checkboxes and/or radio buttons with x-validate.group
    // TODO: make way for fieldsets to know if every field in it is valid
    // TODO: possibly use Alpine.bind() to make an x-bind disabled for the submit button

    const pluginName = 'validate'

    /* -------------------------------------------------------------------------- */
    /*                              Helper Functions                              */
    /* -------------------------------------------------------------------------- */

    function isTextField(el) {
        allowedTypes = ['text', 'password', 'date', 'datetime-local', 'email', 'tel', 'url', 'time','week', 'month','number']
        return ((el.nodeName === 'INPUT' && allowedTypes.includes(el.type)) || el.nodeName === 'TEXTAREA')
    }

    function isClickField(el) {
        allowedTypes = ['checkbox', 'radio']
        return (el.nodeName === 'INPUT' && allowedTypes.includes(el.type))
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

    function replaceFieldData(el, valid) {
        const formId = el.closest('form').getAttribute('id')
        if (formId) {
            formData[formId] = formData[formId].map(val => {
                if (val.name === el.name) {
                    return {name: el.name, value: el.value, valid: valid}
                } else return val
            })
            // console.log("🚀 ~ file: index.js ~ line 83 ~ replaceFieldData ~ formData[formId]", formData[formId])
        } else return false
        
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

        // options allows error for error message and test for ad hoc test; test should be boolean
        // options = {error: 'error message', test: value === 'hi'}
        let options = (expression) ? evaluate(expression) : {}
        // console.log("🚀 ~ file: index.js ~ line 105 ~ hasModifier ~ modifiers", modifiers)
        function hasModifier(type) {
            return modifiers.includes(type)
        }

        /* -------------------------------------------------------------------------- */
        /*                       Add fields to formData[formId]                       */
        /* -------------------------------------------------------------------------- */
        const formId = el.closest('form').getAttribute('id')
        if (formId) {
            formData[formId] = formData[formId] || []
            // willValidate defaults to true if there are modifiers or ad hoc tests
            const willValidate = modifiers.length > 0 || options.test || false
            // default valid to false if there are modifiers or tests
            formData[formId].push({name:el.name, value:el.value, valid:!willValidate})
            // console.log("🚀 ~ file: index.js ~ line 135 ~ Plugin ~ formData", formData)
        }

        /* -------------------------------------------------------------------------- */
        /*                 validation for checkboxes and radio buttons                */
        /* -------------------------------------------------------------------------- */
        function validateChecked() {
            if (el.checked) {
                setValid()
            } else if (!el.checked) {
                setError('required')
            }
        }

        /* -------------------------------------------------------------------------- */
        /*          validation for input fields, textareas, and select fields         */
        /* -------------------------------------------------------------------------- */
        function validateInput() {

            const value = el.value

            /* ----------------------------- Required or not ---------------------------- */
            // if required then don't allow empty values
            if (hasModifier('required') && isEmpty(value)) {
                setError('required')
                return false
            }
            // if required not set then allow empty values
            if (!hasModifier('required') && isEmpty(value)) {
                setValid()
                return false
            }

            // Error Message variable
            let error = false

            /* ---------------------------- Value Validators ---------------------------- */

            modifiers.every((modifier, i) => {
                if (typeof validate[modifier] === 'function') {
                    if (modifier.includes('date') && !validate[modifier](value)) {
                        const format = (modifier.length > 4) ? modifier.slice(5) : 'mm-dd-yyyy'
                        error = `date required in ${format} format`
                        return false;
                    } else if (!validate[modifier](value)) {
                        error = `${modifier} required`
                        return false;
                    }
                }
                return true;
            })

            /* ------------------------ Ad Hoc User Defined Test ------------------------ */
            // Adhoc test runs after all other tests
            if (options.test !== undefined) {
                // grab test again since reactive values may have changed
                options = (expression) ? evaluate(expression) : {}
                if (options.test === false) {
                    // use above error or generic message; usually best to add a message
                    error = error || 'validation failed'
                }
            }

            // if error is false then it removes the error message
            if (error) setError(error)
            if (!error) setValid()
        }

        /* -------------------------------------------------------------------------- */
        /*                              Invalid Set Error                             */
        /* -------------------------------------------------------------------------- */
        function setError(error) {
            // use option.error in place of default error message if available
            error = options.error || error
            // console.error(`'${el.name}' validation error:`, error)
            // Add error message to parentNode
            el.parentNode.setAttribute('data-error', error)
            // set form element data-valid to false
            el.setAttribute('data-valid', false)
            // Refocus if modifier set
            if (hasModifier('refocus')) el.focus()
            // add 'input' event after validation on blur fails for input and textarea
            if (isTextField(el)) {
                addEventListener('input', validateInput)
            }
            // update Alpine formData
            replaceFieldData(el, false)
        }

        /* -------------------------------------------------------------------------- */
        /*                             Valid remove error                             */
        /* -------------------------------------------------------------------------- */
        function setValid() {
            // remove error message
            el.parentNode.removeAttribute('data-error')
            // set data-valid on form element to true
            el.setAttribute('data-valid', true)
            // console.log(`'${el.name}' is valid`)
            // update Alpine formData
            replaceFieldData(el, true)
        }

        /* -------------------------------------------------------------------------- */
        /*              add event listeners depending on type of element              */
        /* -------------------------------------------------------------------------- */
        if (options.test === undefined && modifiers.length === 0) {
            // if no tests or modifiers do nothing.
        } else if(modifiers.includes('checked') && isClickField(el)) {
            // if checkbox or radio button
            el.setAttribute('data-valid', false)
            el.addEventListener('blur', validateChecked)
            el.addEventListener('click', validateChecked)
        } else if (isTextField(el) || el.nodeName === 'SELECT') {
            // text type input, text area, or select menu
            el.setAttribute('data-valid', false)
            el.addEventListener('blur', validateInput)
            if (modifiers.includes('input')) el.addEventListener('input', validateInput)
        }

    });
}

export default Plugin
