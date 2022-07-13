// src/index.js
var Plugin = function(Alpine) {
  function cleanText(str) {
    return String(str).toLowerCase().trim();
  }
  function isEmpty(str) {
    return cleanText(str) === "";
  }
  ;
  function isEmail(str) {
    return cleanText(str).match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  }
  ;
  function isPhone(str) {
    return cleanText(str).match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/);
  }
  ;
  function isWebsite(str) {
    return cleanText(str).match(/^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/);
  }
  function isUrl(str) {
    return cleanText(str).match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/);
  }
  function isWholeNumber(str) {
    return Number.isInteger(Number(str)) && Number(str) > 0;
  }
  function validate(str) {
    function main(str2) {
      return !isEmpty(str2);
    }
    function required(str2) {
      return !isEmpty(str2);
    }
    function email(str2) {
      return !isEmail(str2);
    }
    function phone(str2) {
      return !isPhone(str2);
    }
    main.required = required(str);
    main.email = email(str);
    main.phone = phone(str);
    return main;
  }
  Alpine.magic("validate", () => {
    function main(str) {
      return !isEmpty(str);
    }
    main.required = (str) => !isEmpty(str);
    main.email = (str) => isEmail(str);
    main.phone = (str) => isPhone(str);
    main.website = (str) => isWebsite(str);
    main.url = (str) => isUrl(str);
    main.number = (str) => Number(str);
    main.wholenumber = (str) => isWholeNumber(str);
    return main;
  });
  Alpine.magic("validate0", () => ({
    required: (str) => !isEmpty(str),
    email: (str) => isEmail(str),
    phone: (str) => isPhone(str),
    website: (str) => isWebsite(str),
    url: (str) => isUrl(str),
    number: (str) => Number(str),
    wholenumber: (str) => isWholeNumber(str)
  }));
  Alpine.directive("validate", (el, {
    modifiers,
    expression
  }) => {
    function validateChecked() {
      if (!el.checked) {
        setError("required");
      } else
        setError(false);
    }
    function validate2() {
      const value = el.value.trim();
      let error = false;
      if (!modifiers.includes("required") && isEmpty(value)) {
        setError(false);
        return false;
      }
      if (modifiers.includes("required") && isEmpty(value)) {
        setError("required");
        return false;
      }
      if (modifiers.includes("email") && !isEmail(value)) {
        error = "email address required";
      }
      if (modifiers.includes("phone") && !isPhone(value)) {
        error = "phone number required";
      }
      if (modifiers.includes("website") && !isWebsite(value)) {
        error = "website required";
      }
      if (modifiers.includes("url") && !isUrl(value)) {
        error = "full url required";
      }
      if (modifiers.includes("number") && !Number(value)) {
        error = "number required";
      }
      if (modifiers.includes("wholenumber") && !isWholeNumber(value)) {
        error = "whole number required";
      }
      setError(error);
    }
    function setError(error) {
      const parent = el.parentNode;
      if (error) {
        error = expression || error;
        console.error(`'${el.name}' validation error:`, error);
        parent.setAttribute("data-error", error);
        parent.removeAttribute("data-valid");
      } else {
        parent.removeAttribute("data-error");
        parent.setAttribute("data-valid", true);
      }
    }
    if (modifiers.includes("checked")) {
      el.addEventListener("click", validateChecked);
    } else {
      el.addEventListener("blur", validate2);
    }
  });
};
var src_default = Plugin;

// builds/module.js
var module_default = src_default;
export {
  module_default as default
};
