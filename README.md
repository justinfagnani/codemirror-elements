# codemirror-elements

A set of HTML custom elements for editing source code with CodeMirror.

codemirror-elements can be used anywhere HTML can:

- Plain HTML
- Markdown
- Frameworks like React or Angular
- Web component libraries like Lit or Stencil
- Vanilla JavaScript

## Install

```bash
npm i codemirror-elements
```

## Usage

### Import the element

HTML:

```html
<script
  type="module"
  src="./node_modules/codemirror-elements/index.js"
></script>
```

JavaScript:

```js
import 'codemirror-elements';
```

### Create a `<cm-editor>` element

HTML:

```html
<cm-editor></cm-editor>
```

Lit:

```js
html`<cm-editor></cm-editor>`;
```

### Set an initial value

HTML:

```html
<cm-editor value="console.log('Hello');"></cm-editor>
```

JavaScript:

```js
const editor = document.querySelector('cm-editor');
editor.value = "console.log('Hello');";
```

### Listen for changes

JavaScript:

```js
const editor = document.querySelector('cm-editor');
editor.addEventListener('codemirror-document-change', (e) => {
  const newValue = e.target.value;
});
```

### Add extensions

Extensions are also HTML elements that you add as children of `<cm-editor>`:

HTML:

```html
<script
  type="module"
  src="./node_modules/codemirror-elements/lib/cm-lang-javascript.js"
></script>
<script
  type="module"
  src="./node_modules/codemirror-elements/lib/cm-theme-one-dark.js"
></script>

<cm-editor>
  <cm-lang-javascript typescript></cm-lang-javascript>
  <cm-theme-one-dark></cm-theme-one-dark>
</cm-editor>
```

This package implements a few CodeMirror extsions as elements:

- `<cm-lang-javascript>`
- `<cm-lang-html>`
- `<cm-lang-css>`
- `<cm-lang-lit>`
- `<cm-theme-one-dark>`

The intention is to add more, either in this package, or as independently installable packages.

### Write an extension element

```ts
import {customElement} from 'lit/decorators.js';
import {CodeMirrorExtensionElement} from 'codemirror-elements/lib/cm-extention-element.js';
import {someExtension} from 'some-codemirror-extension';

@customElement('cm-lang-css')
export class CodeMirrorLangJavascript extends CodeMirrorExtensionElement {
  constructor() {
    super();
    this.setExtensions([someExtension()]);
  }
}
```

Extensions can also by dynamically update with `CodeMirrorExtensionElement.addExtensions()` and `CodeMirrorExtensionElement.removeExtensions()`. This can be used to reconfigure extensions based on element properties.

See the `<cm-lang-javascript>` element for an example:

```ts
import {type PropertyValues} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {javascript} from '@codemirror/lang-javascript';
import {CodeMirrorExtensionElement} from './cm-extention-element.js';

@customElement('cm-lang-javascript')
export class CodeMirrorLangJavascript extends CodeMirrorExtensionElement {
  @property({type: Boolean})
  jsx = false;

  @property({type: Boolean})
  typescript = false;

  override update(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('jsx') || changedProperties.has('typescript')) {
      this.setExtensions([
        javascript({jsx: this.jsx, typescript: this.typescript}),
      ]);
    }
    super.update(changedProperties);
  }
}
```

## Contributing

This is a small side-project of mine. If you can make use of these elements and need some features or bug fixes, please reach out and hopefully we can collaborate!
