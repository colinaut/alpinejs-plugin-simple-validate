// src/index.js
var Plugin = function(Alpine) {
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
  function isDate(dateStr) {
    const regex = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/;
    if (dateStr.match(regex) === null) {
      return false;
    }
    let month, day, year;
    if (dateStr.includes("/"))
      [month, day, year] = dateStr.split("/");
    if (dateStr.includes("-"))
      [month, day, year] = dateStr.split("-");
    if (dateStr.includes("."))
      [month, day, year] = dateStr.split(".");
    const isoFormattedStr = `${year}-${month}-${day}`;
    const date = new Date(isoFormattedStr);
    const timestamp = date.getTime();
    if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
      return false;
    }
    return date.toISOString().startsWith(isoFormattedStr);
  }
  const validate = (str) => {
    return !isEmpty(str);
  };
  validate.required = (str) => !isEmpty(str);
  validate.email = (str) => isEmail(str);
  validate.phone = (str) => isPhone(str);
  validate.website = (str) => isWebsite(str);
  validate.url = (str) => isUrl(str);
  validate.number = (str) => Number(str);
  validate.wholenumber = (str) => isWholeNumber(str);
  validate.integer = (str) => isInteger(str);
  validate.date = (str) => isDate(str);
  Alpine.magic("validate", () => validate);
  Alpine.directive("validate", (el, {
    modifiers,
    expression
  }, {
    evaluate
  }) => {
    const parent = el.parentNode;
    let options = expression ? evaluate(expression) : {};
    function validateChecked() {
      if (!el.checked) {
        setError("required");
      } else
        removeError();
    }
    function validateInput() {
      const value = el.value;
      function hasModifier(type) {
        return modifiers.includes(type);
      }
      if (options.test === void 0 && modifiers.length === 0)
        return false;
      if (hasModifier("required") && isEmpty(value)) {
        setError("required");
        return false;
      }
      if (!hasModifier("required") && isEmpty(value)) {
        removeError();
        return false;
      }
      let error = false;
      modifiers.every((modifier) => {
        if (modifier !== "required" && !validate[modifier](value)) {
          error = `${modifier} required`;
          return false;
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
        removeError();
    }
    function setError(error) {
      error = options.error || error;
      parent.setAttribute("data-error", error);
      parent.removeAttribute("data-valid");
    }
    function removeError() {
      parent.removeAttribute("data-error");
      parent.setAttribute("data-valid", true);
    }
    if (el.nodeName === "INPUT" && modifiers.includes("checked") && (el.type === "checkbox" || el.type === "radio")) {
      el.addEventListener("click", validateChecked);
    } else if (el.nodeName === "INPUT" || el.nodeName === "TEXTAREA") {
      el.addEventListener("input", validateInput);
      el.addEventListener("blur", validateInput);
    } else if (el.nodeName === "SELECT") {
      el.addEventListener("blur", validateInput);
    }
  });
};
var src_default = Plugin;

// builds/module.js
var module_default = src_default;
export {
  module_default as default
};
