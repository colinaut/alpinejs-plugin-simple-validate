const Plugin = function (Alpine) {
    Alpine.directive("validate", (el, {
        modifiers,
        expression
    }) => {

        const isEmail = (txt) => {
            return String(txt)
                .toLowerCase()
                .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
        };

        const isPhone = (txt) => {
            return String(txt)
                .toLowerCase()
                .match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/);
        };

        const isDomain = (txt) => {
            return String(txt)
                .toLowerCase()
                .match(/^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/)
        }

        const isUrl = (txt) => {
            return String(txt)
            .toLowerCase()
            .match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/)
        }

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

            // if required not set then allow empty values
            if (!modifiers.includes('required') && value === '') {
                setError(false);
                return false;
            }
            // if required then don't allow empty values
            if (modifiers.includes('required') && value === '') {
                error = 'required';
            }
            // if email then make sure it's a valid email address
            if (modifiers.includes('email') && !isEmail(value)) {
                error = 'email address required';
            }
            // if phone number then make sure it's a valid phone number
            if (modifiers.includes('phone') && !isPhone(value)) {
                error = 'phone number required';
            }
            // if website then make sure it's a valid domain name with or without http/https
            if (modifiers.includes('website') && !isDomain(value)) {
                error = 'website required';
            }
            // if website then make sure it's a valid url http/https required
            if (modifiers.includes('url') && !isUrl(value)) {
                error = 'full url required';
            }
            setError(error);
        }

        // set error message on parent element
        function setError(error) {
            if (error) {
                // set error message
                // use expression in place of default error message
                error = expression || error;
                console.error(`'${el.name}' validation error:`, error);
                el
                    .parentNode
                    .setAttribute('data-error', error)
            } else {
                // remove error message
                el
                    .parentNode
                    .removeAttribute('data-error');
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
