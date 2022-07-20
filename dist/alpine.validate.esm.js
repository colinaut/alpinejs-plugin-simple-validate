// src/index.js
var Plugin = function(Alpine) {
  const pluginName = "validate";
  function isTextField(el) {
    allowedTypes = ["text", "password", "date", "datetime-local", "email", "tel", "url", "time", "week", "month", "number"];
    return el.nodeName === "INPUT" && allowedTypes.includes(el.type) || el.nodeName === "TEXTAREA";
  }
  function isClickField(el) {
    allowedTypes = ["checkbox", "radio"];
    return el.nodeName === "INPUT" && allowedTypes.includes(el.type);
  }
  function cleanText(str) {
    return String(str).trim();
  }
  function isEmpty(str) {
    return cleanText(str) === "";
  }
  function isEmail(str) {
    return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(cleanText(str));
  }
  function isPhone(str) {
    return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(cleanText(str));
  }
  function isWebsite(str) {
    return /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/.test(cleanText(str));
  }
  function isUrl(str) {
    return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/.test(cleanText(str));
  }
  function isWholeNumber(str) {
    const num = Number(str);
    return Number.isInteger(num) && num > 0;
  }
  function isInteger(str) {
    return Number.isInteger(Number(str));
  }
  function isDate(str, format) {
    const [p1, p2, p3] = str.split(/[-\/.]/);
    let isoFormattedStr;
    if (format === "mm-dd-yyyy" && /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.test(str)) {
      isoFormattedStr = `${p3}-${p1}-${p2}`;
    } else if (format === "dd-mm-yyyy" && /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.test(str)) {
      isoFormattedStr = `${p3}-${p2}-${p1}`;
    } else if (format === "yyyy-mm-dd" && /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/.test(str)) {
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
  function replaceFieldData(el, valid) {
    const formId = el.closest("form").getAttribute("id");
    if (formId) {
      formData[formId] = formData[formId].map((val) => {
        if (val.name === el.name) {
          return { name: el.name, value: el.value, valid };
        } else
          return val;
      });
    } else
      return false;
  }
  const validate = (str) => {
    return !isEmpty(str);
  };
  validate.email = (str) => isEmail(str);
  validate.phone = (str) => isPhone(str);
  validate.website = (str) => isWebsite(str);
  validate.url = (str) => isUrl(str);
  validate.number = (str) => Number(str);
  validate.wholenumber = (str) => isWholeNumber(str);
  validate.integer = (str) => isInteger(str);
  validate.date = (str) => isDate(str, "mm-dd-yyyy");
  validate["date-mm-dd-yyyy"] = (str) => isDate(str, "mm-dd-yyyy");
  validate["date-dd-mm-yyyy"] = (str) => isDate(str, "dd-mm-yyyy");
  validate["date-yyyy-mm-dd"] = (str) => isDate(str, "yyyy-mm-dd");
  validate.formData = (formId) => formData[formId];
  validate.isFormComplete = (formId) => {
    const dataArray = formData[formId].map((val) => Object.getOwnPropertyNames(val).reduce((data, key) => ({ ...data, [key]: val[key] }), {}));
    return dataArray.every((val) => val.valid === true);
  };
  validate.submit = (e) => {
    const formId = e.target.getAttribute("id");
    formData[formId].forEach((val) => {
      if (val.valid === false) {
        e.preventDefault();
        console.log(`${formId}:${val.name} not valid`);
        const field = document.querySelector(`#${formId} [name='${val.name}']`);
        field.focus();
        field.blur();
      }
    });
  };
  Alpine.magic(pluginName, () => validate);
  Alpine.directive(pluginName, (el, {
    modifiers,
    expression
  }, {
    evaluate
  }) => {
    let options = expression ? evaluate(expression) : {};
    function hasModifier(type) {
      return modifiers.includes(type);
    }
    const formId = el.closest("form").getAttribute("id");
    if (formId) {
      formData[formId] = formData[formId] || [];
      const willValidate = modifiers.length > 0 || options.test || false;
      formData[formId].push({ name: el.name, value: el.value, valid: !willValidate });
    }
    function validateChecked() {
      if (el.checked) {
        setValid();
      } else if (!el.checked) {
        setError("required");
      }
    }
    function validateInput() {
      const value = el.value;
      if (hasModifier("required") && isEmpty(value)) {
        setError("required");
        return false;
      }
      if (!hasModifier("required") && isEmpty(value)) {
        setValid();
        return false;
      }
      let error = false;
      modifiers.every((modifier, i) => {
        if (typeof validate[modifier] === "function") {
          if (modifier.includes("date") && !validate[modifier](value)) {
            const format = modifier.length > 4 ? modifier.slice(5) : "mm-dd-yyyy";
            error = `date required in ${format} format`;
            return false;
          } else if (!validate[modifier](value)) {
            error = `${modifier} required`;
            return false;
          }
        }
        return true;
      });
      if (options.test !== void 0) {
        options = expression ? evaluate(expression) : {};
        if (options.test === false) {
          error = error || "validation failed";
        }
      }
      if (error)
        setError(error);
      if (!error)
        setValid();
    }
    function setError(error) {
      error = options.error || error;
      el.parentNode.setAttribute("data-error", error);
      el.setAttribute("data-valid", false);
      if (hasModifier("refocus"))
        el.focus();
      if (isTextField(el)) {
        addEventListener("input", validateInput);
      }
      replaceFieldData(el, false);
    }
    function setValid() {
      el.parentNode.removeAttribute("data-error");
      el.setAttribute("data-valid", true);
      replaceFieldData(el, true);
    }
    if (options.test === void 0 && modifiers.length === 0) {
    } else if (modifiers.includes("checked") && isClickField(el)) {
      el.setAttribute("data-valid", false);
      el.addEventListener("blur", validateChecked);
      el.addEventListener("click", validateChecked);
    } else if (isTextField(el) || el.nodeName === "SELECT") {
      el.setAttribute("data-valid", false);
      el.addEventListener("blur", validateInput);
      if (modifiers.includes("input"))
        el.addEventListener("input", validateInput);
    }
  });
};
var src_default = Plugin;

// builds/module.js
var module_default = src_default;
export {
  module_default as default
};
