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
  const DATA_ERROR = "data-error";
  const DATA_ERROR_MSG = `${DATA_ERROR}-msg`;
  const ERROR_MSG_CLASS = "error-msg";
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
  const getEl = (el) => isHtmlElement(el) ? el : document.getElementById(el) || querySelectorAll(document, `[name ="${el}"]`)[0];
  const getForm = (el) => isHtmlElement(getEl(el), FORM) ? el : isHtmlElement(getEl(el)) ? el.closest(FORM) : false;
  const getName = (field) => field.name || getAttr(field, "id");
  const cleanText = (str) => String(str).trim();
  const getData = (strOrEl) => {
    const el = getEl(strOrEl);
    const data = formData[getForm(el)] || {};
    if (isHtmlElement(el, FORM))
      return Object.values(data);
    if (isHtmlElement(el, FIELDSET))
      return Object.values(data).filter((val) => val.set === el);
    if (isField(el))
      return data[getName(el)];
    return data;
  };
  const getErrorMsgId = (name) => `${ERROR_MSG_CLASS}-${name}`;
  const dateFormats = ["mmddyyyy", "ddmmyyyy", "yyyymmdd"];
  const yearLastDateRegex = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/;
  const yearFirstDateRegex = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/;
  function isDate(str, format) {
    const dateArray = str.split(/[-/.]/);
    const formatIndexInArray = dateFormats.indexOf(format);
    let mm, dd, yyyy;
    if (yearLastDateRegex.test(str)) {
      if (formatIndexInArray === 0)
        [mm, dd, yyyy] = dateArray;
      if (formatIndexInArray === 1)
        [dd, mm, yyyy] = dateArray;
    } else if (yearFirstDateRegex.test(str) && formatIndexInArray === 2) {
      [yyyy, mm, dd] = dateArray;
    }
    const isoFormattedStr = `${yyyy}-${mm}-${dd}`;
    const date = new Date(isoFormattedStr);
    const timestamp = date.getTime();
    if (!isVarType(timestamp, "number") || Number.isNaN(timestamp))
      return false;
    return date.toISOString().startsWith(isoFormattedStr);
  }
  const formData = Alpine.reactive({});
  const formModifiers = {};
  function updateFormData(field, data, triggerErrorMsg) {
    const form = getForm(field);
    const name = getName(field);
    if (isHtmlElement(form, FORM) && isHtmlElement(field, FIELD_SELECTOR) && name) {
      formData[form] = formData[form] || {};
      data = { ...formData[form][name], name, node: field, value: field.value, ...data };
      const value = data.value;
      const isEmpty = !value.trim();
      if (data.required)
        data.valid = !isEmpty && data.valid;
      if (!data.required)
        data.valid = isEmpty ? true : data.valid;
      if (isCheckRadio(field)) {
        let tempArray = data.array || [];
        if (isCheckbox(field)) {
          if (field.checked && !tempArray.includes(value))
            tempArray.push(value);
          if (!field.checked)
            tempArray = tempArray.filter((val) => val !== value);
        }
        if (field.type === RADIO && field.checked)
          tempArray = [value];
        data.array = tempArray;
        data.value = tempArray.toString();
        if (data.group)
          data.valid = tempArray.length >= data.group;
      }
      formData[form][name] = data;
    }
    if (triggerErrorMsg)
      toggleError(field, data.valid);
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
  validateMagic.fieldData = (el) => formData[getForm(el)].find((val) => val.name === getName(el));
  validateMagic.updateData = (field, data, triggerErrorMsg) => updateFormData(getEl(field), data, triggerErrorMsg);
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
  validateMagic.isComplete = (el) => {
    const data = getData(el);
    return data.length >= 0 ? !data.some((val) => !val.valid) : data.valid;
  };
  Object.keys(validate).forEach((key) => validateMagic = { ...validateMagic, [key]: validate[key] });
  Alpine.magic(PLUGIN_NAME, () => validateMagic);
  Alpine.directive(REQUIRED, (el, {
    value,
    expression
  }, {
    evaluate,
    Alpine: Alpine2
  }) => {
    if (expression) {
      Alpine2.effect(() => {
        var _a;
        const evalExp = evaluate(expression);
        const required = value ? ((_a = getData(value)) == null ? void 0 : _a.value) === evalExp : evalExp;
        updateFormData(el, { required });
        if (!required)
          toggleError(el, true);
      });
    }
  });
  Alpine.directive(PLUGIN_NAME, (el, {
    modifiers,
    expression
  }, {
    evaluate
  }) => {
    const form = getForm(el);
    const defaultData = (field) => {
      const groupMin = includes(modifiers, GROUP) ? expression && evaluate(expression) || 1 : false;
      const isRequired = (field2) => includes(modifiers, REQUIRED) || includes(modifiers, GROUP) || field2.hasAttribute(REQUIRED) || false;
      const parentNode = field.closest(".field-parent") || includes(modifiers, GROUP) ? field.parentNode.parentNode : field.parentNode;
      return { valid: !isRequired(field), required: isRequired(field), mods: modifiers, set: field.closest(FIELDSET), group: groupMin, parentNode };
    };
    function addEvents(field) {
      addErrorMsg(field);
      const eventType = isClickField(field) ? "click" : isHtmlElement(field, "select") ? "change" : "blur";
      addEvent(field, eventType, checkIfValid);
      if (includes(modifiers, INPUT) && !isClickField(field))
        addEvent(field, INPUT, checkIfValid);
    }
    if (isHtmlElement(el, FORM)) {
      formModifiers[form] = modifiers;
      const fields = querySelectorAll(el, FIELD_SELECTOR);
      fields.forEach((field) => {
        updateFormData(field, defaultData(field));
        if (!field.getAttributeNames().some((attr) => includes(attr, `x-${PLUGIN_NAME}`))) {
          addEvents(field);
        }
      });
    }
    if (isField(el)) {
      modifiers = [...modifiers, ...formModifiers[form] || []];
      updateFormData(el, defaultData(el));
      addEvents(el);
    }
    function checkIfValid(e) {
      const field = this;
      const value = field.value.trim();
      const fieldData = getData(field);
      let validators = [field.type, ...fieldData.mods];
      let valid = true;
      let data = { value: field.value };
      const evalExp = expression && evaluate(expression);
      const isChecked = field.checked;
      if (isCheckRadio(field) && includes(validators, GROUP)) {
        data.group = parseInt(evalExp) || 1;
      } else {
        valid = field.checkValidity();
        if (fieldData.required && (!value || isCheckRadio(field) && !isChecked))
          valid = false;
        if (valid && value) {
          for (let type of validators) {
            if (isVarType(validate[type], "function")) {
              if (type === "date") {
                const matchingFormat = validators.filter((val) => dateFormats.indexOf(val) !== -1)[0] || dateFormats[0];
                valid = validate.date[matchingFormat](value);
              } else {
                valid = validate[type](value);
              }
              break;
            }
          }
          if (evalExp === false)
            valid = false;
        }
        data.valid = valid;
      }
      updateFormData(field, data, true);
      if (!valid && !includes(validators, "bluronly") && e.type === "blur") {
        addEvent(field, INPUT, checkIfValid);
      }
      if (!valid && includes(validators, "refocus"))
        field.focus();
      return valid;
    }
  });
  function toggleError(field, valid) {
    const name = getName(field);
    const parentNode = getData(field).parentNode;
    const errorMsgNode = getEl(getErrorMsgId(name));
    setAttr(field, "aria-invalid", !valid);
    if (valid) {
      setAttr(errorMsgNode, HIDDEN);
      parentNode.removeAttribute(DATA_ERROR);
    } else {
      errorMsgNode.removeAttribute(HIDDEN);
      setAttr(parentNode, DATA_ERROR, errorMsgNode.textContent);
    }
  }
  function findErrorMsgNode(el) {
    while (el) {
      el = el.nextElementSibling;
      if (isHtmlElement(el, `.${ERROR_MSG_CLASS}`))
        return el;
      if (isHtmlElement(el, FIELD_SELECTOR))
        return false;
    }
    return false;
  }
  function addErrorMsg(field) {
    const name = getName(field);
    const errorMsgId = getErrorMsgId(name);
    const fieldData = getData(field);
    const targetNode = fieldData.group ? fieldData.parentNode : field;
    const span = document.createElement("span");
    span.className = ERROR_MSG_CLASS;
    const errorMsgNode = getEl(errorMsgId) || findErrorMsgNode(targetNode) || span;
    setAttr(errorMsgNode, "id", errorMsgId);
    setAttr(errorMsgNode, HIDDEN);
    if (!errorMsgNode.innerHTML)
      errorMsgNode.textContent = getAttr(targetNode, DATA_ERROR_MSG) || `${name.replace(/[-_]/g, " ")} ${REQUIRED}`;
    setAttr(field, "aria-errormessage", errorMsgId);
    if (!getEl(errorMsgId))
      targetNode.after(errorMsgNode);
  }
};
var src_default = Plugin;

// builds/module.js
var module_default = src_default;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
