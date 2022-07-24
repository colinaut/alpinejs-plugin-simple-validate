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
  const pluginName = "validate";
  const fieldSelector = `input:not([type="button"]):not([type="search"]):not([type="reset"]),select,textarea`;
  const isField = (el) => el.matches(fieldSelector);
  const findFields = (el) => el.querySelectorAll(fieldSelector);
  const isClickField = (el) => ["checkbox", "radio", "range"].includes(el.type);
  const isCheckRadio = (el) => ["checkbox", "radio"].includes(el.type);
  const addEvent = (el, event, callback) => el.addEventListener(event, callback);
  const getAttr = (el, attr) => el.getAttribute(attr);
  const getForm = (el) => typeof el === "string" ? document.querySelector(`form#${el}`) : el.matches("form") ? el : el.closest("form");
  const getEl = (el) => typeof el === "string" ? document.querySelector(`#${el}`) : el instanceof HTMLElement ? el : false;
  const setAttr = (el, attr, value = "") => el.setAttribute(attr, value);
  function getAdjacentSibling(elem, selector) {
    var sibling = elem.nextElementSibling;
    if (!selector)
      return sibling;
    if (sibling == null ? void 0 : sibling.matches(selector))
      return sibling;
    return false;
  }
  ;
  const getName = (field) => field.name || getAttr(field, "id");
  const cleanText = (str) => String(str).trim();
  const isEmpty = (str) => cleanText(str) === "";
  const dateFormats = ["mmddyyyy", "ddmmyyyy", "yyyymmdd"];
  function isDate(str, format) {
    const [p1, p2, p3] = str.split(/[-\/.]/);
    let isoFormattedStr;
    if (format === dateFormats[0] && /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.test(str)) {
      isoFormattedStr = `${p3}-${p1}-${p2}`;
    } else if (format === dateFormats[1] && /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.test(str)) {
      isoFormattedStr = `${p3}-${p2}-${p1}`;
    } else if (format === dateFormats[2] && /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/.test(str)) {
      isoFormattedStr = `${p1}-${p2}-${p3}`;
    } else
      return false;
    const date = new Date(isoFormattedStr);
    const timestamp = date.getTime();
    if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
      return false;
    }
    return date.toISOString().startsWith(isoFormattedStr);
  }
  const formData = Alpine.reactive({});
  const formModifiers = {};
  function updateFormData(field, data) {
    const form = getForm(field);
    const name = getName(field);
    data = { name, node: field, value: field.value, ...data };
    if (form && form.nodeName === "FORM" && name) {
      let tempFormData = formData[form] || [];
      if (tempFormData.some((val) => val.name === name)) {
        let fieldData = tempFormData.filter((val) => val.name === name)[0];
        tempFormData = tempFormData.filter((val) => val.name !== name);
        if (fieldData.type === "checkbox") {
          let tempArray = fieldData.array || [];
          if (data.value !== "") {
            tempArray = tempArray.some((val) => val === field.value) ? tempArray.filter((val) => val !== data.value) : [...tempArray, data.value];
          }
          data = { ...fieldData, ...data, array: tempArray, value: tempArray.toString() };
        } else {
          data = { ...fieldData, ...data };
        }
      }
      tempFormData.push(data);
      formData[form] = tempFormData;
    }
  }
  const validate = {};
  validate.email = (str) => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(cleanText(str));
  validate.tel = (str) => /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(cleanText(str));
  validate.website = (str) => /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/.test(cleanText(str));
  validate.url = (str) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/.test(cleanText(str));
  validate.number = (str) => parseFloat(str) == str;
  validate.integer = (str) => Number.isInteger(Number(str));
  validate.wholenumber = (str) => validate.integer(str) && Number(str) > 0;
  validate.date = (str) => isDate(str, dateFormats[0]);
  validate.date[dateFormats[0]] = (str) => isDate(str, dateFormats[0]);
  validate.date[dateFormats[1]] = (str) => isDate(str, dateFormats[1]);
  validate.date[dateFormats[2]] = (str) => isDate(str, dateFormats[2]);
  let validateMagic = {};
  validateMagic.formData = (form) => formData[getForm(form)].map((val) => Object.getOwnPropertyNames(val).reduce((data, key) => ({ ...data, [key]: val[key] }), {}));
  validateMagic.updateFormData = (field, data) => updateFormData(getEl(field), data);
  validateMagic.toggleErrorMessage = (field, valid, options) => toggleErrorMessage(getEl(field), valid, options);
  validateMagic.submit = (e) => {
    var _a;
    (_a = formData[e.target]) == null ? void 0 : _a.forEach((val) => {
      if (val.valid === false) {
        const options = val.group ? { errorNode: val.node.parentNode.parentNode } : {};
        toggleErrorMessage(val.node, false, options);
        e.preventDefault();
        console.error(`${val.name} not valid`);
      }
    });
  };
  validateMagic.isComplete = (set) => {
    var _a, _b;
    return !((_b = (_a = formData[getForm(getEl(set))]) == null ? void 0 : _a.filter((val) => val.set === getEl(set))) == null ? void 0 : _b.some((val) => !val.valid));
  };
  Object.keys(validate).forEach((key) => validateMagic = { ...validateMagic, [key]: validate[key] });
  Alpine.magic(pluginName, () => validateMagic);
  Alpine.directive(pluginName, (el, {
    modifiers,
    expression
  }, {
    evaluate
  }) => {
    const form = getForm(el);
    formModifiers[form] = formModifiers[form] || [];
    const allModifiers = [...modifiers, ...formModifiers[form]];
    const hasModifier = (type, mods = allModifiers) => mods.includes(type);
    const isRequired = (field) => hasModifier("required") || field.hasAttribute("required") || false;
    function defaultData(field, set) {
      let data = { value: field.value, valid: !isRequired(field) };
      if (set instanceof HTMLElement)
        data = { ...data, set };
      if (isCheckRadio(field))
        data = { ...data, value: "" };
      if (isCheckRadio(field) && hasModifier("group"))
        data = { ...data, valid: false, group: true };
      return data;
    }
    if (el.matches("form")) {
      formModifiers[form] = modifiers;
      const fieldsets = el.querySelectorAll("fieldset");
      const sets = fieldsets.length > 0 ? fieldsets : [el];
      sets.forEach((set) => {
        const fields = findFields(set);
        fields.forEach((field) => {
          updateFormData(field, defaultData(field, set));
          if (!field.getAttributeNames().some((attr) => attr.includes("x-validate"))) {
            if (isClickField(field)) {
              addEvent(field, "click", checkIfValid);
            } else {
              addEvent(field, "blur", checkIfValid);
              if (hasModifier("input"))
                addEvent(field, "input", checkIfValid);
            }
          }
        });
      });
    }
    if (isField(el)) {
      updateFormData(el, defaultData(el));
      if (el.type === "checkbox" && hasModifier("group")) {
        addEvent(el, "click", checkGroupValid);
      } else if (isClickField(el)) {
        addEvent(el, "click", checkIfValid);
      } else {
        addEvent(el, "blur", checkIfValid);
        if (hasModifier("input"))
          addEvent(el, "input", checkIfValid);
      }
    }
    function checkIfValid() {
      const field = this;
      let validators = [field.type];
      if (isField(el))
        validators = [...validators, ...modifiers];
      let valid = field.checkValidity();
      if (isRequired(field) && (isEmpty(field.value) || isCheckRadio(field) && !field.checked))
        valid = false;
      if (!isEmpty(field.value)) {
        for (let type of validators) {
          if (typeof validate[type] === "function") {
            if (type === "date") {
              let dateFormat = dateFormats[0];
              dateFormats.forEach((format) => {
                if (validators.includes(format))
                  dateFormat = format;
              });
              valid = valid && validate.date[dateFormat](field.value);
              break;
            } else {
              valid = valid && validate[type](field.value);
              break;
            }
          }
        }
        if (isField(el)) {
          const test = expression && evaluate(expression);
          if (test === false)
            valid = false;
        }
      }
      toggleErrorMessage(field, valid);
      updateFormData(field, { value: field.value, valid });
      if (!valid && field.matches("input, textarea") && !isClickField(field) && !hasModifier("bluronly"))
        addEvent(field, "input", checkIfValid);
      if (!valid && hasModifier("refocus"))
        field.focus();
      return valid;
    }
    function checkGroupValid() {
      var _a;
      const field = this;
      let fieldDataArrayLength = ((_a = formData[getForm(field)].filter((val) => val.name === field.name)[0].array) == null ? void 0 : _a.length) || 0;
      fieldDataArrayLength = field.checked ? fieldDataArrayLength + 1 : fieldDataArrayLength - 1;
      const num = parseInt(expression && evaluate(expression)) || 1;
      let valid = fieldDataArrayLength >= num;
      toggleErrorMessage(field, valid, { errorNode: field.parentNode.parentNode });
    }
  });
  function toggleErrorMessage(field, valid, options = {}) {
    let { errorNode, errorMsg } = options;
    const name = getName(field) || "";
    errorNode = errorNode || getAdjacentSibling(field, ".error-msg") || field.parentNode;
    errorMsg = errorMsg || getAttr(field, "data-error-msg") || `${name} required`;
    if (!valid) {
      setAttr(errorNode, "data-error", errorMsg);
      setAttr(field, "invalid");
    } else {
      errorNode.removeAttribute("data-error");
      field.removeAttribute("invalid");
    }
  }
};
var src_default = Plugin;

// builds/module.js
var module_default = src_default;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
