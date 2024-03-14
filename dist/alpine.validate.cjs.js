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
  const FORM = "form";
  const FIELDSET = "fieldset";
  const FIELD_SELECTOR = `input:not([type="search"], [type="reset"], [type="submit"]),select,textarea`;
  const HIDDEN = "hidden";
  const isHtmlElement = (el, type) => {
    const isInstanceOfHTML = el instanceof HTMLElement;
    return type ? isInstanceOfHTML && el.matches(type) : isInstanceOfHTML;
  };
  const includes = (array, string) => Array.isArray(array) && array.includes(string);
  const addEvent = (el, event, callback) => el.addEventListener(event, callback);
  const getAttr = (el, attr) => el.getAttribute(attr);
  const setAttr = (el, attr, value = "") => el.setAttribute(attr, value);
  const getEl = (el, parent = document) => isHtmlElement(el) ? el : parent.querySelector(`#${el}`) || parent.querySelector(`[name ="${el}"]`);
  const getForm = (el) => el && el.closest(FORM);
  const getName = (el) => getAttr(el, "name") || getAttr(el, "id");
  const getMakeId = (el) => {
    const id = getAttr(el, "id");
    if (id)
      return id;
    const randomId = `${el.tagName.toLowerCase()}-${Math.random().toString(36).substring(2, 9)}`;
    setAttr(el, "id", randomId);
    return randomId;
  };
  const getData = (strOrEl) => {
    const el = getEl(strOrEl);
    let data = formData.get(getForm(el));
    if (!data)
      return false;
    if (isHtmlElement(el, FORM))
      return Object.values(data);
    if (isHtmlElement(el, FIELDSET)) {
      const fields = el.querySelectorAll(FIELD_SELECTOR);
      return Object.values(data).filter((val) => Array.from(fields).some((el2) => val.node === el2));
    }
    if (isHtmlElement(el, FIELD_SELECTOR))
      return data[getName(el)];
  };
  function getCommonAncestor(selector, searchArea = document) {
    const elems = searchArea.querySelectorAll(selector);
    if (elems.length < 1)
      return null;
    if (elems.length < 2)
      return elems[0];
    const range = document.createRange();
    range.setStart(elems[0], 0);
    range.setEnd(elems[elems.length - 1], elems[elems.length - 1].childNodes.length);
    return range.commonAncestorContainer;
  }
  const formData = new WeakMap();
  function updateFieldData(field, data, triggerErrorMsg) {
    var _a, _b;
    const form = getForm(field);
    const name = getName(field);
    if (form && name) {
      if (!formData.has(form)) {
        formData.set(form, Alpine.reactive({}));
      }
      let tempData = formData.get(form);
      const disabled = field.matches(":disabled");
      const required = field.required;
      data = {
        ...tempData[name],
        name,
        node: field,
        value: disabled ? "" : field.value,
        required,
        disabled,
        ...data
      };
      const value = data.value;
      let valid = field.checkValidity();
      if (!data.disabled && valid) {
        if (includes(["checkbox", "radio"], field.type)) {
          let tempArray = data.array || [];
          if (field.type === "checkbox") {
            if (field.checked && !tempArray.includes(value))
              tempArray.push(value);
            if (!field.checked)
              tempArray = tempArray.filter((val) => val !== value);
          }
          if (field.type === "radio" && field.checked)
            tempArray = [value];
          data.array = tempArray;
          data.value = tempArray.toString();
          console.log("checking validation", field.name);
          if ((_a = data.parentNode) == null ? void 0 : _a.dataset.group) {
            const min = parseInt((_b = data.parentNode) == null ? void 0 : _b.dataset.group) || 1;
            valid = tempArray.length >= min;
          }
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
  function updateData(el, data, triggerErrorMsg) {
    if (isHtmlElement(el, FORM) || isHtmlElement(el, FIELDSET)) {
      const data2 = getData(el);
      data2.forEach((item) => {
        return updateFieldData(item.node);
      });
    }
    if (isHtmlElement(el, FIELD_SELECTOR))
      return updateFieldData(el, data, triggerErrorMsg);
  }
  let validateMagic = {};
  validateMagic.data = (el) => getData(el);
  validateMagic.formData = (el) => formData.get(getForm(getEl(el)));
  validateMagic.value = (el, value) => {
    el = getEl(el);
    const data = getData(el);
    if (!data)
      return false;
    if (Array.isArray(data)) {
      return data.reduce((result, item) => {
        result[item.name] = item.value;
        return result;
      }, {});
    }
    if (value) {
      data.value = value;
      el.value = value;
      updateFieldData(el);
    }
    return data.value;
  };
  validateMagic.updateData = (el, data, triggerErrorMsg) => updateData(getEl(el), data, triggerErrorMsg);
  validateMagic.toggleError = (field, valid) => toggleError(getEl(field), valid);
  validateMagic.submit = (e) => {
    let invalid = 0;
    getData(e.target).forEach((val) => {
      val = updateData(val.node);
      if (val.valid === false) {
        invalid++;
        if (invalid === 1)
          val.node.focus();
        toggleError(val.node, false);
        e.preventDefault();
        console.error(`${val.name} required`);
      }
    });
  };
  validateMagic.isComplete = (el) => {
    const data = getData(el);
    return Array.isArray(data) ? !data.some((val) => !val.valid) : data && data.valid;
  };
  Alpine.magic(PLUGIN_NAME, () => validateMagic);
  Alpine.magic("formData", (el) => formData.get(getForm(getEl(el))));
  Alpine.directive(PLUGIN_NAME, (el, { modifiers }) => {
    const watchElement = (element) => {
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          const target = mutation.target;
          if (mutation.type === "attributes") {
            const attr = mutation.attributeName;
            if (target.matches(FIELD_SELECTOR) && ["disabled", "required", "value"].includes(attr)) {
              console.log("mutation", target, attr);
              updateData(target);
            }
            if (target.matches(FIELDSET) && attr === "disabled") {
              updateData(target);
            }
          }
        }
      });
      observer.observe(element, {
        attributes: true,
        childList: true,
        subtree: true
      });
      return observer;
    };
    const defaultData = (field) => {
      let parentNode;
      if (isHtmlElement(field, "[type=checkbox], [type=radio]")) {
        const form = getForm(field);
        const inputs = form.querySelectorAll(`[name=${field.name}]`);
        if (inputs.length > 1) {
          parentNode = getCommonAncestor(`[name=${field.name}]`, form);
        }
      }
      const mods = [...modifiers, field.type];
      const required = field.required;
      const disabled = field.matches(":disabled");
      return {
        mods,
        required,
        disabled,
        parentNode
      };
    };
    if (isHtmlElement(el, FORM)) {
      const form = el;
      watchElement(form);
      if (!modifiers.includes("use-browser")) {
        setAttr(form, "novalidate", "true");
      }
      if (modifiers.includes("validate-on-submit")) {
        form.addEventListener("submit", function(e) {
          validateMagic.submit(e);
        });
      }
      const fields = form.querySelectorAll(FIELD_SELECTOR);
      addEvent(form, "reset", () => {
        form.reset();
        const data = getData(form);
        setTimeout(() => {
          data.forEach((field) => updateFieldData(field.node));
        }, 50);
      });
      fields.forEach((field) => {
        updateFieldData(field, defaultData(field));
        addErrorMsg(field);
      });
      form.addEventListener("input", (e) => {
        const field = e.target;
        console.log("input", field.name);
        updateFieldData(field);
        if (isHtmlElement(field, "select, input[type=checkbox], input[type=radio], input[type=range]")) {
          checkError(field);
        }
      });
      form.addEventListener("focusout", (e) => {
        const field = e.target;
        if (!isHtmlElement(field, "select, input[type=checkbox], input[type=radio], input[type=range]")) {
          console.log("focusout", field.name);
          checkError(field);
        }
      });
    }
  });
  function checkError(field) {
    const data = getData(field);
    toggleError(field, data.valid);
  }
  function toggleError(field, valid) {
    console.log("toggleError", field, valid);
    const targetNode = getData(field).parentNode || field;
    const errorMsgNode = document.getElementById(getAttr(field, "aria-errormessage"));
    setAttr(field, "aria-invalid", !valid);
    if (valid) {
      field.setCustomValidity("");
      setAttr(errorMsgNode, HIDDEN);
      targetNode.removeAttribute(DATA_ERROR);
    } else {
      errorMsgNode.removeAttribute(HIDDEN);
      field.setCustomValidity("Invalid");
      setAttr(targetNode, DATA_ERROR, errorMsgNode.textContent);
    }
  }
  function findSiblingErrorMsgNode(el) {
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
    const fieldData = getData(field);
    const targetNode = fieldData.parentNode || field.closest("label") || field;
    const span = document.createElement("span");
    span.className = ERROR_MSG_CLASS;
    const errorMsgNode = document.getElementById(`${ERROR_MSG_CLASS}-${getAttr(targetNode, "id")}`) || findSiblingErrorMsgNode(targetNode) || span;
    const id = getMakeId(targetNode);
    const errorMsgId = `${ERROR_MSG_CLASS}-${id}`;
    if (getAttr(errorMsgNode, "id") !== errorMsgId) {
      setAttr(errorMsgNode, "id", errorMsgId);
    }
    setAttr(errorMsgNode, HIDDEN);
    const name = getName(field);
    if (!errorMsgNode.innerHTML)
      errorMsgNode.textContent = getAttr(targetNode, DATA_ERROR_MSG) || `${name.replace(/[-_]/g, " ")} required`;
    setAttr(field, "aria-errormessage", errorMsgId);
    if (!getEl(errorMsgId, getForm(field)))
      targetNode.after(errorMsgNode);
  }
};
var src_default = Plugin;

// builds/module.js
var module_default = src_default;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
