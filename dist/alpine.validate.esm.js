// src/index.js
var Plugin = function(Alpine) {
  const pluginName = "validate";
  const isField = (el) => el.matches("input,textarea,select");
  const findFields = (el) => el.querySelectorAll("input, select, text");
  const isClickField = (el) => ["checkbox", "radio", "range"].includes(el.type);
  const isCheckRadio = (el) => ["checkbox", "radio"].includes(el.type);
  const isButton = (el) => ["button", "reset", "submit", "search"].includes(el.type);
  const addEvent = (el, event, callback) => el.addEventListener(event, callback);
  const getAttr = (el, attr) => el.getAttribute(attr);
  const getFormId = (el) => el.matches("form") ? getAttr(el, "id") : getAttr(el.closest("form"), "id");
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
  const dateFormats = ["mmddyyyy", "ddmmyyyy", "yyyymmdd"];
  const cleanText = (str) => String(str).trim();
  const isEmpty = (str) => cleanText(str) === "";
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
  function updateFormData(formId, data) {
    if (typeof formId === "string" && data.name) {
      let tempFormData = formData[formId] || [];
      if (tempFormData.some((val) => val.name === data.name)) {
        let fieldData = tempFormData.filter((val) => val.name === data.name)[0];
        tempFormData = tempFormData.filter((val) => val.name !== data.name);
        if (fieldData.type === "checkbox") {
          let tempArray = fieldData.array || [];
          if (data.value !== "") {
            tempArray = tempArray.some((val) => val === data.value) ? tempArray.filter((val) => val !== data.value) : [...tempArray, data.value];
          }
          data = { ...fieldData, ...data, array: tempArray, value: tempArray.toString() };
        } else {
          data = { ...fieldData, ...data };
        }
      }
      tempFormData.push(data);
      formData[formId] = tempFormData;
    }
  }
  const validate = {};
  validate.email = (str) => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(cleanText(str));
  validate.tel = (str) => /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(cleanText(str));
  validate.website = (str) => /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/.test(cleanText(str));
  validate.url = (str) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/.test(cleanText(str));
  validate.number = (str) => Number(str);
  validate.wholenumber = (str) => Number.isInteger(Number(str)) && Number(str) > 0;
  validate.integer = (str) => Number.isInteger(Number(str));
  validate.date = (str) => isDate(str, dateFormats[0]);
  validate.date[dateFormats[0]] = (str) => isDate(str, dateFormats[0]);
  validate.date[dateFormats[1]] = (str) => isDate(str, dateFormats[1]);
  validate.date[dateFormats[2]] = (str) => isDate(str, dateFormats[2]);
  let validateMagic = {};
  validateMagic.formData = (formId) => {
    return formData[formId].map((val) => Object.getOwnPropertyNames(val).reduce((data, key) => ({ ...data, [key]: val[key] }), {}));
  };
  validateMagic.updateFormData = (formId, data) => updateFormData(formId, data);
  validateMagic.toggleErrorMessage = (field, valid, options) => toggleErrorMessage(field, valid, options);
  validateMagic.isFormComplete = (formId) => {
    const dataArray = formData[formId].map((val) => Object.getOwnPropertyNames(val).reduce((data, key) => ({ ...data, [key]: val[key] }), {}));
    return dataArray.every((val) => val.valid === true);
  };
  validateMagic.submit = (e) => {
    const form = e.target;
    const formId = getFormId(form);
    formData[formId].forEach((val) => {
      if (val.valid === false) {
        const field = document.querySelector(`#${formId} [name='${val.name}'], #${formId} input#${val.name}`);
        const options = val.group ? { errorNode: field.parentNode.parentNode } : {};
        toggleErrorMessage(field, false, options);
        e.preventDefault();
        console.error(`${formId}:${val.name} not valid`);
      }
    });
  };
  Object.keys(validate).forEach((key) => {
    validateMagic = { ...validateMagic, [key]: validate[key] };
  });
  Alpine.magic(pluginName, () => validateMagic);
  Alpine.directive(pluginName, (el, {
    modifiers,
    expression
  }, {
    evaluate
  }) => {
    const formId = getFormId(el);
    formModifiers[formId] = formModifiers[formId] || [];
    const allModifiers = [...modifiers, ...formModifiers[formId]];
    const hasModifier = (type, mods = allModifiers) => mods.includes(type);
    const isRequired = (field) => hasModifier("required") || field.hasAttribute("required") || false;
    function defaultData(field) {
      let data = { name: getName(field), type: field.type, value: field.value, valid: !isRequired(field) };
      if (field.type === "checkbox")
        data = { ...data, value: "", array: [] };
      if (field.type === "radio")
        data = { ...data, value: "" };
      return data;
    }
    if (el.matches("form")) {
      const fields = findFields(el);
      formModifiers[formId] = modifiers;
      fields.forEach((field) => {
        const xValidate = field.getAttributeNames().some((attr) => attr.includes("x-validate"));
        if (!isButton(field) && !xValidate) {
          updateFormData(formId, defaultData(field));
          if (isClickField(field)) {
            addEvent(field, "click", checkIfValid);
          } else {
            addEvent(field, "blur", checkIfValid);
            if (hasModifier("input"))
              addEvent(field, "input", checkIfValid);
          }
        }
      });
    }
    if (isField(el) && !isButton(el)) {
      const formId2 = getFormId(el);
      let data = defaultData(el);
      if (el.type === "checkbox" && hasModifier("group")) {
        let checkGroupValid = function() {
          let fieldDataArrayLength = formData[formId2].filter((val) => val.name === el.name)[0].array.length;
          fieldDataArrayLength = el.checked ? fieldDataArrayLength + 1 : fieldDataArrayLength - 1;
          const num = parseInt(expression && evaluate(expression)) || 1;
          let valid = fieldDataArrayLength >= num;
          toggleErrorMessage(el, valid, { errorNode: el.parentNode.parentNode });
          updateFormData(formId2, { name: getName(el), value: el.value, valid });
        };
        data = { ...data, valid: false, group: true };
        addEvent(el, "click", checkGroupValid);
      } else if (isClickField(el)) {
        addEvent(el, "click", checkIfValid);
        if (el.type === "radio" && hasModifier("group"))
          data = { ...data, value: "", valid: false };
      } else {
        addEvent(el, "blur", checkIfValid);
        if (hasModifier("input"))
          addEvent(el, "input", checkIfValid);
      }
      updateFormData(getFormId(el), data);
    }
    function checkIfValid() {
      const field = this;
      const formId2 = getFormId(field);
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
      updateFormData(formId2, { name: getName(field), value: field.value, valid });
      if (!valid && field.matches("input, textarea") && !isClickField(field) && !hasModifier("bluronly"))
        addEvent(field, "input", checkIfValid);
      if (!valid && hasModifier("refocus"))
        field.focus();
      return valid;
    }
  });
  function toggleErrorMessage(field, valid, options = {}) {
    let { errorNode, errorMsg } = options;
    const name = getName(field) || "";
    errorNode = errorNode || getAdjacentSibling(field, ".error-msg") || field.parentNode;
    errorMsg = errorMsg || getAttr(field, "data-error-msg") || `${name} required`;
    if (!valid) {
      setAttr(errorNode, "data-error", errorMsg);
      setAttr(field, "invalid", "");
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
