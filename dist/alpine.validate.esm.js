// src/index.js
var Plugin = function(Alpine) {
  const pluginName = "validate";
  const isHtmlElement = (el, type) => type ? el instanceof HTMLElement && el.matches(type) : el instanceof HTMLElement;
  const fieldSelector = `input:not([type="button"]):not([type="search"]):not([type="reset"]):not([type="submit"]),select,textarea`;
  const isField = (el) => isHtmlElement(el, fieldSelector);
  const isVarType = (x, type) => typeof x === type;
  const findFields = (el) => el.querySelectorAll(fieldSelector);
  const isClickField = (el) => ["checkbox", "radio", "range"].includes(el.type);
  const isCheckRadio = (el) => ["checkbox", "radio"].includes(el.type);
  const addEvent = (el, event, callback) => el.addEventListener(event, callback);
  const getAttr = (el, attr) => el.getAttribute(attr);
  const setAttr = (el, attr, value = "") => el.setAttribute(attr, value);
  const getEl = (el) => isVarType(el, "string") ? document.querySelector(`#${el}`) : isHtmlElement(el) ? el : false;
  const getForm = (el) => isHtmlElement(getEl(el), "form") ? el : isHtmlElement(getEl(el)) ? el.closest("form") : false;
  function getAdjacentSibling(elem, selector) {
    var sibling = elem.nextElementSibling;
    if (!selector)
      return sibling;
    if (isHtmlElement(sibling, selector))
      return sibling;
    return false;
  }
  ;
  const getName = (field) => field.name || getAttr(field, "id");
  const cleanText = (str) => String(str).trim();
  const isEmpty = (str) => cleanText(str) === "";
  const getData = (el) => {
    el = getEl(el);
    data = formData[getForm(el)] || [];
    if (isHtmlElement(el, "fieldset"))
      return data.filter((val) => val.set === el);
    if (isField(el))
      return data.filter((val) => val.name === getName(el))[0];
    return data;
  };
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
    if (typeof timestamp !== "number" || Number.isNaN(timestamp))
      return false;
    return date.toISOString().startsWith(isoFormattedStr);
  }
  const formData = Alpine.reactive({});
  const formModifiers = {};
  function updateFormData(field, data2) {
    const form = getForm(field);
    const name = getName(field);
    data2 = { name, node: field, value: field.value, ...data2 };
    if (isHtmlElement(form, "form") && name) {
      let tempFormData = getData(form);
      if (tempFormData.some((val) => val.name === name)) {
        data2 = { ...getData(field), ...data2 };
        if (field.type === "checkbox") {
          let tempArray = data2.array || [];
          if (data2.value !== "") {
            tempArray = tempArray.some((val) => val === field.value) ? tempArray.filter((val) => val !== data2.value) : [...tempArray, data2.value];
          }
          data2 = { ...data2, array: tempArray, value: tempArray.toString() };
        } else {
          data2 = { ...data2 };
        }
        tempFormData = tempFormData.map((val) => val.name === name ? data2 : val);
      } else
        tempFormData.push(data2);
      formData[form] = tempFormData;
    }
  }
  const validate = {};
  validate.email = (str) => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(cleanText(str));
  validate.tel = (str) => /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(cleanText(str));
  validate.website = (str) => /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/.test(cleanText(str));
  validate.url = (str) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/.test(cleanText(str));
  validate.number = (str) => !isNaN(parseFloat(str)) && isFinite(str);
  validate.integer = (str) => validate.number(str) && Number.isInteger(Number(str));
  validate.wholenumber = (str) => validate.integer(str) && Number(str) > 0;
  validate.date = (str) => isDate(str, dateFormats[0]);
  validate.date[dateFormats[0]] = (str) => isDate(str, dateFormats[0]);
  validate.date[dateFormats[1]] = (str) => isDate(str, dateFormats[1]);
  validate.date[dateFormats[2]] = (str) => isDate(str, dateFormats[2]);
  let validateMagic = {};
  validateMagic.data = (el) => getData(el);
  validateMagic.updateData = (field, data2) => updateFormData(getEl(field), data2);
  validateMagic.toggleError = (field, valid, options) => toggleError(getEl(field), valid, options);
  validateMagic.submit = (e) => {
    getData(e.target).forEach((val) => {
      if (val.valid === false) {
        const options = val.group ? { errorNode: val.node.parentNode.parentNode } : {};
        toggleError(val.node, false, options);
        e.preventDefault();
        console.error(`${val.name} not valid`);
      }
    });
  };
  validateMagic.isComplete = (set) => !getData(set).some((val) => !val.valid);
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
    function defaultData(field, set = false) {
      const value = isCheckRadio(field) ? "" : field.value;
      return { value, valid: !(isRequired(field) || hasModifier("group")), mods: allModifiers, set };
    }
    function addEvents(field) {
      if (field.type === "checkbox" && hasModifier("group")) {
        addEvent(field, "click", checkIfValid);
      } else if (isClickField(field)) {
        addEvent(field, "click", checkIfValid);
      } else if (isHtmlElement(field, "select")) {
        addEvent(field, "change", checkIfValid);
      } else {
        addEvent(field, "blur", checkIfValid);
        if (hasModifier("input"))
          addEvent(field, "input", checkIfValid);
      }
    }
    if (isHtmlElement(el, "form")) {
      formModifiers[form] = modifiers;
      const fieldsets = el.querySelectorAll("fieldset");
      const sets = fieldsets.length > 0 ? fieldsets : [el];
      sets.forEach((set) => {
        const fields = findFields(set);
        fields.forEach((field) => {
          updateFormData(field, defaultData(field, set));
          if (!field.getAttributeNames().some((attr) => attr.includes("x-validate")))
            addEvents(field);
        });
      });
    }
    if (isField(el)) {
      updateFormData(el, defaultData(el));
      addEvents(el);
    }
    function checkIfValid() {
      var _a;
      const field = this;
      const fieldData = getData(field);
      let validators = [field.type];
      const fieldDataModifiers = fieldData.mods;
      validators = fieldDataModifiers ? [...validators, ...fieldDataModifiers] : validators;
      let valid = false;
      if (isCheckRadio(field) && hasModifier("group", validators)) {
        const field2 = this;
        let fieldDataArrayLength = ((_a = fieldData.array) == null ? void 0 : _a.length) || 0;
        fieldDataArrayLength = field2.checked ? fieldDataArrayLength + 1 : fieldDataArrayLength - 1;
        const num = parseInt(expression && evaluate(expression)) || 1;
        valid = fieldDataArrayLength >= num;
      } else {
        valid = field.checkValidity();
        if (hasModifier("required", validators) && (isEmpty(field.value) || isCheckRadio(field) && !field.checked))
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
          if (isField(field)) {
            const test = expression && evaluate(expression);
            if (test === false)
              valid = false;
          }
        }
      }
      toggleError(field, valid);
      updateFormData(field, { value: field.value, valid });
      if (!valid && isHtmlElement(field, "input, textarea") && !isClickField(field) && !hasModifier("bluronly"))
        addEvent(field, "input", checkIfValid);
      if (!valid && hasModifier("refocus"))
        field.focus();
      return valid;
    }
  });
  function toggleError(field, valid, options = {}) {
    let { errorNode, errorMsg } = options;
    const name = getName(field) || "";
    if (getData(field).mods.includes("group")) {
      errorNode = field.parentNode.parentNode;
      errorMsg = getAttr(errorNode, "data-error-msg");
    }
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
export {
  module_default as default
};
