const Plugin = function (Alpine) {

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

    function isDate(dateStr) {
        const regex = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/
      
        if (dateStr.match(regex) === null) {
          return false;
        }
      
        let month, day, year
        if (dateStr.includes('/')) [month, day, year] = dateStr.split('/')
        if (dateStr.includes('-')) [month, day, year] = dateStr.split('-')
        if (dateStr.includes('.')) [month, day, year] = dateStr.split('.')
      
        // 👇️ format Date string as `yyyy-mm-dd`
        const isoFormattedStr = `${year}-${month}-${day}`
      
        const date = new Date(isoFormattedStr)
      
        const timestamp = date.getTime()
      
        if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
          return false;
        }
      
        return date.toISOString().startsWith(isoFormattedStr)
    }

    const validate = str => {
        return !isEmpty(str)
    }

    validate.required = str => !isEmpty(str)
    validate.email = str => isEmail(str)
    validate.phone = str => isPhone(str)
    validate.website = str => isWebsite(str)
    validate.url = str => isUrl(str)
    validate.number = str => Number(str)
    validate.wholenumber = str => isWholeNumber(str)
    validate.integer = str => isInteger(str)
    validate.date = str => isDate(str)

    /* -------------------------------------------------------------------------- */
    /*                               $validate magic                              */
    /* -------------------------------------------------------------------------- */

    Alpine.magic("validate", () => validate)

    /* -------------------------------------------------------------------------- */
    /*                            x-validate directive                            */
    /* -------------------------------------------------------------------------- */

    Alpine.directive("validate", (el, {
        modifiers,
        expression
    }, {
        evaluate
    }) => {

        const parent = el.parentNode

        // options allows error for error message and test for ad hoc test; test should be boolean
        // options = {error: 'error message', test: value === 'hi'}
        let options = (expression) ? evaluate(expression) : {}

        // validation for checkboxes and radio buttons
        function validateChecked() {
            if (!el.checked) {
                setError('required')
            } else
                removeError()
        }

        // validation for input fields, textareas, and select fields
        function validateInput() {
            const value = el.value

            function hasModifier(type) {
                return modifiers.includes(type)
            }

            /* ------------------------ End function if no tests ------------------------ */
            if (options.test === undefined && modifiers.length === 0) return false;

            /* ----------------------------- Required or not ---------------------------- */
            // if required then don't allow empty values
            if (hasModifier('required') && isEmpty(value)) {
                setError('required')
                return false
            }
            // if required not set then allow empty values
            if (!hasModifier('required') && isEmpty(value)) {
                removeError()
                return false
            }

            // Error Message variable
            let error = false

            /* ---------------------------- Value Validators ---------------------------- */

            modifiers.every(modifier => {
                if (modifier !== 'required' && !validate[modifier](value)) {
                    error = `${modifier} required`
                    return false;
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
            if (!error) removeError()
        }

        // set message on parent element
        function setError(error) {
            // use option.error in place of default error message if available
            error = options.error || error
            // console.error(`'${el.name}' validation error:`, error)
            parent.setAttribute('data-error', error)
            parent.removeAttribute('data-valid')
        }

        function removeError() {
            parent.removeAttribute('data-error')
            parent.setAttribute('data-valid', true)
            // console.log(`'${el.name}' is valid`)
        }

        // add event listeners depending on type of element
        if (el.nodeName === 'INPUT' && modifiers.includes('checked') && (el.type === 'checkbox' || el.type === 'radio')) {
            el.addEventListener('click', validateChecked)
        } else if (el.nodeName === 'INPUT' || el.nodeName === 'TEXTAREA') {
            el.addEventListener('input', validateInput)
            el.addEventListener('blur', validateInput)
        } else if (el.nodeName === 'SELECT') {
            el.addEventListener('blur', validateInput)
        }

    });
}

export default Plugin
