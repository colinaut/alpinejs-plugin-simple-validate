const Plugin = function (Alpine) {

    const pluginName = 'validate'

    /* -------------------------------------------------------------------------- */
    /*                              Helper Functions                              */
    /* -------------------------------------------------------------------------- */

    const isHtmlElement = (el,type) => (type) ? el instanceof HTMLElement && el.matches(type) : el instanceof HTMLElement

    const fieldSelector = `input:not([type="button"]):not([type="search"]):not([type="reset"]):not([type="submit"]),select,textarea`

    const isField = (el) => isHtmlElement(el,fieldSelector)

    const isVarType = (x,type) => typeof x === type

    const findFields = (el) => el.querySelectorAll(fieldSelector)

    const isClickField = (el) => ['checkbox', 'radio', 'range'].includes(el.type)

    const isCheckRadio = (el) => ['checkbox', 'radio'].includes(el.type)

    const addEvent = (el,event,callback) => el.addEventListener(event, callback)

    const getAttr = (el,attr) => el.getAttribute(attr)

    // If it already is an element it returns itself, if it is a string it assumes it is an id and finds it, otherwise false
    const getEl = (el) => (isVarType(el,'string')) ? document.querySelector(`#${el}`) : (isHtmlElement(el)) ? el : false

    // is it is a form it returns the form; otherwise it returns the closest form parent
    const getForm = (el) => (isHtmlElement(getEl(el),'form')) ? el : (isHtmlElement(getEl(el))) ? el.closest('form') : false

    const setAttr = (el,attr,value = '') => el.setAttribute(attr,value)

    function getAdjacentSibling (elem, selector) {
        // Get the next sibling element
        var sibling = elem.nextElementSibling;
        // If there's no selector, return the first sibling
        if (!selector) return sibling;
        // If selector then return if matches, otherwise return false
        if (isHtmlElement(sibling, selector)) return sibling;
        return false;
    };

    const getName = (field) => field.name || getAttr(field,'id');

    const cleanText = (str) => String(str).trim()

    const isEmpty = (str) => cleanText(str) === ''

    const getData = (el) => {
        el = getEl(el)
        data = formData[getForm(el)] || []
        if (isHtmlElement(el,'form')) return data
        if (isHtmlElement(el,'fieldset')) return data?.filter(val => val.set === el)
        if (isField(el)) return data?.filter(val => val.name === getName(el))[0]
        return []
    }

    /* -------------------------------------------------------------------------- */
    /*                                 Validators                                 */
    /* -------------------------------------------------------------------------- */

    const dateFormats = ['mmddyyyy','ddmmyyyy','yyyymmdd']

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

        if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) return false;

        return date.toISOString().startsWith(isoFormattedStr)
    }

    /* -------------------------------------------------------------------------- */
    /*                       Validation Reactive Data Store                       */
    /* -------------------------------------------------------------------------- */

    const formData = Alpine.reactive({});

    // non-reactive variable for modifiers on a per form basis
    const formMods = {}

    /* -------------------------------------------------------------------------- */
    /*                           formData functions                               */
    /* -------------------------------------------------------------------------- */

    // TODO: maintain array order?
    function updateFormData(field, data, mod) {
        // console.log("🚀 ~ file: index.js ~ line 86 ~ updateFormData ~ data", data)
        // data = {name: 'field id or name if no id', node: field, value:'field value', array:[optional used for groups], valid: true, set: form node or fieldset node, modifiers: []}
        // Only run if has form and field has name
        const form = getForm(field)
        const name = getName(field)
        // Add name, node, and value if it's not being passed along
        data = {name: name, node: field, type: field.type, value: field.value, ...data}
        if (isHtmlElement(form,'form') && name) {
            // create a temp copy of formData array
            let tempFormData = getData(form)

            // If the field name exists then replace it
            if (tempFormData.some(val => val.name === name)) {
                // Grab data matching name
                data = {...getData(field), ...data}
                // add/remove modifier if sent
                if (mod) {
                    let dataMods = data.mods
                    dataMods = (dataMods.includes(mod)) ? dataMods.filter(val => val !== mod) : [...dataMods, mod]
                    data.mods = dataModifiers
                }
                // If checkbox then assume it's a group so update array and string value
                if (field.type === 'checkbox') {
                    let tempArray = data.array || []
                    if (data.value !== '') {
                        // If value exists remove it, otherwise add it
                        tempArray = (tempArray.some(val => val === data.value)) ? tempArray.filter(val => val !== data.value) : [...tempArray, data.value]
                    }
                    // update with revised array
                    data = {...data, array: tempArray, value: tempArray.toString()}
                }
                // Update form data
                tempFormData = tempFormData.map(val => (val.name === name) ? data : val)
                console.log('replaceFormData',data);
            } else tempFormData.push(data)

            // Update formData[form]
            formData[form] = tempFormData
            // console.log(`formData`,formData[form]);
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
    validate.number = str => !isNaN(parseFloat(str)) && isFinite(str)
    validate.integer = str => validate.number(str) && Number.isInteger(Number(str))
    validate.wholenumber = str => validate.integer(str) && Number(str) > 0
    validate.date = str => isDate(str,dateFormats[0])
    validate.date[dateFormats[0]] = str => isDate(str,dateFormats[0])
    validate.date[dateFormats[1]] = str => isDate(str,dateFormats[1])
    validate.date[dateFormats[2]] = str => isDate(str,dateFormats[2])

    /* -------------------------------------------------------------------------- */
    /*                          Validate Magic Function                           */
    /* -------------------------------------------------------------------------- */
    let validateMagic = {}
    // Display reactive formData
    validateMagic.data = el => getData(el)
    // TODO: change formData to just data. Have it detect if it is a form, fieldset or field and return the appropriate data
    // add or update formData
    validateMagic.updateFormData = (field,data) => updateFormData(getEl(field),data)
    validateMagic.toggleMod = (field,validation) => updateFormData(getEl(field),{},validation)
    // toggle error message
    validateMagic.toggleErrorMessage = (field,valid,options) => toggleErrorMessage(getEl(field),valid,options)

    // Check if form is completed

    validateMagic.submit = e => {
        formData[e.target]?.forEach(val => {
            if (val.valid === false) {
                // click groups should set their error two parents up.
                const options = (val.group) ? {errorNode: val.node.parentNode.parentNode} : {}
                toggleErrorMessage(val.node,false,options)
                e.preventDefault();
                console.error(`${val.name} not valid`)
            }
        })
    }

    // isComplete works for the form as a whole and fieldsets using either the node itself or the id
    validateMagic.isComplete = (set) => !getData(set).some(val => !val.valid)

    // Add validate functions to validateMagic object
    Object.keys(validate).forEach(key => validateMagic = {...validateMagic, [key]: validate[key]})

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

        const form = getForm(el)

        formMods[form] = formMods[form] || []

        const allMods = [...modifiers, ...formMods[form]]

        const hasMod = (type, mods = allMods) => mods.includes(type)

        const isRequired = (field) => hasMod('required') || field.hasAttribute('required') || false

        function defaultData(field, set) {
            let data = {value:field.value, valid:!isRequired(field), mods: allMods}
            if (isHtmlElement(set)) data = {...data, set: set}
            // If this is a checkbox or radio we don't want it's value until checked
            if (isCheckRadio(field)) data = {...data, value: ''}
            // If this is a group then it is not valid and marked as a group
            // TODO: detect group from modifiers
            if (isCheckRadio(field) && hasMod('group')) data = {...data, valid: false}
            return data;
        }

        // TODO: test adding events as a formData key for each field. This may allow to update the event callback so I don't need to worry about adding events more than once.
        function addEvents(field) {
            if (isField(field)) {
                const event = checkIfValid
                let eventType = 'blur'
                if (isClickField(field)) eventType = 'click'
                if (isHtmlElement(field,'select')) eventType = 'change'
                addEvent(field,eventType,event)
                // TODO: make sure this only goes on text input fields
                if (hasMod('input')) addEvent(field,'input', event)
            }
        }

        /* -------------------------------------------------------------------------- */
        /*                 If x-validate on <form> validate all fields                */
        /* -------------------------------------------------------------------------- */
        // TODO: move this out of the directive?

        if (isHtmlElement(el,'form')) {
            // el is form
            // save all form modifiers
            formMods[form] = modifiers


            // Get all fieldsets; if none then default on form as one big 'set'
            const fieldsets = el.querySelectorAll('fieldset')
            const sets = (fieldsets.length > 0) ? fieldsets : [el]

            // sort through each set and find fields
            sets.forEach((set) => {
                const fields = findFields(set)
                fields.forEach((field) => {
                    if (isField(field)) updateFormData(field, defaultData(field, set))
                    // Don't add click events if it has x-validate on it so we aren't duplicating function
                    if (!field.getAttributeNames().some(attr => attr.includes('x-validate'))) addEvents(field)
                })
            })

            /* -------------------- Add event triggers and formData -------------------- */
        }

        /* -------------------------------------------------------------------------- */
        /*      If x-validate on input, select, or textarea validate this field       */
        /* -------------------------------------------------------------------------- */

        if (isField(el)) {
            // el is field element
            updateFormData(el, defaultData(el))
            addEvents(el)
        }

        /* -------------------------------------------------------------------------- */
        /*                           Check Validity Function                          */
        /* -------------------------------------------------------------------------- */

        // TODO: combine checkIfValid and checkGroupValid functions
        // TODO: move these out of the directive
        function checkIfValid() {
            const field = this

            // validation based on type and any moderators defined in formData from x-validate
            let validators = [field.type]
            const fieldDataModifiers = getData(field)?.mods
            validators = (fieldDataModifiers) ? [...validators, ...fieldDataModifiers] : validators
            // console.log("🚀 ~ file: index.js ~ line 291 ~ checkIfValid ~ validators", validators)

            let valid = false
            let options = {}

            if (isCheckRadio(field) && hasMod('group',validators)) {
                const field = this
                let fieldDataArrayLength = getData(field).array?.length || 0
                
                // if checked than it is adding 1, otherwise subtracting 1
                fieldDataArrayLength = (field.checked) ? fieldDataArrayLength + 1 : fieldDataArrayLength - 1

                // get min number from expression
                const num = parseInt(expression && evaluate(expression)) || 1
                valid = (fieldDataArrayLength >= num)

                // click groups should set their error two parents up
                options = {errorNode: field.parentNode.parentNode}
            } else {
                /* --------------------- Check validity the browser way --------------------- */
                valid = field.checkValidity();

                // Allow for 'required' modifier if don't want to use the normal browser required attribute
                if (hasMod('required',validators) && (isEmpty(field.value) || (isCheckRadio(field) && !field.checked))) valid = false;

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

                    if (isField(field)) {
                        // get optional test from expression
                        const test = expression && evaluate(expression)
                        if (test === false) valid = false
                    }
                }
            }

            toggleErrorMessage(field, valid, options)

            /* ----------------------------- Update formData ---------------------------- */
            updateFormData(field, {value:field.value, valid:valid})

            // add input event to text fields once it fails the first time
            if (!valid && isHtmlElement(field,'input, textarea') && !isClickField(field) && !hasMod('bluronly')) addEvent(field,'input', checkIfValid)

            if (!valid && hasMod('refocus')) field.focus()

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
            setAttr(field,'invalid')
        } else {
            // console.log(`${name} valid`);
            errorNode.removeAttribute('data-error')
            field.removeAttribute('invalid')
        }
    }

    /* ------------------------- End Validate Directive ------------------------- */

}

export default Plugin
