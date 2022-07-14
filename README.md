# AlpineJS Plugin — Simple form validation

Very simple form validation plugin for AlpineJS

## Installation

Add plugin in head above alpinejs

```
<script defer src="https://unpkg.com/@colinaut/alpinejs-plugin-simple-validate@1/dist/alpine.validate.min.js"></script>
<script defer src="/js/alpine.min.js"></script>
```
## Usage

### Directive x-validate

1. Add x-validate along with modifiers on any form element
   1. x-model is not required as the x-validate checks the value directly
   2. If validation fails it adds `data-error="required"` with appropriate error message to the form element's parent element.
   3. failed validation also resets focus on the form element that failed validation
2. Add styles to make error messages visible and/or validation visible
   1. Simple error message style: `[data-error]:after { content: attr(data-error); color: red;}`
   2. *Note:* I'm using the parent element as it is more convenient for styling and :after doesn't work on form elements.
3. Optionally add options with expression syntax
   1. Change error message `x-validate.required="{error: 'full name required'}"`
   2. Write own ad hoc test `x-validate.required="{test: $el.value.includes('bunny')}"`
   3. Or both `x-validate.required="{test: $el.value.includes('bunny'), error: 'must include bunny'}"`
   4. *Note:* ad hoc tests run after all validation modifiers which allows you to further limit a validation. For instance only allow twitter urls: `x-validate.required.url="{test: $el.value.startsWith('https://twitter.com/'), error: 'must be a twitter url'}"`

#### Validation Modifiers

The following work on all input, textarea, and select fields.

NOTE: x-validate without any modifiers or ad hoc tests does nothing

* x-validate.required — valid if not empty
* x-validate.phone — valid if empty or if phone number
* x-validate.required.phone — valid if not empty and phone number
* x-validate.email — valid if email address
* x-validate.website — valid if site domain, with or without http:// or https://
* x-validate.url — valid if url, requires http:// or https://
* x-validate.number — valid if number (positive or negative; integer or decimal)
* x-validate.integer — valid if integer number (positive or negative)
* x-validate.wholenumber — valid if whole number (positive integer)
* x-validate.date — valid if valid date with or without time (uses basic Date.parse())

#### Special case: checkboxes and radio buttons

If you want to make sure an individual checkbox or radio button is selected use `x-validate.checked`

### Magic function $validate

$validate function returns true or false; Main difference is that it assumes required is true including for any specific validation options like *email* or *phone*

* $validate('hi') returns true
* $validate('') returns false
* $validate.email('') returns false
* $validate.email('hi') returns false
* $validate.email('hi@hello.com') returns true

## Example

More complicated examples in examples folder. run `npm run serve` to view.

```
<form x-data={name: '', email: '', phone: '', animal: ''}>
  <div>
    <label>Your Name</label>
    <input type="text" x-validate.required />
  </div>
  <div>
    <label>Your Email</label>
    <input type="email" x-validate.required.email />
  </div>
  <div>
    <label>Your phone</label>
    <input type="phone" x-validate.required.phone />
  </div>
  <!-- only show fieldset if all above completed -->
  <fieldset x-show="$validate.required(name) && $validate.email(email) && $validate.phone(phone)">
    <div>
        <label>Favorite Animal</label>
        <select x-modal="animal" x-validate.required="{error: 'please select animal'}">
        <option>Cat</option>
        <option>Dog</option>
        <option>Bunny</option>
        </select>
    </div>
    <div>
        <label><input type="checkbox" x-validate.checked /> Yolo</label>
    </div>
  </fieldset>
</form>
<style type="text/css">
    [data-error]:after {
        margin-left: 0.5rem;
        color: red;
        font-size: .8rem;
        font-weight: bold;
        content: attr(data-error);
    }
</style>

```

Built using [AlpineJS plugin blueprint](https://github.com/img.shields.io/github/v/release/victoryoalli/alpinejs-plugin-blueprint)


