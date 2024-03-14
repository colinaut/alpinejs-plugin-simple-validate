const Plugin = function (Alpine) {
	// TODO: build some tests for this

	/* -------------------------------------------------------------------------- */
	/*                              STRING CONSTANTS                              */
	/* -------------------------------------------------------------------------- */
	/* ------------------- Named attributes used multiple times ------------------ */
	const DATA_ERROR = "data-error";
	const DATA_ERROR_MSG = `${DATA_ERROR}-msg`;
	const ERROR_MSG_CLASS = "error-msg";
	const PLUGIN_NAME = "validate";

	/* ----------------- These are just for better minification ------------------ */

	const REQUIRED = "required";
	const INPUT = "input";
	const CHECKBOX = "checkbox";
	const RADIO = "radio";
	const GROUP = "group";
	const FORM = "form";
	const FIELDSET = "fieldset";
	const notType = (type) => `:not([type="${type}"])`;
	const FIELD_SELECTOR = `${INPUT}${notType("search")}${notType(
		"reset"
	)}${notType("submit")},select,textarea`;
	const HIDDEN = "hidden";

	/* -------------------------------------------------------------------------- */
	/*                              Helper Functions                              */
	/* -------------------------------------------------------------------------- */

	const isHtmlElement = (el, type) => {
		const isInstanceOfHTML = el instanceof HTMLElement;
		return type ? isInstanceOfHTML && el.matches(type) : isInstanceOfHTML;
	};

	const includes = (array, string) =>
		Array.isArray(array) && array.includes(string);

	const addEvent = (el, event, callback) =>
		el.addEventListener(event, callback);

	const getAttr = (el, attr) => el.getAttribute(attr);

	const setAttr = (el, attr, value = "") => el.setAttribute(attr, value);

	const getEl = (el, parent = document) =>
		isHtmlElement(el)
			? el
			: parent.querySelector(`#${el}`) ||
			  parent.querySelector(`[name ="${el}"]`);

	const getForm = (el) => el && el.closest(FORM);

	// Used for field data naming
	const getName = (el) => getAttr(el, "name") || getAttr(el, "id");
	// Used for error msg id
	const getMakeId = (el) => {
		const id = getAttr(el, "id");
		if (id) return id;
		const randomId = `${el.tagName.toLowerCase()}-${Math.random()
			.toString(36)
			.substring(2, 9)}`;
		setAttr(el, "id", randomId);
		return randomId;
	};

	const getData = (strOrEl) => {
		const el = getEl(strOrEl);
		let data = formData.get(getForm(el));
		if (!data) return false;
		if (isHtmlElement(el, FORM)) return Object.values(data);
		if (isHtmlElement(el, FIELDSET)) {
			// return all the sub fields that match. This allows for nested fieldsets
			// TODO: make this more performant. Maybe set up to add data.disabled
			const fields = el.querySelectorAll(FIELD_SELECTOR);
			return Object.values(data).filter((val) =>
				Array.from(fields).some((el) => val.node === el)
			);
		}
		if (isHtmlElement(el, FIELD_SELECTOR)) return data[getName(el)];
	};

	/**
	 * Get the common ancestor of two or more elements
	 * {@link https://gist.github.com/kieranbarker/cd86310d0782b7c52ce90cd7f45bb3eb}
	 * @param {String} selector A valid CSS selector
	 * @returns {Element} The common ancestor
	 */
	function getCommonAncestor(selector, searchArea = document) {
		// Get the elements matching the selector
		const elems = searchArea.querySelectorAll(selector);

		// If there are no elements, return null
		if (elems.length < 1) return null;

		// If there's only one element, return it
		if (elems.length < 2) return elems[0];

		// Otherwise, create a new Range
		const range = document.createRange();

		// Start at the beginning of the first element
		range.setStart(elems[0], 0);

		// Stop at the end of the last element
		range.setEnd(
			elems[elems.length - 1],
			elems[elems.length - 1].childNodes.length
		);

		// Return the common ancestor
		return range.commonAncestorContainer;
	}

	/* -------------------------------------------------------------------------- */
	/*                       Validation Reactive Data Store                       */
	/* -------------------------------------------------------------------------- */

	const formData = new WeakMap();

	/* -------------------------------------------------------------------------- */
	/*                           formData function                                */
	/* -------------------------------------------------------------------------- */

	function updateFieldData(field, data, triggerErrorMsg) {
		console.log("🚀 ~ updateFieldData", field, data);
		// data = {name: 'field id or name if no id', node: field, value:'field value', array:[optional used for groups], valid: true, required: false, disabled: false}
		const form = getForm(field);
		const name = getName(field);

		// only add data if has form and field name
		if (form && name) {
			// make sure form object exists
			if (!formData.has(form)) {
				formData.set(form, Alpine.reactive({}));
			}
			let tempData = formData.get(form);

			// check if field disabled
			const disabled = field.matches(":disabled");

			// update required if not included
			const required = field.required;

			// Add any data from formData, then name, node, and value if it's not being passed along
			data = {
				...tempData[name],
				name,
				node: field,
				value: disabled ? "" : field.value,
				required,
				disabled,
				...data,
			};

			const value = data.value;

			// run basic browser validity
			let valid = field.checkValidity();

			// if it is not disabled and passes browser validity then check using x-validate function
			if (!data.disabled && valid) {
				// If checkbox/radio then assume it's a group so update array and string value based on checked
				// TODO: reimplement grouping validation.
				if (includes([CHECKBOX, RADIO], field.type)) {
					if (data.required) valid = field.checked;
					// data.array acts as a store of current selected values
					let tempArray = data.array || [];

					if (field.type === CHECKBOX) {
						if (field.checked && !tempArray.includes(value))
							tempArray.push(value);
						if (!field.checked)
							tempArray = tempArray.filter(
								(val) => val !== value
							);
					}

					// Radio buttons only can select one so max array is 1.
					if (field.type === RADIO && field.checked)
						tempArray = [value];

					// update with revised array
					data.array = tempArray;
					// update value with string of array items
					data.value = tempArray.toString();
					// if group than run valid based on group min number
					// TODO: reimplement grouping validation.
					if (data.parentNode?.dataset.group) {
						const min =
							parseInt(data.parentNode?.dataset.group) || 1;
						valid = tempArray.length >= min;
					}
				}
			}

			data.valid = valid;

			// update with new data
			tempData[name] = data;
			// console.log("🚀 ~ file: index.js ~ line 165 ~ updateFieldData ~ data", name, data.exp, data.valid, data.mods)
			formData.set(form, tempData);
		}

		if (triggerErrorMsg) toggleError(field, data.valid);
		return data;
	}

	function updateData(el, data, triggerErrorMsg) {
		if (isHtmlElement(el, FORM) || isHtmlElement(el, FIELDSET)) {
			const data = getData(el);
			data.forEach((item) => {
				return updateFieldData(item.node);
			});
		}
		if (isHtmlElement(el, FIELD_SELECTOR))
			return updateFieldData(el, data, triggerErrorMsg);
	}

	/* -------------------------------------------------------------------------- */
	/*                          Validate Magic Function                           */
	/* -------------------------------------------------------------------------- */
	let validateMagic = {};
	// Display reactive formData
	validateMagic.data = (el) => getData(el);
	validateMagic.formData = (el) => formData.get(getForm(getEl(el)));
	validateMagic.value = (el, value) => {
		el = getEl(el);
		const data = getData(el);
		if (!data) return false;

		// If data is array this el is a form or fieldset
		if (Array.isArray(data)) {
			return data.reduce((result, item) => {
				result[item.name] = item.value;
				return result;
			}, {});
		}

		// If value is passed than update the field and the formData; otherwise return value
		if (value) {
			data.value = value;
			el.value = value;
			updateFieldData(el);
		}
		return data.value;
	};

	// add or update formData
	validateMagic.updateData = (el, data, triggerErrorMsg) =>
		updateData(getEl(el), data, triggerErrorMsg);

	// toggle error message
	validateMagic.toggleError = (field, valid) =>
		toggleError(getEl(field), valid);

	// Check if form is completed and prevent default if not
	validateMagic.submit = (e) => {
		let invalid = 0;
		getData(e.target).forEach((val) => {
			// double check validation
			val = updateData(val.node);
			if (val.valid === false) {
				invalid++;
				// focus on first invalid field
				if (invalid === 1) val.node.focus();
				toggleError(val.node, false);
				e.preventDefault();
				// eslint-disable-next-line no-console -- this error helps with submit and is the only one that should stay in production.
				console.error(`${val.name} ${REQUIRED}`);
			}
		});
	};

	// isComplete works for the form as a whole and fieldsets using either the node itself or the id
	validateMagic.isComplete = (el) => {
		const data = getData(el);
		return Array.isArray(data)
			? !data.some((val) => !val.valid)
			: data && data.valid;
	};

	// Main $validate magic function
	Alpine.magic(PLUGIN_NAME, () => validateMagic);
	// $formData magic function
	Alpine.magic("formData", (el) => formData.get(getForm(getEl(el))));

	/* -------------------------------------------------------------------------- */
	/*                            x-validate directive                            */
	/* -------------------------------------------------------------------------- */

	Alpine.directive(PLUGIN_NAME, (el, { modifiers }) => {
		/* -------------------------------------------------------------------------- */
		/*                  Directive Specific Helper Functions                       */
		/* -------------------------------------------------------------------------- */

		// MutationObserver that watches for changes with required or disabled
		const watchElement = (element) => {
			// Create a new MutationObserver instance
			const observer = new MutationObserver((mutationsList) => {
				for (const mutation of mutationsList) {
					const target = mutation.target;
					if (mutation.type === "attributes") {
						const attr = mutation.attributeName;
						if (
							target.matches(FIELD_SELECTOR) &&
							["disabled", "required", "value"].includes(attr)
						) {
							console.log("mutation", target, attr);
							updateData(target);
						}
						if (target.matches(FIELDSET) && attr === "disabled") {
							updateData(target);
						}
					}
				}
			});

			// Start observing the element for attribute changes
			observer.observe(element, {
				attributes: true,
				childList: true,
				subtree: true,
			});

			// Return the observer instance in case you want to disconnect it later
			return observer;
		};

		const defaultData = (field) => {
			let parentNode;
			// If checkbox or radio group then find common ancestor parentNode
			if (isHtmlElement(field, "[type=checkbox], [type=radio]")) {
				const form = getForm(field);
				const inputs = form.querySelectorAll(`[name=${field.name}]`);
				if (inputs.length > 1) {
					parentNode = getCommonAncestor(
						`[name=${field.name}]`,
						form
					);
				}
			}

			const mods = [...modifiers, field.type];

			const required = field.required;

			const disabled = field.matches(":disabled");

			return {
				mods,
				required,
				disabled,
				parentNode,
			};
		};

		/* -------------------------------------------------------------------------- */
		/*                 If x-validate on <form> validate all fields                */
		/* -------------------------------------------------------------------------- */

		if (isHtmlElement(el, FORM)) {
			// form is form

			const form = el;

			watchElement(form);
			// disable in-browser validation
			if (!modifiers.includes("use-browser")) {
				setAttr(form, "novalidate", "true");
			}

			if (modifiers.includes("validate-on-submit")) {
				form.addEventListener("submit", function (e) {
					validateMagic.submit(e);
				});
			}

			// Find all fields in the form
			const fields = form.querySelectorAll(FIELD_SELECTOR);

			// bind reset with resetting all formData
			addEvent(form, "reset", () => {
				form.reset();
				const data = getData(form);
				// need a short delay for reset to take effect and reread values
				setTimeout(() => {
					data.forEach((field) => updateFieldData(field.node));
				}, 50);
			});

			fields.forEach((field) => {
				// update data for every field
				updateFieldData(field, defaultData(field));
				addErrorMsg(field);
			});
			// add event listener to form to update formData
			// TODO: add input event after initial invalidation (see checkIfValid() function)
			// TODO: add refocus if mod set. Revise how refocus for individual fields
			// TODO: allow input for all or blur only
			form.addEventListener("input", (e) => {
				const field = e.target;
				console.log("input", field.name);
				updateFieldData(field);
				if (
					isHtmlElement(
						field,
						"select, input[type=checkbox], input[type=radio], input[type=range]"
					)
				) {
					checkError(field);
				}
			});
			form.addEventListener("focusout", (e) => {
				const field = e.target;
				if (
					!isHtmlElement(
						field,
						"select, input[type=checkbox], input[type=radio], input[type=range]"
					)
				) {
					console.log("focusout", field.name);
					checkError(field);
				}
			});
		}
	});
	/* ------------------------- End Validate Directive ------------------------- */

	/* -------------------------------------------------------------------------- */
	/*                            Toggle Error Message                            */
	/* -------------------------------------------------------------------------- */

	function checkError(field) {
		const data = getData(field);
		toggleError(field, data.valid);
	}

	function toggleError(field, valid) {
		console.log("toggleError", field, valid);
		const targetNode = getData(field).parentNode || field;

		const errorMsgNode = document.getElementById(
			getAttr(field, "aria-errormessage")
		);

		/* ---------------------------- Set aria-invalid ---------------------------- */
		setAttr(field, "aria-invalid", !valid);

		/* ------------------ Check valid and set and remove error ------------------ */
		if (valid) {
			// console.log(`${name} valid`);
			field.setCustomValidity("");
			setAttr(errorMsgNode, HIDDEN);
			targetNode.removeAttribute(DATA_ERROR);
			// hideErrorMsg()
		} else {
			// console.log(`${field.name} not valid`);
			errorMsgNode.removeAttribute(HIDDEN);
			// TODO: make this work with the custom error message?
			field.setCustomValidity("Invalid");
			setAttr(targetNode, DATA_ERROR, errorMsgNode.textContent);
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                        Set Up Error Msg Node in DOM                        */
	/* -------------------------------------------------------------------------- */

	/* ------------ Helper function to find sibling error msg node -------------- */

	function findSiblingErrorMsgNode(el) {
		while (el) {
			// jump to next sibling element
			el = el.nextElementSibling;
			// return el if matches class name
			if (isHtmlElement(el, `.${ERROR_MSG_CLASS}`)) return el;
			// Stop searching if it hits another field
			if (isHtmlElement(el, FIELD_SELECTOR)) return false;
		}
		return false;
	}

	/* ------ Function to setup errorMsgNode by finding it or creating one ------ */

	function addErrorMsg(field) {
		// get fieldData
		const fieldData = getData(field);

		// set targetNode. The span.error-msg typically appears after the field but groups assign it to set after the wrapper
		const targetNode =
			fieldData.parentNode || field.closest("label") || field;

		/* --------------------- Find or Make Error Message Node -------------------- */

		// If there is an adjacent error message with the right id or class then use that. If not create one.
		const span = document.createElement("span");
		span.className = ERROR_MSG_CLASS;

		// If there already is an error-msg with the proper id in the form than use that; else find sibling error msg with error-msg class; else use generated span.

		const errorMsgNode =
			document.getElementById(
				`${ERROR_MSG_CLASS}-${getAttr(targetNode, "id")}`
			) ||
			findSiblingErrorMsgNode(targetNode) ||
			span;

		// get field id or make one if it doesn't exist
		const id = getMakeId(targetNode);

		// set error msg id
		const errorMsgId = `${ERROR_MSG_CLASS}-${id}`;

		// if id doesn't match then set it
		if (getAttr(errorMsgNode, "id") !== errorMsgId) {
			setAttr(errorMsgNode, "id", errorMsgId);
		}

		// add hidden attribute
		setAttr(errorMsgNode, HIDDEN);

		// add error text if it isn't already there
		const name = getName(field);
		if (!errorMsgNode.innerHTML)
			errorMsgNode.textContent =
				getAttr(targetNode, DATA_ERROR_MSG) ||
				`${name.replace(/[-_]/g, " ")} ${REQUIRED}`;

		// Add aria-errormessage using the ID to field
		setAttr(field, "aria-errormessage", errorMsgId);

		//  Only add element if it does not yet exist
		if (!getEl(errorMsgId, getForm(field))) targetNode.after(errorMsgNode);
	}
};

export default Plugin;
