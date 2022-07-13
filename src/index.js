const Plugin = function (Alpine) {

    /* -------------------------------------------------------------------------- */
    /*                                 Validators                                 */
    /* -------------------------------------------------------------------------- */

    function cleanText(str) {
        return String(str).toLowerCase().trim()
    }
    
    function isEmpty(str) {
        return cleanText(str) === ''
    };
    
    function isEmail(str) {
        return cleanText(str)
            .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    };

    function isPhone(str) {
        return cleanText(str)
            .match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/);
    };

    function isWebsite(str) {
        return cleanText(str)
            .match(/^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/)
    }

    function isUrl(str) {
        return cleanText(str)
            .match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/)
    }

    function isWholeNumber(str) {
        return Number.isInteger(Number(str)) && Number(str) > 0
    }

    /* -------------------------------------------------------------------------- */
    /*                               $validate magic                              */
    /* -------------------------------------------------------------------------- */

    Alpine.magic("validate",() => ({
        required: str => !isEmpty(str),
        email: str => isEmail(str),
        phone: str => isPhone(str),
        website: str => isWebsite(str),
        url: str => isUrl(str),
        number: str => Number(str),
        wholenumber: str => isWholeNumber(str)
    }))

    /* -------------------------------------------------------------------------- */
    /*                            x-validate directive                            */
    /* -------------------------------------------------------------------------- */
    
    Alpine.directive("validate", (el, {
        modifiers,
        expression
    }) => {

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
                .trim();

            let error = false

            /* ----------------------------- Required or not ---------------------------- */
            // if required not set then allow empty values
            if (!modifiers.includes('required') && isEmpty(value)) {
                setError(false);
                return false;
            }
            // if required then don't allow empty values
            if (modifiers.includes('required') && isEmpty(value)) {
                setError('required');
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
            // if integer then must be a number value (negative or positive; integer or decimal)
            if (modifiers.includes('number') && !Number(value)) {
                error = 'number required';
            }
            // if integer then must be an integer value
            if (modifiers.includes('wholenumber') && !isWholeNumber(value)) {
                error = 'whole number required';
            }

            setError(error);
        }

        // set error message on parent element
        function setError(error) {
            const parent = el.parentNode
            if (error) {
                // set error message
                // use expression in place of default error message
                error = expression || error
                console.error(`'${el.name}' validation error:`, error)
                parent.setAttribute('data-error', error)
                parent.removeAttribute('data-valid')
            } else {
                // remove error message
                parent.removeAttribute('data-error')
                parent.setAttribute('data-valid', true)
            }
        }

        // add event listeners blur for input and click for checkbox or radio buttons
        if (modifiers.includes('checked')) {
            el.addEventListener('click', validateChecked)
        } else {
            el.addEventListener('blur', validate)
        }
    });
}

export default Plugin
