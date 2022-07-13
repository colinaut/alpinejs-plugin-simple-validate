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
  Alpine.directive("validate", (el, {
    modifiers,
    expression
  }) => {
    const isEmail = (txt) => {
      return String(txt).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    };
    const isPhone = (txt) => {
      return String(txt).toLowerCase().match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/);
    };
    const isDomain = (txt) => {
      return String(txt).toLowerCase().match(/^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/);
    };
    const isUrl = (txt) => {
      return String(txt).toLowerCase().match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/);
    };
    function validateChecked() {
      if (!el.checked) {
        setError("required");
      } else
        setError(false);
    }
    function validate() {
      const value = el.value.trim();
      let error = false;
      if (!modifiers.includes("required") && value === "") {
        setError(false);
        return false;
      }
      if (modifiers.includes("required") && value === "") {
        error = "required";
      }
      if (modifiers.includes("email") && !isEmail(value)) {
        error = "email address required";
      }
      if (modifiers.includes("phone") && !isPhone(value)) {
        error = "phone number required";
      }
      if (modifiers.includes("website") && !isDomain(value)) {
        error = "website required";
      }
      if (modifiers.includes("url") && !isUrl(value)) {
        error = "full url required";
      }
      setError(error);
    }
    function setError(error) {
      if (error) {
        error = expression || error;
        console.error(`'${el.name}' validation error:`, error);
        el.parentNode.setAttribute("data-error", error);
      } else {
        el.parentNode.removeAttribute("data-error");
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
