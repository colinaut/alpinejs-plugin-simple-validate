# AlpineJS Plugin — Simple Form Validation

![](https://img.shields.io/bundlephobia/min/@colinaut/alpinejs-plugin-simple-validate)
![](https://img.shields.io/npm/v/@colinaut/alpinejs-plugin-simple-validate)

Very simple form validation plugin for [AlpineJS](https://alpinejs.dev). This plugin is designed, like AlpineJS itself, to be sprinkled in as needed. What this plugin does not do is impose an opinionated structure for your form data or functionality. It can be used with or without x-model.

The x-validate directive allows for simple validation and error display on individual form elements. And the $validate() magic function grants easy access to the same validation functions for use as booleans in x-show and and x-bind.

## Usage

### Directive x-validate

1. Add x-validate along with modifiers on any form element `x-validate.required.email`
   1. *x-model is not required as the x-validate checks the value directly*
   2. validation is triggered initially only on blur; after failing once it then is triggered on 'input' to validate as the user types.
   3. If validation fails, it adds `data-valid="false"` to the form element and adds `data-error` to the field's parent element with a simple error message matching the modifier. For instance: `data-error="email required"`
   4. If the validation passes, it adds `data-valid="true"` to the form element and removes `data-error` attribute from the parent element
2. Add styles to make `data-error` error messages visible and/or validation visible
   1. Basic style: `[data-error]:after { content: attr(data-error); color: red;}`
   2. *Note:* I'm using the parent element as it is more convenient for styling and :after doesn't work on form elements.
3. Optionally add options with expression syntax
   1. Change error message `x-validate.required="{error: 'full name required'}"`
   2. Write own ad hoc test `x-validate.required="{test: $el.value.includes('bunny')}"`
   3. Or both `x-validate.required="{test: $el.value.includes('bunny'), error: 'must include bunny'}"`
   4. *Note:* ad hoc tests run after all validation modifiers which allows you to further limit a validation. For instance only allow twitter urls: `x-validate.required.url="{test: $el.value.startsWith('https://twitter.com/'), error: 'must be a twitter url'}"`


#### Modifiers

NOTE: x-validate without any modifiers or ad hoc tests does nothing

* `x-validate.required` — valid if not empty
* `x-validate.phone` — valid if empty or if phone number
* `x-validate.required.phone` — valid if not empty and phone number
* `x-validate.email` — valid if email address
* `x-validate.website` — valid if site domain, with or without http:// or https://
* `x-validate.url` — valid if url, requires http:// or https://
* `x-validate.number` — valid if number (positive or negative; integer or decimal)
* `x-validate.integer` — valid if integer number (positive or negative)
* `x-validate.wholenumber` — valid if whole number (positive integer)
* Date validation: allows for / or - or . between units
  * `x-validate.date-mm-dd-yyyy` — valid if date using mm-dd-yyyy format
  * `x-validate.date-dd-mm-yyyy` — valid if date using dd-mm-yyyy format
  * `x-validate.date-yyyy-mm-dd` — valid if date using yyyy-mm-dd format
  * `x-validate.date` defaults to mm-dd-yyyy format
  * *If you want more complicated validation I recommend [dayjs](https://github.com/iamkun/dayjs)*
* `x-validate.checked` — only used for checkboxes or radio buttons; valid if checked
* `x-validate.required.refocus` — 'refocus' forces focus on the field when validation fails

### Magic function $validate

$validate function returns true or false; Main difference is that it assumes required is true including for any specific validation options like *email* or *phone*

* $validate('hi') returns true
* $validate('') returns false
* $validate.email('') returns false
* $validate.email('hi') returns false
* $validate.email('hi@hello.com') returns true

## Validation When Submitting

This plugin does not automatically validate prior to submission. However, since `x-validate` automatically adds a `data-valid` attribute with `true` or `false` which can be checked prior to submitting the form. You can also use `$validate()` for any validation.

## Example

More complicated examples in examples folder. run `npm run serve` to view.

```
<form x-data="{email: '' , phone: '', yolo: ''}">
    <div>
        <label for="name">Your Name</label>
        <input type="text" id="name" name="name" x-validate.required />
    </div>
    <div>
        <label for="email">Your Email</label>
        <input type="email" id="email" name="email" x-model="email" x-validate.required.email />
    </div>
    <div>
        <label for="phone">Your Phone</label>
        <input type="phone" x-model="phone" id="phone" name="phone" x-validate.required.phone />
    </div>
    <div class="checkbox-wrapper">
        <label><input type="checkbox" x-validate.checked name="yolo" id="yolo" x-model="yolo" /> Sell all my secret data!
            YOLO!</label>
    </div>
    <!-- submit button is disabled until email and phone are added -->
    <div>
        <button type="submit" :disabled="!$validate.email(email) || !$validate.phone(phone) || !yolo">Submit</button>
    </div>
</form>
<style type="text/css">
    /* style to display the error message */
    [data-error]:after {
        margin-left: 0.5rem;
        color: red;
        font-weight: bold;
        content: attr(data-error);
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

## Acknowledgements
Built using [AlpineJS plugin blueprint](https://github.com/img.shields.io/github/v/release/victoryoalli/alpinejs-plugin-blueprint)

