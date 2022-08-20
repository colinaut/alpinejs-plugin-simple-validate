# AlpineJS Plugin — Simple Form Validation

![](https://img.shields.io/bundlephobia/min/@colinaut/alpinejs-plugin-simple-validate)
![](https://img.shields.io/npm/v/@colinaut/alpinejs-plugin-simple-validate)

Very simple form validation plugin for [AlpineJS](https://alpinejs.dev). This plugin is designed, like AlpineJS itself, to be sprinkled in as needed. What this plugin does not do is impose an opinionated structure for your form data or functionality. It can be used with or without x-model.

The x-validate directive allows for simple validation and error display. It also captures all form data in a reactive formData. The $validate magic function grants access to validation functions, formData, and simple submit validation check.

## Update 1.7

Version 1.7 adds x-required directive for toggling if the field is required.

* The magic functions isRequired and makeRequired have been removed. You can check if the field is required by using `$validate.data('name').required`
* Added some customization options for targeting parent element and placement of error message.
* 1.7.2: checks for validity on init, incase values are already set due to browser back button, value, or x-model.
* 1.7.3: fix for x-validate mods on multiple forms on the same page; code clean up.

## Simple Usage

Add a `x-data`, and `x-validate` to your `<form>` element (you don't need any variables on x-data ; it just needs to be initiated as an Alpine component). This automatically:

* Captures all data to a reactive formData[form] array which updates on blur or click (depending on field type).
* Validates onblur using basic browser checkValidity() checking `required` attribute and input types.
* Uses built-in improved regex validation for required, email, tel, and url type fields, since the browser versions are limited.
* Automatically adds a hidden `span.error-msg` with error message adjacent to the field.
  * You will need to style this yourself (*see Example below*)
* When the validity check fails, it...
  * Adds `aria-invalid="true"` and `aria-errormessage` attributes to the field element.
  * Reveals the error message in by removing the `hidden` attribute.
  * Also adds a superfluous `data-error="{error message}"` on the field's parent element for any additional styling you may want (searches for closest `field-parent` class parent element or failing that uses `.parentNode`).
  * After blur triggers invalid, it adds 'input' event listener for validation as well as 'blur'
* If valid is triggered, it reverses all the above
* Use `:disabled="$validate.isFormComplete('formId')"` to disable submit button and/or use `@submit="$validate.submit"` to automatically check validity of all fields prior to submitting.

## Custom Usage

* Use `x-validate` directive along with modifiers directly on form fields to add additional validation, such as  `x-validate.wholenumber`
* Write a custom error message one of two ways:
  * Add `data-error-msg='custom error message'` on field itself
  * Add a sibling element with `error-msg` class and write your own error message there. The plugin searches all next siblings and will add the proper aria-errormessage linked id tags for you. This is also useful if you want some descriptive text or other element before the error message or if you want to use special styling to a specific error message.
  * Add an element with the correct id attribute anywhere on the page (id is `error-msg-${name}`) and it will use that.
* Use `x-validate.group` on groups of checkboxes or radio buttons to validate that at least one is selected.
* Add a specific test to a field like `x-validate='$el.value === 'bunny'`; this can be paired up with other validations. For example: `x-validate.website='$el.includes('bunny')` for only websites with the word bunny in the name.
* Use `$validate.isComplete(el)` to detect if the form, `<fieldset>` groups or any field is completed
* Use `x-required` directive with a boolean function to set if a field is required or not. This is useful for if you have a field that only shows when another field is set to a certain value. For example if a select field has an 'other' option and you want an 'other' text field.
* You can an skip `x-validate` on the `<form>` and just add `x-validate` on fields directly if you only want a couple fields validated. The x-data is still required on `<form>`.
* The examples folder in the git repo shows some of what you can do with this plugin.

## Directive x-validate

### Form Element Directives and UI Modifiers

The UI modifiers are mainly for setting global defaults on `<form>` but you can also be used on individual form field elements for more specific control.

* `x-validate` triggers validation and captures formData for entire form
* `x-validate.bluronly` — change the default never to use 'input' event listener on fillable form fields
* `x-validate.input` sets fields to use both 'blur' and 'input' event listener for all validation
* `x-validate.refocus` sets fields to force focus on form element when invalid

### Field Element Directives

Used on `<input>`, `<select>`, `<textarea>`

* `x-validate` — only useful on its own if not set on `<form>`
* `x-validate.required` — replacement for `required` attribute *
* `x-validate.tel` - works the same as type='tel' using improved regex *
* `x-validate.email` - works the same as type='email' using improved regex *
* `x-validate.website` — valid if site domain, with or without http:// or https://
* `x-validate.url` — works the same as type='url' using improved regex *
* `x-validate.number` — valid if number (positive or negative; integer or decimal)
* `x-validate.integer` — valid if integer number (positive or negative)
* `x-validate.wholenumber` — valid if whole number (positive integer)
* Date validation: allows for / or - or . between units
  * `x-validate.date` defaults to 'yyyy-mm-dd' format, as that is what `type='date'` input field saves the date as
  * `x-validate.date.mmddyyyy` — 'mm-dd-yyyy' format
  * `x-validate.date.ddmmyyyy` — 'dd-mm-yyyy' format
  * `x-validate.date.yyyymmdd` — 'yyyy-mm-dd' format
  * *If you want more complicated validation I recommend [dayjs](https://github.com/iamkun/dayjs)*

\* this allows you to use `x-validate.required` instead of `required` attribute or `x-validate.tel` on `type='text'` instead of `type='tel'`

### Checkbox and Radio Button Groups

Checkboxes and radio buttons that share the same name attribute update the same formData field data object. Radio buttons update the value with the currently selected button. Checkboxes save as both a comma separated string value and as an array.

You can validate that at least one is selected by adding `x-validate.group` to every checkbox or radio button in a named group. If you want the user to select multiple checkboxes, use an added expression with the minimum number `x-validate.group="2"`.

***Note:** Checkbox and radio button groups add their error message after the wrapper for the group. This is either the closest `field-parent` class parent element or it uses `.parentNode.parentNode` by default. It's assumed that each checkbox/radio is wrapped in a label or list item, and then has a wrapper around the group.*

## Directive x-required

The x-required directive is used on a field if you want to toggle required depending on another field value or other variable. 

* x-required="expression" — evaluates the expression as a boolean function to toggle required on the element
* x-required:name="'value'" — this shorthand allows you to easily test if a another named field has a particular value set. If it does have the value than it sets required to true.

*Note: basic Alpine allows toggling with `:required="expression"` and this will work. However, x-required has an advantage is it immediately updates `valid` in formData when the expression changes. Whereas changing the required attribute only updates formData on the blur/change event.*

## Magic function $validate

`$validate` is an object with a group of functions.

### Validation Functions

You can add any specific validation like *email* or *tel*. Main difference between the magic function and the directive is that required is assumed.

* both `$validate.email('')` and `$validate.email('hi')` returns false
* `$validate.email('hi@hello.com')` returns true
* `val === '' || $validate.email(val)` returns true if val is empty string or is a valid email address
* validating the date allows formats as such `$validate.date.mmddyyyy(str)`

### Magic formData Functions

When used on `<form>`, the `x-validate` every field is added to a reactive formData[formId] array. If only used on individual fields, `x-validate` only adds those fields to the formData[formId] array.

* `@submit="$validate.submit"` used on form element. Validates current form; if validation fails errors are shown and the submit event is prevented.
* `$validate.isComplete(el)` returns true or false validity for form, fieldsets, or fields. \*
* `$validate.data(el)` returns an array of form, fieldset or field data \*

\* 'el' argument variable works with either $refs or a string of the name/id for getting data from form, fieldset, and fields.

### Advanced Magic Functions

These grant access to some of the backend functions — use at your own risk.

* `$validate.updateData(field,data,triggerErrorMsg)` allows you to directly add/update the formData array for a field.
* `$validate.toggleError(field,valid)` allows you to toggle the error message on any field.

#### Example formData

```
{name: 'name', node: [HTMLElement], value: 'field value', valid: true, required: true, mods: [array of directive modifiers], set: [fieldset HTMLElement], parentNode: [parent HTMLElement], array: [array of checked selections (only used groups of checkboxes or radio buttons)], group: false or (only used for groups of checkboxes or radio buttons) min number checked items}
```
***Note:** name = name attribute || id attribute*

## Example

More complicated examples in examples folder. run `npm run serve` to view.

```
<form id="form" x-data x-validate @submit="$validate.submit">
        <p><em>* required</em></p>
        <div>
            <label for="name">Your Name *</label>
            <input type="text" id="name" name="name" required />
        </div>
        <div>
            <label for="email">Your Email *</label>
            <input type="email" id="email" name="email" required />
        </div>
        <div>
            <label for="wholenumber">Whole Number</label>
            <input type="wholenumber" id="wholenumber" name="wholenumber" x-validate.wholenumber data-error-msg="positive whole number required" />
        </div>
        <div id="animals" data-error-msg="you must pick at least one animal">
            <h4>Favorite Animals *</h4>
            <label><input type="checkbox" x-validate.group name="animal" id="cat" value="cat" /> 
                Cat</label>
            <label><input type="checkbox" x-validate.group name="animal" id="dog" value="dog" /> 
                Dog</label>
            <label><input type="checkbox" x-validate.group name="animal" id="bunny" value="bunny" /> 
                Bunny</label>
        </div>
        <div>
            <input type="submit" value="submit">
        </div>
    </form>
<style type="text/css">
    /* style to display the error message */
    .error-msg {
        color: red;
    }
</style>

```

### Example of more elaborate error message styling

```
.error-msg[hidden] {
    opacity: 0;
    height: 0px;
    transform: scale(0);
}
.error-msg {
    font-size: 0.8rem;
    font-weight: 700;
    color: darkred;
    transform-origin: left;
    transition: all 200ms;
    display: block;
}
```

## Installation

### CDN

```
<script defer src="https://unpkg.com/@colinaut/alpinejs-plugin-simple-validate@1/dist/alpine.validate.min.js"></script>
<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

### NPM/PNPM/YARN

```
npm i @colinaut/alpinejs-plugin-simple-validate

pnpm i @colinaut/alpinejs-plugin-simple-validate

yarn add @colinaut/alpinejs-plugin-simple-validate
```
### Bundling and initializing
If you are bundling your javascript then you can initialize the plugin like so:

```
import Alpine from "alpinejs";
import validate from "@colinaut/alpinejs-plugin-simple-validate";

Alpine.plugin(validate);

window.Alpine = Alpine;

Alpine.start();
```

### Eleventy static site

If you are using [Eleventy](https://www.11ty.dev), and want to install locally rather than rely on the CDN, you can install via NPM/PNPM/YARN and then pass through the js file so that it is included in the output. Then you would just need to add it to the head.

```
eleventyConfig.addPassthroughCopy({
    "node_modules/alpinejs/dist/cdn.min.js" : "js/alpine.min.js",
    "node_modules/@colinaut/alpinejs-plugin-simple-validate/dist/alpine.validate.min.js": "js/alpine.validate.min.js",
})
```
```
<script src="/js/alpine.validate.min.js" defer></script>
<script src="/js/alpine.min.js" defer></script>
```

## Roadmap

* Clean up the code more.

Feel free to add any enhancement requests on github.

## Acknowledgements
Built using [AlpineJS plugin blueprint](https://github.com/img.shields.io/github/v/release/victoryoalli/alpinejs-plugin-blueprint)

