# AlpineJS Plugin — Simple Form Validation

![](https://img.shields.io/bundlephobia/min/@colinaut/alpinejs-plugin-simple-validate)
![](https://img.shields.io/npm/v/@colinaut/alpinejs-plugin-simple-validate)

Very simple form validation plugin for [AlpineJS](https://alpinejs.dev). This plugin is designed, like AlpineJS itself, to be sprinkled in as needed. What this plugin does not do is impose an opinionated structure for your form data or functionality. It can be used with or without x-model.

The x-validate directive allows for simple validation and error display. It also captures all form data in a reactive formData. The $validate magic function grants access to validation functions, formData, and simple submit validation check.

## Update 1.6.x

Version 1.6 changes validation and error messages to comply with aria practices. You may need to change your css but this is otherwise backwards compatible from version 1.5.

* `aria-invalid` and `aria-errormessage` are added.
* Error messages are displayed in an adjacent element with `error-msg` class id matched with the `aria-errormessage`
  * If a following sibling `error-msg` class element already exists it uses that; otherwise it creates a new `error-msg` element.
  * This `error-msg` element is hidden or shown using the `hidden` attribute.
* The generic error messages are more usable as is. It now uses the name || id of the field and converts dashes or underscores to spaces. `name='favorite-cheese'` becomes `favorite cheese required`'

## Simple Usage

Add an `x-data`, and `x-validate` to your `<form>` element (you don't need any variables on x-data ; it just needs to be initiated as an Alpine component). This automatically:

* Captures all data to a reactive formData[form] array which updates on blur or click (depending on field type).
* Validates onblur using basic browser checkValidity() checking `required` attribute and input types.
* Uses built-in improved regex validation for required, email, tel, and url type fields, since the browser versions are limited.
* Automatically adds a hidden `span.error-msg` with error message adjacent to the field.
  * You will need to style this yourself (*see Example below*)
* When the validity check fails, it...
  * Adds `aria-invalid="true"` and `aria-errormessage` attributes to the field element.
  * Reveals the error message in by removing the `hidden` attribute.
  * Also adds a superfluous `data-error="{error message}"` on the field's parent element for any additional styling you may want.
  * After blur triggers invalid, it adds 'input' event listener for validation as well as 'blur'
* If valid is triggered, it reverses all the above
* Use `:disabled="$validate.isFormComplete('formId')"` to disable submit button and/or use `@submit="$validate.submit"` to automatically check validity of all fields prior to submitting.

## Custom Usage

* Use `x-validate` directive along with modifiers directly on form fields to add additional validation, such as  `x-validate.wholenumber`
* Write a custom error message one of two ways:
  * Add `data-error-msg='custom error message'` on field itself
  * Add an sibling element with `error-msg` class and write your own error message there. It will add the proper aria-errormessage linked id tags for you. 
* Another advantage of adding your own `error-msg` class element is if you want the error message after another element. The plugin searches all next siblings, so if want a description text element or label right after the field then add `<span class="error-msg"></span>` after the description and it will use that.
* Use `x-validate.group` on checkboxes or radio buttons to validate that at least one is selected.
* Add a specific test to a field like `x-validate='$el.value === 'bunny'`; this can be paired up with other validations. For example: `x-validate.website='$el.includes('bunny')` for only websites with the word bunny in the name.
* Use `$validate.isComplete(el)` to detect if the form, `<fieldset>` groups or any field is completed
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
  * `x-validate.date` defaults to 'mm-dd-yyyy' format
  * `x-validate.date.mmddyyyy` — 'mm-dd-yyyy' format
  * `x-validate.date.ddmmyyyy` — 'dd-mm-yyyy' format
  * `x-validate.date.yyyymmdd` — 'yyyy-mm-dd' format
  * *If you want more complicated validation I recommend [dayjs](https://github.com/iamkun/dayjs)*

\* this allows you to use `x-validate.required` instead of `required` attribute or `x-validate.tel` on `type='text'` instead of `type='tel'`

### Checkbox and Radio Button Groups

Checkboxes and radio buttons that share the same name update the same formData row. Radio buttons update the value with the currently selected button. Checkboxes save as both a comma separated string value and as an array.

You can validate that at least one is selected by adding `x-validate.group` to every checkbox or radio button in a named group. If you want the user to select multiple checkboxes, use an added expression `x-validate.group="2"`.

***Note:** Checkbox and radio button groups add their error message after the wrapper for the group. It's assumed that each checkbox/radio is wrapped in a label or list item, and then has a wrapper around the group. If you want to change the default error msg add `data-error-msg` to the group wrapper element or add the element yourself.*

## Magic function $validate

`$validate` is an object with a group of functions.

### Validation Functions

You can add any specific validation like *email* or *tel*. Main difference between the magic function and the directive is that required is assumed.

* both `$validate.email('')` and `$validate.email('hi')` returns false
* `$validate.email('hi@hello.com')` returns true
* `val === '' || $validate.email(val)` returns true if val is empty string or is a valid email address

### Magic formData Functions

When used on `<form>`, the `x-validate` every field is added to a reactive formData[formId] array. If only used on individual fields, `x-validate` only adds those fields to the formData[formId] array.

* `@submit="$validate.submit"` used on form element. Validates current form; if validation fails errors are shown and the submit event is prevented.
* `$validate.isComplete(el)` returns true or false validity for form, fieldsets, or fields. \*
* `$validate.data(el)` returns an array of form, fieldset or field data \*
* `$validate.isRequired(field)` checks if a field is required
* `$validate.makeRequired(field,boolean)` set boolean true to make a field required. false to turn off required. This only works fo the plugin required modifier. If you set required as an attribute on the field it will be checked regardless. This function is useful for when you need to change the requirements of a field for instance if selection of other shows an other input field.

\* $refs is recommended for form, fieldset, and field variables, but a string of the id works as well.

### Advanced Magic Functions

These grant access to some of the backend functions — use at your own risk.

* `$validate.updateData(field,data)` allows you to directly add/update the formData array for a field.
* `$validate.toggleError(field,valid)` allows you to toggle the error message on any field

#### Example formData

```
{name: 'name', type: 'text', node: [HTMLElement], value: 'Fred', valid: true}
```
***Note:** name = name attribute || id attribute, because not everyone uses the name attribute.*

#### Example formData for checkbox groups
```
{name: 'animals', type: 'checkbox', node: [HTMLElement], value: 'cat,dog', array: ['cat', 'dog'], valid: true, group: true}
```

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
            <input type="submit"  value="submit">
        </div>
    </form>
<style type="text/css">
    /* style to display the error message */
    [hidden] {
        display: none;
    }
    .error-msg:not([hidden]) {
        color: red;
        display: block;
    }
</style>

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

* Clean up the code more to get it down closer to 4KB minimized.

Feel free to add any enhancement requests on github.

## Acknowledgements
Built using [AlpineJS plugin blueprint](https://github.com/img.shields.io/github/v/release/victoryoalli/alpinejs-plugin-blueprint)

