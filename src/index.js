const Plugin = function (Alpine) {
    // TODO: build some tests for this

    /* -------------------------------------------------------------------------- */
    /*                              STRING CONSTANTS                              */
    /* -------------------------------------------------------------------------- */
    /* ------------------- Named attributes used multiple times ------------------ */
    const DATA_ERROR_MSG = 'data-error-msg'
    const DATA_ERROR = 'data-error'
    const ERROR_MSG_CLASS = 'error-msg'
    const PLUGIN_NAME = 'validate'

    /* ----------------- These are just for better minification ------------------ */

    const REQUIRED = 'required'
    const INPUT = 'input'
    const CHECKBOX = 'checkbox'
    const RADIO = 'radio'
    const GROUP = 'group'
    const FORM = 'form'
    const FIELDSET = 'fieldset'
    const FIELD_SELECTOR = `input:not([type="button"]):not([type="search"]):not([type="reset"]):not([type="submit"]),select,textarea`
    const HIDDEN = 'hidden'

    /* -------------------------------------------------------------------------- */
    /*                              Helper Functions                              */
    /* -------------------------------------------------------------------------- */

    const isHtmlElement = (el,type) => (type) ? el instanceof HTMLElement && el.matches(type) : el instanceof HTMLElement

    const isField = (el) => isHtmlElement(el,FIELD_SELECTOR)

    const isVarType = (x,type) => typeof x === type

    const includes = (array, string) => array.includes(string)

    const querySelectorAll = (el,selector) => el.querySelectorAll(selector)

    const isClickField = (el) => includes([CHECKBOX, RADIO, 'range'],el.type)

    const isCheckRadio = (el) => includes([CHECKBOX, RADIO],el.type)

    const isCheckbox = (el) => el.type === CHECKBOX

    const addEvent = (el,event,callback) => el.addEventListener(event, callback)

    const getAttr = (el,attr) => el.getAttribute(attr)

    const setAttr = (el,attr,value = '') => el.setAttribute(attr,value)

    // If it already is an element it returns itself, if it is a string it assumes it is an id and finds it, otherwise false
    const getEl = (el) => (isVarType(el,'string')) ? document.getElementById(el) : (isHtmlElement(el)) ? el : false

    // is it is a form it returns the form; otherwise it returns the closest form parent
    const getForm = (el) => (isHtmlElement(getEl(el),FORM)) ? el : (isHtmlElement(getEl(el))) ? el.closest(FORM) : false

    const getName = (field) => field.name || getAttr(field,'id');

    const cleanText = (str) => String(str).trim()

    const getData = (el) => {
        el = getEl(el)
        const data = formData[getForm(el)] || []
        if (isHtmlElement(el,FIELDSET)) return data.filter(val => val.set === el)
        if (isField(el)) return data.filter(val => val.name === getName(el))[0]
        return data
    }

    const isGroup = (field) => includes(getData(field).mods,'group')

    const getErrorMsgId = (name) => `error-msg-${name}`

    /* -------------------------------------------------------------------------- */
    /*                                 Validators                                 */
    /* -------------------------------------------------------------------------- */

    const dateFormats = ['mmddyyyy','ddmmyyyy','yyyymmdd']

    const yearLastDateRegex = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/
    const yearFirstDateRegex = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/

    function isDate(str, format) {
        const dateArray = str.split(/[-/.]/)
        const formatIndexInArray = dateFormats.indexOf(format)

        let mm,dd,yyyy

        if (yearLastDateRegex.test(str)) {
            if (formatIndexInArray === 0) [mm,dd,yyyy] = dateArray
            if (formatIndexInArray === 1) [dd,mm,yyyy] = dateArray
        } else if (yearFirstDateRegex.test(str) && formatIndexInArray === 2) {
            [yyyy,mm,dd] = dateArray
        }

        const isoFormattedStr = `${yyyy}-${mm}-${dd}`
        const date = new Date(isoFormattedStr)
        // console.log("🚀 ~ file: index.js ~ line 81 ~ isDate ~ isoFormattedStr", isoFormattedStr)

        const timestamp = date.getTime()

        if (!isVarType(timestamp,'number') || Number.isNaN(timestamp)) return false

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
        // console.log("🚀 ~ file: index.js ~ line 86 ~ updateFormData ~ data", field, data, required)
        // data = {name: 'field id or name if no id', node: field, value:'field value', array:[optional used for groups], valid: true, set: form node or fieldset node}
        // Only run if has form and field has name
        const form = getForm(field)
        const name = getName(field)
        // Add name, node, and value if it's not being passed along
        data = {name: name, node: field, value: field.value, ...data}
        // console.log("🚀 ~ file: index.js ~ line 127 ~ updateFormData ~ data", data)

        // only add data if form and name available
        if (isHtmlElement(form,FORM) && name) {
            // create a temp copy of formData array
            let tempFormData = getData(form)

            // If the field name exists then replace it
            if (tempFormData.some(val => val.name === name)) {
                // Update data with the new data
                data = {...getData(field), ...data}
                // console.log("🚀 ~ file: index.js ~ line 138 ~ updateFormData ~ data", data)
                // value shortcut to lessen code
                const value = data.value
                const isEmpty = !value.trim()

                // add/remove required if set from $validate.makeRequired()
                if (required === true) {
                    data.mods = [...data.mods, REQUIRED]
                    // if empty then invalid so set to false; otherwise fall back on previous value
                    data.valid = !isEmpty && data.valid
                }

                if (required === false) {
                    data.mods = data.mods.filter(val => val !== REQUIRED)
                    // if empty then valid otherwise use data.valid
                    data.valid = (isEmpty) ? true : data.valid
                }

                // If checkbox then assume it's a group so update array and string value as long as there is a value
                if (isCheckbox(field) && value) {
                    let tempArray = data.array
                    // If value exists remove it, otherwise add it
                    tempArray = (tempArray.some(val => val === value)) ? tempArray.filter(val => val !== value) : [...tempArray, value]
                    // update with revised array
                    data.array = tempArray
                    // console.log("🚀 ~ file: index.js ~ line 161 ~ updateFormData ~ tempArray", tempArray)
                    data.value = tempArray.toString()
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

    dateFormats.forEach(format => {
        validate.date[format] = str => isDate(str,format)
    })

    /* -------------------------------------------------------------------------- */
    /*                          Validate Magic Function                           */
    /* -------------------------------------------------------------------------- */
    let validateMagic = {}
    // Display reactive formData
    validateMagic.data = el => getData(el)
    // add or update formData
    validateMagic.updateData = (field,data) => updateFormData(getEl(field),data)
    // Turn on or off required for a field; useful when a field makes another field required like selecting 'other' adds another input field
    validateMagic.makeRequired = (field,boolean) => updateFormData(getEl(field),{},boolean)
    // simple check for required as a modifier or as attribute
    validateMagic.isRequired = (field) => includes(getData(field).mods,REQUIRED) || getEl(field).hasAttribute(REQUIRED)
    // toggle error message
    validateMagic.toggleError = (field,valid) => toggleError(getEl(field),valid)

    // Check if form is completed

    validateMagic.submit = e => {
        getData(e.target).forEach(val => {
            if (val.valid === false) {
                // click groups should set their error two parents up.
                toggleError(val.node,false)
                e.preventDefault();
                // eslint-disable-next-line no-console -- this error helps with submit and is the only one that should stay in production.
                console.error(`${val.name} not valid`)
            }
        })
    }

    // isComplete works for the form as a whole and fieldsets using either the node itself or the id
    validateMagic.isComplete = (set) => !getData(set).some(val => !val.valid)

    // Add validate functions to validateMagic object
    Object.keys(validate).forEach(key => validateMagic = {...validateMagic, [key]: validate[key]})

    Alpine.magic(PLUGIN_NAME, () => validateMagic)

    /* -------------------------------------------------------------------------- */
    /*                            x-validate directive                            */
    /* -------------------------------------------------------------------------- */

    Alpine.directive(PLUGIN_NAME, (el, {
        modifiers,
        expression
    }, {
        evaluate
    }) => {

        /* -------------------------------------------------------------------------- */
        /*                  Directive Specific Helper Functions                       */
        /* -------------------------------------------------------------------------- */

        const form = getForm(el)

        const defaultData = (field) => {
            const isRequired = (field) => includes(modifiers,REQUIRED) || includes(modifiers,GROUP) || field.hasAttribute(REQUIRED) || false
            return {array: isCheckbox(field) && [],value:(isCheckRadio(field)) ? "" : field.value, valid:!isRequired(field), mods: modifiers, set: field.closest('fieldset')}
        }

        function addEvents(field) {
            addErrorMsg(field)
            const eventType = (isClickField(field)) ? 'click' : ((isHtmlElement(field,'select'))) ? 'change' :'blur'
            addEvent(field,eventType,checkIfValid)
            if (includes(modifiers,INPUT) && !isClickField(field)) addEvent(field,INPUT, checkIfValid)
        }

        /* -------------------------------------------------------------------------- */
        /*                 If x-validate on <form> validate all fields                */
        /* -------------------------------------------------------------------------- */

        if (isHtmlElement(el,FORM)) {
            // el is form
            // save all form modifiers
            formModifiers[form] = modifiers

            const fields = querySelectorAll(el,FIELD_SELECTOR)

            fields.forEach((field) => {
                updateFormData(field, defaultData(field))
                // Don't add events or error msgs if it has x-validate on it so we aren't duplicating function
                if (!field.getAttributeNames().some(attr => includes(attr,'x-validate'))) {
                    addEvents(field)
                }
            })

            /* -------------------- Add event triggers and formData -------------------- */
        }

        /* -------------------------------------------------------------------------- */
        /*      If x-validate on input, select, or textarea validate this field       */
        /* -------------------------------------------------------------------------- */

        if (isField(el)) {
            // include form level modifiers so they are also referenced
            modifiers = [...modifiers, ...(formModifiers[form] || [])]
            // el is field element
            updateFormData(el, defaultData(el))
            addEvents(el)
        }

        /* -------------------------------------------------------------------------- */
        /*                           Check Validity Function                          */
        /* -------------------------------------------------------------------------- */

        function checkIfValid(e) {
            const field = this
            const value = field.value.trim()
            const fieldData = getData(field)

            // validation default based on type and add mods from data
            let validators = [field.type, ...fieldData.mods]
            // add required if in attribute since our required is better as trims whitespace and doesn't get tricked by a bunch of spaces.
            if (field.hasAttribute(REQUIRED)) validators = [...validators, REQUIRED]
            // console.log("🚀 ~ file: index.js ~ line 341 ~ checkIfValid ~ validators", validators)

            // default valid is true
            let valid = true

            // evaluate expression if it exists
            const evalExp = expression && evaluate(expression)
            // shortcut for checked
            const isChecked = field.checked

            if (isCheckbox(field) && includes(validators,GROUP)) {
                let arrayLength = fieldData.array.length
                // console.log("🚀 ~ file: index.js ~ line 319 ~ checkIfValid ~ fieldData.array", fieldData.array)

                // if checked than it is adding 1, otherwise subtracting 1
                if (isChecked) { arrayLength++ } else { arrayLength-- }

                // get min number from expression
                const num = parseInt(evalExp) || 1
                valid = (arrayLength >= num)

            } else {
                /* --------------------- Check validity the browser way --------------------- */
                valid = field.checkValidity();
                /* -------------------------- Check validity my way ------------------------- */
                // if required and empty or not checked then invalid
                if (includes(validators,REQUIRED) && (!value || (isCheckRadio(field) && !isChecked))) valid = false
                // if valid and has value run validators and ad hoc tests
                if (valid && value) {
                    /* ----------------------------- run validators ----------------------------- */
                    for (let type of validators) {
                        if (isVarType(validate[type],'function')) {
                            if(type === 'date') {
                                // search for data format modifier; if none assume mmddyyyy
                                const matchingFormat = validators.filter(val => dateFormats.indexOf(val) !== -1)[0] || dateFormats[0]
                                valid = validate.date[matchingFormat](value);
                            } else {
                                valid = validate[type](value);
                            }
                            break;
                        }
                    }

                    /* -------------------- Run any ad hoc tests ------------------- */
                    // get optional test from expression
                    if (evalExp === false) valid = false
                }
            }

            toggleError(field, valid)

            /* ----------------------------- Update formData ---------------------------- */
            updateFormData(field, {value:field.value, valid:valid})

            // add input event to blur events once it fails the first time
            if (!valid && !includes(validators,'bluronly') && e.type === 'blur') {
                addEvent(field,INPUT, checkIfValid)
            }

            if (!valid && includes(validators,'refocus')) field.focus()

            return valid
        }

    });
    /* ------------------------- End Validate Directive ------------------------- */

    /* -------------------------------------------------------------------------- */
    /*                            Toggle Error Message                            */
    /* -------------------------------------------------------------------------- */

    function toggleError(field,valid) {
        const name = getName(field)

        let parentNode = field.parentNode
        // if is group then use the parent's parent
        if (isGroup(field)) parentNode = parentNode.parentNode

        const errorMsgNode = getEl(getErrorMsgId(name))

        /* ---------------------------- Set aria-invalid ---------------------------- */
        setAttr(field,'aria-invalid',!valid)

        /* ------------------ Check valid and set and remove error ------------------ */
        if (valid) {
            // console.log(`${name} valid`);
            setAttr(errorMsgNode, HIDDEN)
            parentNode.removeAttribute(DATA_ERROR)
            // hideErrorMsg()
        } else {
            // console.log(`${name} not valid`);
            errorMsgNode.removeAttribute(HIDDEN)
            setAttr(parentNode,DATA_ERROR, errorMsgNode.textContent)
        }
    }

    /* -------------------------------------------------------------------------- */
    /*                        Set Up Error Msg Node in DOM                        */
    /* -------------------------------------------------------------------------- */

    /* ----------------- Helper function to find error msg node ----------------- */

    function findErrorMsgNode(el) {

        while (el) {
            // jump to next sibling element
            el = el.nextElementSibling;
            // return el if matches class name
            if (isHtmlElement(el, `.${ERROR_MSG_CLASS}`)) return el;
            // Stop searching if it hits another field
            if (isHtmlElement(el, FIELD_SELECTOR)) return false;
        }
        return false
    }

    /* ------ Function to setup errorMsgNode by finding it or creating one ------ */

    function addErrorMsg(field) {
        const name = getName(field)

        // set targetNode. The span.error-msg typically appears after the field but groups assign it to set after the wrapper
        const targetNode = (isGroup(field)) ? field.parentNode.parentNode : field

        /* --------------------- Find or Make Error Message Node -------------------- */

        // If there is an adjacent error message with the right class then use that. If not create one.
        const span = document.createElement('span')
        span.className = ERROR_MSG_CLASS
        const errorMsgNode = findErrorMsgNode(targetNode) || span

        // add id tag, hidden attribute, and class name
        const errorMsgId = getErrorMsgId(name)
        setAttr(errorMsgNode, 'id', errorMsgId)
        setAttr(errorMsgNode, HIDDEN)

        // add error text if it isn't already there
        if (!errorMsgNode.innerHTML) errorMsgNode.textContent = getAttr(field,DATA_ERROR_MSG) || `${name.replace(/[-_]/g, ' ')} required`

        // Add aria-errormessage using the ID to field
        setAttr(field,'aria-errormessage',errorMsgId)

        //  Only add element does not yet exist
        if (!getEl(errorMsgId)) targetNode.after(errorMsgNode)
    }
}

export default Plugin