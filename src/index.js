const Plugin = function (Alpine) {
    // TODO: build some tests for this

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

    const isCheckbox = (el) => el.type === 'checkbox'

    const addEvent = (el,event,callback) => el.addEventListener(event, callback)

    const getAttr = (el,attr) => el.getAttribute(attr)

    const setAttr = (el,attr,value = '') => el.setAttribute(attr,value)

    // If it already is an element it returns itself, if it is a string it assumes it is an id and finds it, otherwise false
    const getEl = (el) => (isVarType(el,'string')) ? document.querySelector(`#${el}`) : (isHtmlElement(el)) ? el : false

    // is it is a form it returns the form; otherwise it returns the closest form parent
    const getForm = (el) => (isHtmlElement(getEl(el),'form')) ? el : (isHtmlElement(getEl(el))) ? el.closest('form') : false

    function getAdjacentSibling (elem, selector) {
        // Get the next sibling element
        var sibling = elem.nextElementSibling;
        // If there's no selector, return the first sibling
        if (!selector) return sibling;
        // If selector then return if matches, otherwise return false
        if (isHtmlElement(sibling, selector)) return sibling;
        return false;
    }

    const getName = (field) => field.name || getAttr(field,'id');

    const cleanText = (str) => String(str).trim()

    const isEmpty = (str) => cleanText(str) === ''

    const getData = (el) => {
        el = getEl(el)
        const data = formData[getForm(el)] || []
        if (isHtmlElement(el,'fieldset')) return data.filter(val => val.set === el)
        if (isField(el)) return data.filter(val => val.name === getName(el))[0]
        return data
    }

    /* -------------------------------------------------------------------------- */
    /*                                 Validators                                 */
    /* -------------------------------------------------------------------------- */

    const dateFormats = ['mmddyyyy','ddmmyyyy','yyyymmdd']

    function isDate(str, format) {
        const [p1, p2, p3] = str.split(/[-/.]/)

        let isoFormattedStr
        if (format === dateFormats[0] && /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.test(str)) {
            isoFormattedStr = `${p3}-${p1}-${p2}`
        } else if (format === dateFormats[1] && /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.test(str)) {
            isoFormattedStr = `${p3}-${p2}-${p1}`
        } else if (format === dateFormats[2] && /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.test(str)) {
            isoFormattedStr = `${p1}-${p2}-${p3}`
        } else return false

        const date = new Date(isoFormattedStr)
        console.log("🚀 ~ file: index.js ~ line 81 ~ isDate ~ isoFormattedStr", isoFormattedStr)

        const timestamp = date.getTime()

        if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) return false

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

    function updateFormData(field, data, required) {
        // console.log("🚀 ~ file: index.js ~ line 86 ~ updateFormData ~ data", field, data, mod)
        // data = {name: 'field id or name if no id', node: field, value:'field value', array:[optional used for groups], valid: true, set: form node or fieldset node}
        // Only run if has form and field has name
        const form = getForm(field)
        const name = getName(field)
        // Add name, node, and value if it's not being passed along
        data = {name: name, node: field, value: field.value, ...data}

        // only add data if form and name available
        if (isHtmlElement(form,'form') && name) {
            // create a temp copy of formData array
            let tempFormData = getData(form)

            // If the field name exists then replace it
            if (tempFormData.some(val => val.name === name)) {
                // Update data with the new data
                data = {...getData(field), ...data}

                // add/remove required if set from $validate.makeRequired()
                if (required === true) {
                    data.mods = [...data.mods, 'required']
                    // if empty then invalid
                    data.valid = !isEmpty(data.value) && data.valid
                }

                if (required === false) {
                    data.mods = data.mods.filter(val => val !== 'required')
                    // if empty then valid otherwise use data.valid
                    data.valid = (isEmpty(data.value)) ? true : data.valid
                }

                if (required === true && isEmpty(data.value)) data.valid = false

                // If checkbox then assume it's a group so update array and string value
                if (isCheckbox(field) && !isEmpty(data.value)) {
                    let tempArray = data.array
                    // If value exists remove it, otherwise add it
                    tempArray = (tempArray.some(val => val === data.value)) ? tempArray.filter(val => val !== data.value) : [...tempArray, data.value]
                    // update with revised array
                    data = {...data, array: tempArray, value: tempArray.toString()}
                }
                // Update data in array
                tempFormData = tempFormData.map(val => (val.name === name) ? data : val)
                // console.log('replaceFormData',data);
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
    validate.tel = str => /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(cleanText(str))
    validate.website = str => /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/.test(cleanText(str))
    validate.url = str => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_+.~#?&/=]*)/.test(cleanText(str))
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
    // add or update formData
    validateMagic.updateData = (field,data) => updateFormData(getEl(field),data)
    // Turn on or off required for a field; useful when a field makes another field required like selecting other adds an other input field
    validateMagic.makeRequired = (field,boolean) => updateFormData(getEl(field),{},boolean)
    // simple check for required
    validateMagic.isRequired = (field) => getData(field).mods.includes('required')
    // toggle error message
    validateMagic.toggleError = (field,valid,options) => toggleError(getEl(field),valid,options)

    // Check if form is completed

    validateMagic.submit = e => {
        getData(e.target).forEach(val => {
            if (val.valid === false) {
                // click groups should set their error two parents up.
                const options = (val.group) ? {errorNode: val.node.parentNode.parentNode} : {}
                toggleError(val.node,false,options)
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

        formModifiers[form] = formModifiers[form] || []

        const allModifiers = [...modifiers, ...formModifiers[form]]

        const hasModifier = (type, mods = allModifiers) => mods.includes(type)

        const isRequired = (field) => hasModifier('required') || field.hasAttribute('required') || false

        const defaultData = (field, set) => {
            let data = {array: isCheckbox(field) && [],value:(isCheckRadio(field)) ? "" : field.value, valid:!(isRequired(field) || hasModifier('group')), mods: allModifiers}
            if (set) data = {...data, set: set}
            return data
        }

        function addEvents(field) {
            let eventType = (isClickField(field)) ? 'click' : ((isHtmlElement(field,'select'))) ? 'change' :'blur'
            addEvent(field,eventType,checkIfValid)
            if (hasModifier('input') && !isClickField(field)) addEvent(field,'input', checkIfValid)
        }

        /* -------------------------------------------------------------------------- */
        /*                 If x-validate on <form> validate all fields                */
        /* -------------------------------------------------------------------------- */

        if (isHtmlElement(el,'form')) {
            // el is form
            // save all form modifiers
            formModifiers[form] = modifiers


            // Get all fieldsets; if none then default on form as one big 'set'
            const fieldsets = el.querySelectorAll('fieldset')
            const sets = (fieldsets.length > 0) ? fieldsets : [el]

            // sort through each set and find fields
            sets.forEach((set) => {
                const fields = findFields(set)
                // console.log("🚀 ~ file: index.js ~ line 241 ~ fieldsets.forEach ~ fields", fields)
                fields.forEach((field) => {
                    updateFormData(field, defaultData(field, set))
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

        function checkIfValid() {
            const field = this
            const fieldData = getData(field)

            // validation default based on type
            let validators = [field.type]

            // If this x-validate is on a field then get add modifiers
            const fieldDataModifiers = fieldData.mods
            validators = (fieldDataModifiers) ? [...validators, ...fieldDataModifiers] : validators
            // console.log("🚀 ~ file: index.js ~ line 294 ~ checkIfValid ~ validators", validators)

            let valid = true

            if (isCheckbox(field) && hasModifier('group',validators)) {
                const field = this
                // radio buttons don't have arrays so force it to have one so this test works
                let fieldDataArrayLength = fieldData.array.length

                // if checked than it is adding 1, otherwise subtracting 1
                fieldDataArrayLength = (field.checked) ? fieldDataArrayLength + 1 : fieldDataArrayLength - 1

                // get min number from expression
                const num = parseInt(expression && evaluate(expression)) || 1
                valid = (fieldDataArrayLength >= num)

            } else {
                /* --------------------- Check validity the browser way --------------------- */
                valid = field.checkValidity();

                // Allow for 'required' modifier if don't want to use the normal browser required attribute
                // Note: note this also works for radio button groups since if it's clicked this triggers and it's valid
                if (hasModifier('required',validators) && (isEmpty(field.value) || (isCheckRadio(field) && !field.checked))) valid = false;

                /* -------------- If field.value is still valid run other validators --------------- */
                if (valid) {
                    for (let type of validators) {
                        if (typeof validate[type] === 'function') {
                            if(type === 'date') {
                                const matchingFormat = validators.filter(val => dateFormats.indexOf(val) !== -1)
                                valid = validate.date[matchingFormat[0] || dateFormats[0]](field.value);
                            } else {
                                valid = validate[type](field.value);
                            }
                            break;
                        }
                    }

                    /* -------------------- Run any ad hoc tests ------------------- */
                    // get optional test from expression
                    const test = expression && evaluate(expression)
                    if (test === false) valid = false
                }
            }

            toggleError(field, valid)

            /* ----------------------------- Update formData ---------------------------- */
            updateFormData(field, {value:field.value, valid:valid})

            // add input event to text fields once it fails the first time
            if (!valid && isHtmlElement(field,'input, textarea') && !isClickField(field) && !hasModifier('bluronly')) addEvent(field,'input', checkIfValid)

            if (!valid && hasModifier('refocus')) field.focus()

            return valid
        }

    });

    /* -------------------------------------------------------------------------- */
    /*                              Add Error Message                             */
    /* -------------------------------------------------------------------------- */

    function toggleError(field,valid,options = {}) {
        let {errorNode, errorMsg} = options
        const name = getName(field) || '';
        /* ---------------------------- Add Error Message --------------------------- */
        if (getData(field).mods.includes('group')) {
            errorNode = field.parentNode.parentNode
            errorMsg = getAttr(errorNode, 'data-error-msg')
        }
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
