var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// builds/module.js
__export(exports, {
  default: () => module_default
});

// src/index.js
var Plugin = function(Alpine) {
  const DATA_ERROR_MSG = "data-error-msg";
  const DATA_ERROR = "data-error";
  const ERROR_MSG_CLASS = "error-msg";
  const INVALID = "aria-invalid";
  const ARIA_ERRORMESSAGE = "aria-errormessage";
  const PLUGIN_NAME = "validate";
  const REQUIRED = "required";
  const INPUT = "input";
  const CHECKBOX = "checkbox";
  const RADIO = "radio";
  const GROUP = "group";
  const FORM = "form";
  const FIELDSET = "fieldset";
  const FIELD_SELECTOR = `input:not([type="button"]):not([type="search"]):not([type="reset"]):not([type="submit"]),select,textarea`;
  const HIDDEN = "hidden";
  const isHtmlElement = (el, type) => type ? el instanceof HTMLElement && el.matches(type) : el instanceof HTMLElement;
  const isField = (el) => isHtmlElement(el, FIELD_SELECTOR);
  const isVarType = (x, type) => typeof x === type;
  const includes = (array, string) => array.includes(string);
  const querySelectorAll = (el, selector) => el.querySelectorAll(selector);
  const isClickField = (el) => includes([CHECKBOX, RADIO, "range"], el.type);
  const isCheckRadio = (el) => includes([CHECKBOX, RADIO], el.type);
  const isCheckbox = (el) => el.type === CHECKBOX;
  const addEvent = (el, event, callback) => el.addEventListener(event, callback);
  const getAttr = (el, attr) => el.getAttribute(attr);
  const setAttr = (el, attr, value = "") => el.setAttribute(attr, value);
  const getEl = (el) => isVarType(el, "string") ? document.getElementById(el) : isHtmlElement(el) ? el : false;
  const getForm = (el) => isHtmlElement(getEl(el), FORM) ? el : isHtmlElement(getEl(el)) ? el.closest(FORM) : false;
  const getName = (field) => field.name || getAttr(field, "id");
  const cleanText = (str) => String(str).trim();
  const getData = (el) => {
    el = getEl(el);
    const data = formData[getForm(el)] || [];
    if (isHtmlElement(el, FIELDSET))
      return data.filter((val) => val.set === el);
    if (isField(el))
      return data.filter((val) => val.name === getName(el))[0];
    return data;
  };
  function getAdjacentSibling(elem, selector) {
    var sibling = elem.nextElementSibling;
    if (!selector)
      return sibling;
    if (isHtmlElement(sibling, selector))
      return sibling;
    return false;
  }
  const getErrorMsgId = (name) => `error-msg-${name}`;
  const dateFormats = ["mmddyyyy", "ddmmyyyy", "yyyymmdd"];
  function isDate(str, format) {
    const [p1, p2, p3] = str.split(/[-/.]/);
    let isoFormattedStr;
    if (format === dateFormats[0] && /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.test(str)) {
      isoFormattedStr = `${p3}-${p1}-${p2}`;
    } else if (format === dateFormats[1] && /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.test(str)) {
      isoFormattedStr = `${p3}-${p2}-${p1}`;
    } else if (format === dateFormats[2] && /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.test(str)) {
      isoFormattedStr = `${p1}-${p2}-${p3}`;
    } else
      return false;
    const date = new Date(isoFormattedStr);
    const timestamp = date.getTime();
    if (!isVarType(timestamp, "number") || Number.isNaN(timestamp))
      return false;
    return date.toISOString().startsWith(isoFormattedStr);
  }
  const formData = Alpine.reactive({});
  const formModifiers = {};
  function updateFormData(field, data, required) {
    const form = getForm(field);
    const name = getName(field);
    data = { name, node: field, value: field.value, ...data };
    if (isHtmlElement(form, FORM) && name) {
      let tempFormData = getData(form);
      if (tempFormData.some((val) => val.name === name)) {
        data = { ...getData(field), ...data };
        const value = data.value;
        const isEmpty = !value.trim();
        if (required === true) {
          data.mods = [...data.mods, REQUIRED];
          data.valid = !isEmpty && data.valid;
        }
        if (required === false) {
          data.mods = data.mods.filter((val) => val !== REQUIRED);
          data.valid = isEmpty ? true : data.valid;
        }
        if (isCheckbox(field) && !value) {
          let tempArray = data.array;
          tempArray = tempArray.some((val) => val === value) ? tempArray.filter((val) => val !== value) : [...tempArray, value];
          data = { ...data, array: tempArray, value: tempArray.toString() };
        }
        tempFormData = tempFormData.map((val) => val.name === name ? data : val);
      } else
        tempFormData.push(data);
      formData[form] = tempFormData;
    }
  }
  const validate = {};
  validate.email = (str) => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(cleanText(str));
  validate.tel = (str) => /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(cleanText(str));
  validate.website = (str) => /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/.test(cleanText(str));
  validate.url = (str) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_+.~#?&/=]*)/.test(cleanText(str));
  validate.number = (str) => !isNaN(parseFloat(str)) && isFinite(str);
  validate.integer = (str) => validate.number(str) && Number.isInteger(Number(str));
  validate.wholenumber = (str) => validate.integer(str) && Number(str) > 0;
  validate.date = (str) => isDate(str, dateFormats[0]);
  dateFormats.forEach((format) => {
    validate.date[format] = (str) => isDate(str, format);
  });
  let validateMagic = {};
  validateMagic.data = (el) => getData(el);
  validateMagic.updateData = (field, data) => updateFormData(getEl(field), data);
  validateMagic.makeRequired = (field, boolean) => updateFormData(getEl(field), {}, boolean);
  validateMagic.isRequired = (field) => includes(getData(field).mods, REQUIRED);
  validateMagic.toggleError = (field, valid) => toggleError(getEl(field), valid);
  validateMagic.submit = (e) => {
    getData(e.target).forEach((val) => {
      if (val.valid === false) {
        toggleError(val.node, false);
        e.preventDefault();
        console.error(`${val.name} not valid`);
      }
    });
  };
  validateMagic.isComplete = (set) => !getData(set).some((val) => !val.valid);
  Object.keys(validate).forEach((key) => validateMagic = { ...validateMagic, [key]: validate[key] });
  Alpine.magic(PLUGIN_NAME, () => validateMagic);
  Alpine.directive(PLUGIN_NAME, (el, {
    modifiers,
    expression
  }, {
    evaluate
  }) => {
    const form = getForm(el);
    formModifiers[form] = formModifiers[form] || [];
    const allModifiers = [...modifiers, ...formModifiers[form]];
    const defaultData = (field, set) => {
      const isRequired = (field2) => includes(allModifiers, REQUIRED) || includes(allModifiers, GROUP) || field2.hasAttribute(REQUIRED) || false;
      let data = { array: isCheckbox(field) && [], value: isCheckRadio(field) ? "" : field.value, valid: !isRequired(field), mods: allModifiers };
      if (set)
        data = { ...data, set };
      return data;
    };
    function addEvents(field) {
      const eventType = isClickField(field) ? "click" : isHtmlElement(field, "select") ? "change" : "blur";
      addEvent(field, eventType, checkIfValid);
      if (includes(allModifiers, INPUT) && !isClickField(field))
        addEvent(field, INPUT, checkIfValid);
    }
    if (isHtmlElement(el, FORM)) {
      formModifiers[form] = modifiers;
      const fieldsets = querySelectorAll(el, FIELDSET);
      const sets = fieldsets.length > 0 ? fieldsets : [el];
      sets.forEach((set) => {
        const fields = querySelectorAll(set, FIELD_SELECTOR);
        fields.forEach((field) => {
          updateFormData(field, defaultData(field, set));
          if (!field.getAttributeNames().some((attr) => includes(attr, "x-validate"))) {
            addEvents(field);
            addErrorMsg(field);
          }
        });
      });
    }
    if (isField(el)) {
      updateFormData(el, defaultData(el));
      addErrorMsg(el);
      addEvents(el);
    }
    function checkIfValid() {
      const field = this;
      const value = field.value.trim();
      const fieldData = getData(field);
      let validators = [field.type, ...fieldData.mods];
      if (field.hasAttribute(REQUIRED))
        validators = [...validators, REQUIRED];
      const isRequired = includes(validators, REQUIRED);
      let valid = true;
      if (isCheckbox(field) && includes(validators, GROUP)) {
        let arrayLength = fieldData.array.length;
        arrayLength = field.checked ? arrayLength + 1 : arrayLength - 1;
        const num = parseInt(expression && evaluate(expression)) || 1;
        valid = arrayLength >= num;
      } else {
        valid = field.checkValidity();
        if (isRequired && (!value || !field.checked))
          valid = false;
        if (valid && value) {
          for (let type of validators) {
            if (isVarType(validate[type], "function")) {
              if (type === "date") {
                const matchingFormat = validators.filter((val) => dateFormats.indexOf(val) !== -1);
                valid = validate.date[matchingFormat[0] || dateFormats[0]](value);
              } else {
                valid = validate[type](value);
              }
              break;
            }
          }
          const test = expression && evaluate(expression);
          if (test === false)
            valid = false;
        }
      }
      toggleError(field, valid);
      updateFormData(field, { value: field.value, valid });
      if (!valid && isHtmlElement(field, "input, textarea") && !isClickField(field) && !includes(validators, "bluronly"))
        addEvent(field, INPUT, checkIfValid);
      if (!valid && includes(validators, "refocus"))
        field.focus();
      return valid;
    }
  });
  function toggleError(field, valid) {
    const name = getName(field);
    const isGroup = includes(getData(field).mods, "group");
    const parentNode = isGroup ? field.parentNode.parentNode : field.parentNode;
    const errorMsg = getAttr(field, DATA_ERROR_MSG) || `${name} required`;
    const errorMsgNode = getEl(getErrorMsgId(name));
    if (valid) {
      setAttr(field, INVALID, "false");
      if (errorMsgNode)
        setAttr(errorMsgNode, HIDDEN);
      parentNode.removeAttribute(DATA_ERROR);
    } else {
      setAttr(field, INVALID, "true");
      if (errorMsgNode)
        errorMsgNode.removeAttribute(HIDDEN);
      setAttr(parentNode, DATA_ERROR, errorMsg);
    }
  }
  function addErrorMsg(field) {
    const name = getName(field);
    const targetNode = includes(getData(field).mods, "group") ? field.parentNode.parentNode : field;
    const span = document.createElement("span");
    span.className = ERROR_MSG_CLASS;
    const errorMsgNode = getAdjacentSibling(targetNode, `.${ERROR_MSG_CLASS}`) || span;
    const errorMsgId = getErrorMsgId(name);
    setAttr(errorMsgNode, "id", errorMsgId);
    setAttr(errorMsgNode, HIDDEN);
    if (!errorMsgNode.innerHTML)
      errorMsgNode.textContent = getAttr(field, DATA_ERROR_MSG) || `${name} required`;
    setAttr(field, ARIA_ERRORMESSAGE, errorMsgId);
    if (!getEl(errorMsgId))
      targetNode.after(errorMsgNode);
  }
};
var src_default = Plugin;

// builds/module.js
var module_default = src_default;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
