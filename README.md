# AlpineJS Plugin — Simple form validation

Very simple form validation plugin for AlpineJS

## Installation

Add plugin in head above alpinejs

```
<script defer src="/js/alpine.validate.min.js"></script>
<script defer src="/js/alpine.min.js"></script>
```
## Usage

1. Add x-validate along with modifiers on form elements
2. Add styles to make error messages appear
3. Optionally modify message by adding expression `x-validate.required="full name required"`

### Modifiers

* NOTE: x-validate on own does nothing
* x-validate.required — valid if not empty
* x-validate.phone — valid if empty or if phone number
* x-validate.required.phone — valid if not empty and phone number
* x-validate.email — valid if email address
* x-validate.website — valid if site domain, with or without http:// or https://
* x-validate.url — valid if url, requires http:// or https://


### Example

```
<form>
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
  <div>
    <label>Favorite Animal</label>
    <select x-modal="animal">
      <option>Cat</option>
      <option>Dog</option>
      <option>Bunny</option>
    </select>
  </div>
  <div>
    <input type="checkbox" x-validate.checked />
    <label>Yolo</label>
  </div>
</form>
<style type="text/css">
    [data-error] {
        background-color: #ffeeee;
        padding: 0.5rem;
        border-radius: 0.5rem;
    }
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


