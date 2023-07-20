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

	const getEl = (el) =>
		isHtmlElement(el)
			? el
			: document.getElementById(el) ||
			  document.querySelector(`[name ="${el}"]`);

	const getForm = (el) => el && el.closest(FORM);

	const getName = (el) => getAttr(el, "name") || getAttr(el, "id");

	const cleanText = (str) => String(str).trim();

	const getData = (strOrEl) => {
		const el = getEl(strOrEl);
		let data = formData.get(getForm(el));
		if (!data) return false;
		if (isHtmlElement(el, FORM)) return Object.values(data);
		if (isHtmlElement(el, FIELDSET))
			return Object.values(data).filter((val) => val.set === el);
		if (isHtmlElement(el, FIELD_SELECTOR)) return data[getName(el)];
	};

	/* -------------------------------------------------------------------------- */
	/*                                 Validators                                 */
	/* -------------------------------------------------------------------------- */

	const dateFormats = ["mmddyyyy", "ddmmyyyy", "yyyymmdd"];

	const yearLastDateRegex = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/;
	const yearFirstDateRegex = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/;

	function isDate(str, format = dateFormats[2]) {
		// format defaults to yyyymmdd
		const dateArray = str.split(/[-/.]/);
		const formatIndexInArray = dateFormats.indexOf(format);

		let mm, dd, yyyy;

		if (yearLastDateRegex.test(str)) {
			if (formatIndexInArray === 0) [mm, dd, yyyy] = dateArray;
			if (formatIndexInArray === 1) [dd, mm, yyyy] = dateArray;
		} else if (yearFirstDateRegex.test(str) && formatIndexInArray === 2) {
			[yyyy, mm, dd] = dateArray;
		}

		const isoFormattedStr = `${yyyy}-${mm}-${dd}`;
		const date = new Date(isoFormattedStr);

		const timestamp = date.getTime();

		if (!typeof timestamp === "number" || Number.isNaN(timestamp))
			return false;

		return date.toISOString().startsWith(isoFormattedStr);
	}

	/* -------------------------------------------------------------------------- */
	/*                       Validation Reactive Data Store                       */
	/* -------------------------------------------------------------------------- */

	const formData = new WeakMap();

	// non-reactive variable for modifiers on a per form basis
	const formModifiers = new WeakMap();

	/* -------------------------------------------------------------------------- */
	/*                           formData function                                */
	/* -------------------------------------------------------------------------- */

	function updateFormData(field, data, triggerErrorMsg) {
		// console.log("🚀 ~ file: index.js ~ line 86 ~ updateFormData ~ data", field, data, required)
		// data = {name: 'field id or name if no id', node: field, value:'field value', array:[optional used for groups], valid: true, set: form node or fieldset node}
		const form = getForm(field);
		const name = getName(field);

		// only add data if has form and field name
		if (form && name) {
			// make sure form object exists
			if (!formData.has(form)) {
				formData.set(form, Alpine.reactive({}));
			}
			let tempData = formData.get(form);

			// Add any data from formData, then name, node, and value if it's not being passed along
			data = {
				...tempData[name],
				name: name,
				node: field,
				value: field.value,
				...data,
			};

			const fieldset = data.set;

			// update required if not included
			data.required =
				data.required ||
				includes(data.mods, REQUIRED) ||
				includes(data.mods, GROUP) ||
				field.hasAttribute(REQUIRED);

			// check if disabled
			const disabled =
				field.hasAttribute("disabled") ||
				fieldset?.hasAttribute("disabled");

			const value = data.value;

			// run basic browser validity
			let valid = field.checkValidity();

			// if it is not disabled and passes browser validity then check using x-validate function
			if (!disabled && valid) {
				// If checkbox/radio then assume it's a group so update array and string value based on checked
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
					if (includes(data.mods, GROUP)) {
						const min = data.exp || 1;
						valid = tempArray.length >= min;
					}
				} else {
					// check if it's required and if there is a value
					if (data.required) valid = !!value.trim();
					// only run validation check if valid and has value
					if (valid && value) {
						// see if there is a date format
						const format = data.mods.filter(
							(val) => dateFormats.indexOf(val) !== -1
						)[0];
						for (let type of data.mods) {
							// check if mod is a validation function
							if (typeof validate[type] === "function") {
								// if it is a date then do isDate; otherwise do matching function
								valid =
									type === "date"
										? isDate(value, format)
										: validate[type](value);
								break;
							}
						}
						if (data.exp === false) valid = false;
					}
				}
			}

			data.valid = valid;

			// update with new data
			tempData[name] = data;
			// console.log("🚀 ~ file: index.js ~ line 165 ~ updateFormData ~ data", name, data.exp, data.valid, data.mods)
			formData.set(form, tempData);
		}

		if (triggerErrorMsg) toggleError(field, data.valid);
		return data;
	}

	/* -------------------------------------------------------------------------- */
	/*                            Validation Functions                            */
	/* -------------------------------------------------------------------------- */

	const validate = {};

	validate.email = (str) =>
		/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
			cleanText(str)
		);
	validate.tel = (str) =>
		/^((\+|0)\d{1,4})?[-\s.]?[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?(\d{1,2})$/.test(
			cleanText(str)
		);
	validate.website = (str) =>
		/^(https?:\/\/)?(www\.)?([-a-zA-Z0-9@:%._+~#=]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/.test(
			cleanText(str)
		);
	validate.url = (str) =>
		/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_+.~#?&/=]*)/.test(
			cleanText(str)
		);
	validate.number = (str) => !isNaN(parseFloat(str)) && isFinite(str);
	validate.integer = (str) =>
		validate.number(str) && Number.isInteger(Number(str));
	validate.wholenumber = (str) => validate.integer(str) && Number(str) > 0;
	validate.date = (str) => isDate(str);

	dateFormats.forEach((format) => {
		validate.date[format] = (str) => isDate(str, format);
	});

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
			updateFormData(el);
		}
		return data.value;
	};

	// add or update formData
	validateMagic.updateData = (field, data, triggerErrorMsg) =>
		updateFormData(getEl(field), data, triggerErrorMsg);

	// toggle error message
	validateMagic.toggleError = (field, valid) =>
		toggleError(getEl(field), valid);

	// Check if form is completed and prevent default if not
	validateMagic.submit = (e) => {
		let invalid = 0;
		getData(e.target).forEach((val) => {
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
		// if this is array then data is form or fieldset
		return Array.isArray(data)
			? !data.some((val) => !val.valid)
			: data && data.valid;
	};

	// Add validate functions to validateMagic object
	Object.keys(validate).forEach(
		(key) => (validateMagic = { ...validateMagic, [key]: validate[key] })
	);

	// Main $validate magic function
	Alpine.magic(PLUGIN_NAME, () => validateMagic);
	// $formData magic function
	Alpine.magic("formData", (el) => formData.get(getForm(getEl(el))));

	/* -------------------------------------------------------------------------- */
	/*                            x-required directive                            */
	/* -------------------------------------------------------------------------- */

	Alpine.directive(
		REQUIRED,
		(
			el,
			{
				// modifiers,
				value,
				expression,
			},
			{ evaluate }
		) => {
			// only run if has expression
			if (expression) {
				// Alpine effect watches values for changes
				Alpine.effect(() => {
					const evalExp = evaluate(expression);
					// if it has value than use that as the field name to test; otherwise evaluate the expression
					const required = value
						? getData(value)?.value === evalExp
						: evalExp;
					updateFormData(el, { required: required });
					// hide error message if not required
					if (!required) toggleError(el, true);
				});
			}
		}
	);

	/* -------------------------------------------------------------------------- */
	/*                            x-validate directive                            */
	/* -------------------------------------------------------------------------- */

	Alpine.directive(
		PLUGIN_NAME,
		(el, { modifiers, expression }, { evaluate }) => {
			/* -------------------------------------------------------------------------- */
			/*                  Directive Specific Helper Functions                       */
			/* -------------------------------------------------------------------------- */

			const form = getForm(el);

			const defaultData = (field) => {
				const parentNode =
					field.closest(".field-parent") || includes(modifiers, GROUP)
						? field.parentNode.parentNode
						: field.parentNode;
				const fieldset = field.closest(FIELDSET);
				return {
					mods: [...modifiers, field.type],
					set: fieldset,
					parentNode: parentNode,
					exp: expression && evaluate(expression),
				};
			};

			function addEvents(field) {
				// TODO: only add error message on required or validated fields
				addErrorMsg(field);
				const isClickField = includes(
					[CHECKBOX, RADIO, "range"],
					field.type
				);
				const eventType = isClickField
					? "click"
					: isHtmlElement(field, "select")
					? "change"
					: "blur";
				addEvent(field, eventType, checkIfValid);
				if (includes(modifiers, INPUT) && !isClickField)
					addEvent(field, INPUT, checkIfValid);
			}

			/* -------------------------------------------------------------------------- */
			/*                 If x-validate on <form> validate all fields                */
			/* -------------------------------------------------------------------------- */

			if (isHtmlElement(el, FORM)) {
				// el is form
				// disable in-browser validation
				if (!modifiers.includes("use-browser")) {
					el.setAttribute("novalidate", true);
				}

				// save all form modifiers
				formModifiers.set(form, modifiers);

				const fields = el.querySelectorAll(FIELD_SELECTOR);

				// bind reset with resetting all formData
				addEvent(el, "reset", () => {
					el.reset();
					const data = getData(el);
					// need a short delay for reset to take effect and reread values
					setTimeout(() => {
						data.forEach((field) => updateFormData(field.node));
					}, 50);
				});

				fields.forEach((field) => {
					if (getName(field)) {
						updateFormData(field, defaultData(field));
						// Don't add events or error msgs if it doesn't have a name/id or has x-validate on it so we aren't duplicating function
						// TODO: somehow detect if this is a group of checkboxes or radio buttons with required. Might need to run a forEach twice?
						if (
							!field
								.getAttributeNames()
								.some((attr) =>
									attr.includes(`x-${PLUGIN_NAME}`)
								)
						) {
							addEvents(field);
						}
					}
				});
			}

			/* -------------------------------------------------------------------------- */
			/*      If x-validate on input, select, or textarea validate this field       */
			/* -------------------------------------------------------------------------- */

			// Only add if has name/id and and is field
			if (getName(el) && isHtmlElement(el, FIELD_SELECTOR)) {
				const formMods = formModifiers.has(form)
					? formModifiers.get(form)
					: [];
				// include form level modifiers so they are also referenced
				modifiers = [...modifiers, ...formMods];
				// el is field element
				updateFormData(el, defaultData(el));
				addEvents(el);
			}

			/* -------------------------------------------------------------------------- */
			/*                           Check Validity Function                          */
			/* -------------------------------------------------------------------------- */

			function checkIfValid(e) {
				const field = this;
				const mods = getData(field).mods;

				/* --- Update formData with value and expression and trigger error message --- */
				const updatedData = updateFormData(
					field,
					{ exp: expression && evaluate(expression) },
					true
				);

				// add input event to blur events once it fails the first time

				if (
					!updatedData.valid &&
					!includes(mods, "bluronly") &&
					e.type === "blur"
				) {
					addEvent(field, INPUT, checkIfValid);
				}
				// refocus if modifier is enabled
				if (!updatedData.valid && includes(mods, "refocus"))
					field.focus();

				return updatedData.valid;
			}
		}
	);
	/* ------------------------- End Validate Directive ------------------------- */

	/* -------------------------------------------------------------------------- */
	/*                            Toggle Error Message                            */
	/* -------------------------------------------------------------------------- */

	function toggleError(field, valid) {
		const parentNode = getData(field).parentNode;

		const errorMsgNode = getErrorMsgFromId(field);

		/* ---------------------------- Set aria-invalid ---------------------------- */
		setAttr(field, "aria-invalid", !valid);

		/* ------------------ Check valid and set and remove error ------------------ */
		if (valid) {
			// console.log(`${name} valid`);
			setAttr(errorMsgNode, HIDDEN);
			parentNode.removeAttribute(DATA_ERROR);
			// hideErrorMsg()
		} else {
			// console.log(`${name} not valid`);
			errorMsgNode.removeAttribute(HIDDEN);
			setAttr(parentNode, DATA_ERROR, errorMsgNode.textContent);
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

	/* -------------- Helper function to get error msg node from id ------------- */

	function getErrorMsgFromId(field) {
		const name = getName(field);
		const form = getForm(field);
		return form.querySelector(`#${ERROR_MSG_CLASS}-${name}`);
	}

	/* ------ Function to setup errorMsgNode by finding it or creating one ------ */

	function addErrorMsg(field) {
		const name = getName(field);
		const errorMsgId = `${ERROR_MSG_CLASS}-${name}`;
		const fieldData = getData(field);

		// set targetNode. The span.error-msg typically appears after the field but groups assign it to set after the wrapper
		const targetNode = includes(fieldData.mods, GROUP)
			? fieldData.parentNode
			: field;

		/* --------------------- Find or Make Error Message Node -------------------- */

		// If there is an adjacent error message with the right id or class then use that. If not create one.
		const span = document.createElement("span");
		span.className = ERROR_MSG_CLASS;

		// If there already is an error-msg with the proper id in the form than use that
		const errorMsg = getErrorMsgFromId(field);

		const errorMsgNode =
			errorMsg || findSiblingErrorMsgNode(targetNode) || span;

		// add id tag and hidden attribute
		setAttr(errorMsgNode, "id", errorMsgId);
		setAttr(errorMsgNode, HIDDEN);

		// add error text if it isn't already there
		if (!errorMsgNode.innerHTML)
			errorMsgNode.textContent =
				getAttr(targetNode, DATA_ERROR_MSG) ||
				`${name.replace(/[-_]/g, " ")} ${REQUIRED}`;

		// Add aria-errormessage using the ID to field
		setAttr(field, "aria-errormessage", errorMsgId);

		//  Only add element if it does not yet exist
		if (!getEl(errorMsgId)) targetNode.after(errorMsgNode);
	}
};

export default Plugin;
