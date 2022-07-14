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
        return cleanText(str)
            .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    }

    function isPhone(str) {
        return cleanText(str)
            .match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/);
    }

    function isWebsite(str) {
        return cleanText(str)
            .match(/^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/)
    }

    function isUrl(str) {
        return cleanText(str)
            .match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/)
    }

    function isWholeNumber(str) {
        const num = Number(str)
        return Number.isInteger(num) && num > 0
    }

    function isInteger(str) {
        return Number.isInteger(Number(str))
    }

    function isDate(str) {
        return !isNaN(Date.parse(cleanText(str)))
    }

    /* -------------------------------------------------------------------------- */
    /*                               $validate magic                              */
    /* -------------------------------------------------------------------------- */

    Alpine.magic("validate",() => {
        function main(str) {
            return !isEmpty(str)
        }

        main.required = str => !isEmpty(str)
        main.email = str => isEmail(str)
        main.phone = str => isPhone(str)
        main.website = str => isWebsite(str)
        main.url = str => isUrl(str)
        main.number = str => Number(str)
        main.wholenumber = str => isWholeNumber(str)
        main.integer = str => isInteger(str)
        main.date = str => isDate(str)

        return main
    })

    /* -------------------------------------------------------------------------- */
    /*                            x-validate directive                            */
    /* -------------------------------------------------------------------------- */
    
    Alpine.directive("validate", (el, {
        modifiers,
        expression
    },{ evaluate }) => {

        // options allows error for error message and test for ad hoc test; test should be boolean
        // options = {error: 'error message', test: value === 'hi'}
        let options = (expression) ? evaluate(expression) : {}

        // validation for checkboxes and radio buttons
        function validateChecked() {
            if (!el.checked) {
                setError('required')
            } else
                setError(false)
        }

        // validation for input fields, textareas, and select fields
        function validate() {
            const value = el
                .value

            let error = false

            /* ------------------------ End function if no tests ------------------------ */
            if (options.test === undefined && modifiers.length === 0) return false;

            /* ----------------------------- Required or not ---------------------------- */
            // if required then don't allow empty values
            if (modifiers.includes('required') && isEmpty(value)) {
                setError('required');
                return false;
            }
            // if required not set then allow empty values
            if (!modifiers.includes('required') && isEmpty(value)) {
                setError(false);
                return false;
            }

            /* ---------------------------- Value Validators ---------------------------- */
            // if email then make sure it's a valid email address
            if (modifiers.includes('email') && !isEmail(value)) {
                error = 'email address required';
            }
            // if phone number then make sure it's a valid phone number
            if (modifiers.includes('phone') && !isPhone(value)) {
                error = 'phone number required';
            }
            // if website then make sure it's a valid domain name with or without http/https
            if (modifiers.includes('website') && !isWebsite(value)) {
                error = 'website required';
            }
            // if website then make sure it's a valid url http/https required
            if (modifiers.includes('url') && !isUrl(value)) {
                error = 'full url required';
            }
            // if number then must be a number value (negative or positive; integer or decimal)
            if (modifiers.includes('number') && !Number(value)) {
                error = 'number required';
            }
            // if integer then must be an positive integer value
            if (modifiers.includes('integer') && !isInteger(value)) {
                error = 'integer required';
            }
            // if wholenumber then must be an positive integer value
            if (modifiers.includes('wholenumber') && !isWholeNumber(value)) {
                error = 'whole number required';
            }
            // if date then must be a date or date and time
            if (modifiers.includes('date') && !isDate(value)) {
                error = 'date required';
            }

            /* ------------------------ Ad Hoc User Defined Test ------------------------ */
            // Adhoc test runs after all other tests
            if (options.test !== undefined) {
                // grab test again since reactive values may have changed
                options = (expression) ? evaluate(expression) : {}
                if (options.test === false) {
                    // generic message; usually best to add a message
                    error = error || 'validation failed';
                }
            }

            setError(error);
        }

        // set error message on parent element
        function setError(error) {
            const parent = el.parentNode
            if (error) {
                // set error message
                // use option.error in place of default error message
                error = options.error || error
                console.error(`'${el.name}' validation error:`, error)
                parent.setAttribute('data-error', error)
                parent.removeAttribute('data-valid')
                // set focus back on element
                el.focus()
            } else {
                // remove error message
                parent.removeAttribute('data-error')
                parent.setAttribute('data-valid', true)
            }
        }

        // add event listeners blur for input and click for checkbox or radio buttons
        if (modifiers.includes('checked')) {
            el.addEventListener('click', validateChecked)
            el.addEventListener('blur', validateChecked)
        } else {
            el.addEventListener('blur', validate)
        }
    });
}

export default Plugin
