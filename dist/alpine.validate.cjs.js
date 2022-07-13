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
  Alpine.directive("validate", (el, {
    modifiers,
    expression
  }, { evaluate }) => {
    let options = expression ? evaluate(expression) : {};
    function validateChecked() {
      if (!el.checked) {
        setError("required");
      } else
        setError(false);
    }
    function validate() {
      const value = el.value.trim();
      let error = false;
      if (options.test === void 0 && modifiers.length === 0)
        return false;
      if (options.test !== void 0) {
        options = expression ? evaluate(expression) : {};
        if (options.test === false) {
          setError("required");
          return false;
        }
      }
      if (modifiers.includes("required") && isEmpty(value)) {
        setError("required");
        return false;
      }
      if (!modifiers.includes("required") && isEmpty(value)) {
        setError(false);
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
        error = options.error || error;
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
      el.addEventListener("blur", validate);
    }
  });
};
var src_default = Plugin;

// builds/module.js
var module_default = src_default;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
