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
  const notType = (type) => `:not([type="${type}"])`;
  const FIELD_SELECTOR = `${INPUT}${notType("search")}${notType("reset")}${notType("submit")},select,textarea`;
  const HIDDEN = "hidden";
  const isHtmlElement = (el, type) => {
    const isInstanceOfHTML = el instanceof HTMLElement;
    return type ? isInstanceOfHTML && el.matches(type) : isInstanceOfHTML;
  };
  const includes = (array, string) => Array.isArray(array) && array.includes(string);
  const addEvent = (el, event, callback) => el.addEventListener(event, callback);
  const getAttr = (el, attr) => el.getAttribute(attr);
  const setAttr = (el, attr, value = "") => el.setAttribute(attr, value);
  const getEl = (el) => isHtmlElement(el) ? el : document.getElementById(el) || document.querySelector(`[name ="${el}"]`);
  const getForm = (el) => el && el.closest(FORM);
  const getName = (el) => getAttr(el, "name") || getAttr(el, "id");
  const cleanText = (str) => String(str).trim();
  const getData = (strOrEl) => {
    const el = getEl(strOrEl);
    let data = formData.get(getForm(el));
    if (!data)
      return false;
    if (isHtmlElement(el, FORM))
      return Object.values(data);
    if (isHtmlElement(el, FIELDSET))
      return Object.values(data).filter((val) => val.set === el);
    if (isHtmlElement(el, FIELD_SELECTOR))
      return data[getName(el)];
  };
  const dateFormats = ["mmddyyyy", "ddmmyyyy", "yyyymmdd"];
  const yearLastDateRegex = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/;
  const yearFirstDateRegex = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/;
  function isDate(str, format = dateFormats[2]) {
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
    if (!typeof timestamp === "number" || Number.isNaN(timestamp))
      return false;
    return date.toISOString().startsWith(isoFormattedStr);
  }
  const formData = new WeakMap();
  const formModifiers = new WeakMap();
  function updateFormData(field, data, triggerErrorMsg) {
    const form = getForm(field);
    const name = getName(field);
    if (form && name) {
      if (!formData.has(form)) {
        formData.set(form, Alpine.reactive({}));
      }
      let tempData = formData.get(form);
      data = { ...tempData[name], name, node: field, value: field.value, ...data };
      data.required = data.required || includes(data.mods, REQUIRED) || includes(data.mods, GROUP) || field.hasAttribute(REQUIRED);
      const value = data.value;
      let valid = field.checkValidity();
      if (includes([CHECKBOX, RADIO], field.type)) {
        if (data.required)
          valid = field.checked;
        let tempArray = data.array || [];
        if (field.type === CHECKBOX) {
          if (field.checked && !tempArray.includes(value))
            tempArray.push(value);
          if (!field.checked)
            tempArray = tempArray.filter((val) => val !== value);
        }
        if (field.type === RADIO && field.checked)
          tempArray = [value];
        data.array = tempArray;
        data.value = tempArray.toString();
        if (includes(data.mods, GROUP)) {
          const min = data.exp || 1;
          valid = tempArray.length >= min;
        }
      } else {
        if (data.required)
          valid = !!value.trim();
        if (valid && value) {
          const format = data.mods.filter((val) => dateFormats.indexOf(val) !== -1)[0];
          for (let type of data.mods) {
            if (typeof validate[type] === "function") {
              valid = type === "date" ? isDate(value, format) : validate[type](value);
              break;
            }
          }
          if (data.exp === false)
            valid = false;
        }
      }
      data.valid = valid;
      tempData[name] = data;
      formData.set(form, tempData);
    }
    if (triggerErrorMsg)
      toggleError(field, data.valid);
    return data;
  }
  const validate = {};
  validate.email = (str) => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(cleanText(str));
  validate.tel = (str) => /^((\+|0)\d{1,4})?[-\s.]?[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?(\d{1,2})$/.test(cleanText(str));
  validate.website = (str) => /^(https?:\/\/)?(www\.)?([-a-zA-Z0-9@:%._+~#=]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/.test(cleanText(str));
  validate.url = (str) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_+.~#?&/=]*)/.test(cleanText(str));
  validate.number = (str) => !isNaN(parseFloat(str)) && isFinite(str);
  validate.integer = (str) => validate.number(str) && Number.isInteger(Number(str));
  validate.wholenumber = (str) => validate.integer(str) && Number(str) > 0;
  validate.date = (str) => isDate(str);
  dateFormats.forEach((format) => {
    validate.date[format] = (str) => isDate(str, format);
  });
  let validateMagic = {};
  validateMagic.data = (el) => getData(el);
  validateMagic.formData = (el) => formData.get(getForm(getEl(el)));
  validateMagic.value = (el) => {
    const data = getData(el);
    if (Array.isArray(data)) {
      return data.reduce((result, item) => {
        result[item.name] = item.value;
        return result;
      }, {});
    }
    return data && data.value;
  };
  validateMagic.updateData = (field, data, triggerErrorMsg) => updateFormData(getEl(field), data, triggerErrorMsg);
  validateMagic.toggleError = (field, valid) => toggleError(getEl(field), valid);
  validateMagic.submit = (e) => {
    let invalid = 0;
    getData(e.target).forEach((val) => {
      if (val.valid === false) {
        invalid++;
        if (invalid === 1)
          val.node.focus();
        toggleError(val.node, false);
        e.preventDefault();
        console.error(`${val.name} ${REQUIRED}`);
      }
    });
  };
  validateMagic.isComplete = (el) => {
    const data = getData(el);
    return Array.isArray(data) ? !data.some((val) => !val.valid) : data && data.valid;
  };
  Object.keys(validate).forEach((key) => validateMagic = { ...validateMagic, [key]: validate[key] });
  Alpine.magic(PLUGIN_NAME, () => validateMagic);
  Alpine.magic("formData", (el) => formData.get(getForm(getEl(el))));
  Alpine.directive(REQUIRED, (el, {
    value,
    expression
  }, {
    evaluate
  }) => {
    if (expression) {
      Alpine.effect(() => {
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
      const parentNode = field.closest(".field-parent") || includes(modifiers, GROUP) ? field.parentNode.parentNode : field.parentNode;
      return { mods: [...modifiers, field.type], set: field.closest(FIELDSET), parentNode, exp: expression && evaluate(expression) };
    };
    function addEvents(field) {
      addErrorMsg(field);
      const isClickField = includes([CHECKBOX, RADIO, "range"], field.type);
      const eventType = isClickField ? "click" : isHtmlElement(field, "select") ? "change" : "blur";
      addEvent(field, eventType, checkIfValid);
      if (includes(modifiers, INPUT) && !isClickField)
        addEvent(field, INPUT, checkIfValid);
    }
    if (isHtmlElement(el, FORM)) {
      formModifiers.set(form, modifiers);
      const fields = el.querySelectorAll(FIELD_SELECTOR);
      addEvent(el, "reset", () => {
        el.reset();
        const data = getData(el);
        setTimeout(() => {
          data.forEach((field) => updateFormData(field.node));
        }, 50);
      });
      fields.forEach((field) => {
        if (getName(field)) {
          updateFormData(field, defaultData(field));
          if (!field.getAttributeNames().some((attr) => attr.includes(`x-${PLUGIN_NAME}`))) {
            addEvents(field);
          }
        }
      });
    }
    if (getName(el) && isHtmlElement(el, FIELD_SELECTOR)) {
      const formMods = formModifiers.has(form) ? formModifiers.get(form) : [];
      modifiers = [...modifiers, ...formMods];
      updateFormData(el, defaultData(el));
      addEvents(el);
    }
    function checkIfValid(e) {
      const field = this;
      const mods = getData(field).mods;
      const updatedData = updateFormData(field, { exp: expression && evaluate(expression) }, true);
      if (!updatedData.valid && !includes(mods, "bluronly") && e.type === "blur") {
        addEvent(field, INPUT, checkIfValid);
      }
      if (!updatedData.valid && includes(mods, "refocus"))
        field.focus();
      return updatedData.valid;
    }
  });
  function toggleError(field, valid) {
    const name = getName(field);
    const parentNode = getData(field).parentNode;
    const errorMsgNode = getEl(`${ERROR_MSG_CLASS}-${name}`);
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
    const errorMsgId = `${ERROR_MSG_CLASS}-${name}`;
    const fieldData = getData(field);
    const targetNode = includes(fieldData.mods, GROUP) ? fieldData.parentNode : field;
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
