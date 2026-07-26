# codemirror-elements

A set of HTML custom elements for editing source code with CodeMirror.

Adding a code editor to you page can be as simple as:

```html
<cm-editor></cm-editor>
```

`codemirror-elements` can be used anywhere HTML can:

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

`<cm-editor>` fires a DOM events for CodeMirror callbacks:

- `codemirror-transaction`: a TransactionEvent fired on all CodeMirror
  transactions.
- `codemirror-document-change`: a DocumentChangeEvent fired on CodeMirror
  transactions that include document changes.
- `codemirror-selection-change`: a SelectionChangeEvent fired on CodeMirror
  transactions that include selection changes.

Example:

```js
const editor = document.querySelector('cm-editor');
editor.addEventListener('codemirror-document-change', (e) => {
  const newValue = e.target.value;
});
```

### Add extensions

Extensions are also HTML elements, which you add as children of `<cm-editor>`:

```html
<cm-editor>
  <cm-lang-javascript typescript></cm-lang-javascript>
  <cm-theme-one-dark></cm-theme-one-dark>
</cm-editor>
```

Every element lives in its own module under `codemirror-elements/lib/`, named
after its tag, so you only pay for the extensions you actually use. Importing
one registers it; there's nothing else to call.

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
```

JavaScript:

```js
import 'codemirror-elements/lib/cm-lang-javascript.js';
import 'codemirror-elements/lib/cm-theme-one-dark.js';
```

In TypeScript the import also declares the tag name, so the element comes back
typed:

```ts
import 'codemirror-elements/lib/cm-lang-javascript.js';

const lang = document.querySelector('cm-lang-javascript')!;
lang.typescript = true; // typed as CodeMirrorLangJavascript
```

Each module exports its class under the same name, for subclassing or for
annotating a variable.

#### Setting extension options

Extension options are exposed as attributes and properties.

Options with primitive types get an attribute, in kebab-case:

```html
<cm-lang-javascript typescript></cm-lang-javascript>
<cm-lang-sass indented></cm-lang-sass>
<cm-lang-sql dialect="PostgreSQL"></cm-lang-sql>
```

Options with richer types — parsers, languages, completion sources — can only be
set as properties:

```js
document.querySelector('cm-lang-markdown').codeLanguages = languages;
```

Boolean options are ordinary boolean attributes: absent is false, present is
true. Some CodeMirror options are on by default, though, and a boolean attribute
can't turn those off — so those options are exposed inverted, with a `no-`
prefix:

```html
<!-- auto-closes tags, which is CodeMirror's default -->
<cm-lang-xml></cm-lang-xml>
<!-- doesn't -->
<cm-lang-xml no-auto-close-tags></cm-lang-xml>
```

Either way, an absent boolean attribute always means the CodeMirror default and
a present one always means the opposite. Non-boolean options left unset are
omitted from the extension's config entirely, so their upstream defaults apply
too. Changing any option reconfigures the extension in place.

Attributes for primitive options reflect, so setting the property updates the
attribute and the element stays inspectable in devtools. Initial values don't
reflect, so an element you haven't configured carries no attributes — a plain
`<cm-lang-sql>` doesn't render as `<cm-lang-sql dialect="StandardSQL">`. Removing
an attribute restores the option's default where there is one to restore, so
deleting `dialect` goes back to `StandardSQL`; options with no meaningful default
are simply dropped from the extension's config again.

Object-valued attributes like `<cm-lang-html>`'s `extra-tags` accept JSON but
don't reflect, since re-serializing them on every change costs more than it's
worth.

### Languages

All of these are [generated](DEVELOPMENT.md#generating-extension-elements) from
the official `@codemirror/lang-*` packages. Options are listed as they're set: kebab-case ones are attributes, camelCase ones
are property-only because their types are too rich for an attribute.

| Element                | Extension                                                                 | Options                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<cm-lang-angular>`    | [`angular`](https://www.npmjs.com/package/@codemirror/lang-angular)       | `base`                                                                                                                                             |
| `<cm-lang-cpp>`        | [`cpp`](https://www.npmjs.com/package/@codemirror/lang-cpp)               | —                                                                                                                                                  |
| `<cm-lang-css>`        | [`css`](https://www.npmjs.com/package/@codemirror/lang-css)               | —                                                                                                                                                  |
| `<cm-lang-go>`         | [`go`](https://www.npmjs.com/package/@codemirror/lang-go)                 | —                                                                                                                                                  |
| `<cm-lang-html>`       | [`html`](https://www.npmjs.com/package/@codemirror/lang-html)             | `no-match-closing-tags`, `self-closing-tags`, `no-auto-close-tags`, `extra-tags`, `extra-global-attributes`, `nestedLanguages`, `nestedAttributes` |
| `<cm-lang-java>`       | [`java`](https://www.npmjs.com/package/@codemirror/lang-java)             | —                                                                                                                                                  |
| `<cm-lang-javascript>` | [`javascript`](https://www.npmjs.com/package/@codemirror/lang-javascript) | `jsx`, `typescript`                                                                                                                                |
| `<cm-lang-jinja>`      | [`jinja`](https://www.npmjs.com/package/@codemirror/lang-jinja)           | `tags`, `variables`, `properties`, `base`                                                                                                          |
| `<cm-lang-json>`       | [`json`](https://www.npmjs.com/package/@codemirror/lang-json)             | —                                                                                                                                                  |
| `<cm-lang-less>`       | [`less`](https://www.npmjs.com/package/@codemirror/lang-less)             | —                                                                                                                                                  |
| `<cm-lang-liquid>`     | [`liquid`](https://www.npmjs.com/package/@codemirror/lang-liquid)         | `tags`, `filters`, `variables`, `properties`, `base`                                                                                               |
| `<cm-lang-markdown>`   | [`markdown`](https://www.npmjs.com/package/@codemirror/lang-markdown)     | `defaultCodeLanguage`, `codeLanguages`, `no-add-keymap`, `extensions`, `base`, `no-complete-html-tags`, `no-paste-url-as-link`, `htmlTagLanguage`  |
| `<cm-lang-php>`        | [`php`](https://www.npmjs.com/package/@codemirror/lang-php)               | `baseLanguage`, `plain`                                                                                                                            |
| `<cm-lang-python>`     | [`python`](https://www.npmjs.com/package/@codemirror/lang-python)         | —                                                                                                                                                  |
| `<cm-lang-rust>`       | [`rust`](https://www.npmjs.com/package/@codemirror/lang-rust)             | —                                                                                                                                                  |
| `<cm-lang-sass>`       | [`sass`](https://www.npmjs.com/package/@codemirror/lang-sass)             | `indented`                                                                                                                                         |
| `<cm-lang-sql>`        | [`sql`](https://www.npmjs.com/package/@codemirror/lang-sql)               | `schema`, `default-table`, `default-schema`, `upper-case-keywords`, `keywordCompletion`                                                            |
| `<cm-lang-vue>`        | [`vue`](https://www.npmjs.com/package/@codemirror/lang-vue)               | `base`                                                                                                                                             |
| `<cm-lang-wast>`       | [`wast`](https://www.npmjs.com/package/@codemirror/lang-wast)             | —                                                                                                                                                  |
| `<cm-lang-xml>`        | [`xml`](https://www.npmjs.com/package/@codemirror/lang-xml)               | `elements`, `attributeSpecs`, `no-auto-close-tags`                                                                                                 |
| `<cm-lang-yaml>`       | [`yaml`](https://www.npmjs.com/package/@codemirror/lang-yaml)             | —                                                                                                                                                  |

`<cm-lang-sql>` also takes a `dialect` attribute, naming one of the dialects
`@codemirror/lang-sql` defines: `StandardSQL`, `PostgreSQL`, `MySQL`, `MariaSQL`,
`MSSQL`, `SQLite`, `Cassandra`, or `PLSQL`.

`<cm-lang-lit>` is the one hand-written language element: it wraps a local
[Lit](https://lit.dev/) language (TypeScript or JavaScript with highlighting
inside `html` tagged template literals) and takes `jsx` and `javascript`
attributes.

### Themes

Themes have no options:

```html
<cm-editor>
  <cm-lang-python></cm-lang-python>
  <cm-theme-monokai></cm-theme-monokai>
</cm-editor>
```

| Dark                           | Light                        | From                    |
| ------------------------------ | ---------------------------- | ----------------------- |
| `<cm-theme-github-dark>`       | `<cm-theme-github-light>`    | @fsegurai               |
| `<cm-theme-vscode-dark>`       | `<cm-theme-vscode-light>`    | @fsegurai               |
| `<cm-theme-material-dark>`     | `<cm-theme-material-light>`  | @fsegurai               |
| `<cm-theme-gruvbox-dark>`      | `<cm-theme-gruvbox-light>`   | @fsegurai               |
| `<cm-theme-monokai>`           |                              | @fsegurai               |
| `<cm-theme-nord>`              |                              | @fsegurai               |
| `<cm-theme-solarized-dark>`    | `<cm-theme-solarized-light>` | @fsegurai / thememirror |
| `<cm-theme-one-dark>`          |                              | @codemirror             |
| `<cm-theme-amy>`               | `<cm-theme-ayu-light>`       | thememirror             |
| `<cm-theme-barf>`              | `<cm-theme-clouds>`          | thememirror             |
| `<cm-theme-bespin>`            | `<cm-theme-espresso>`        | thememirror             |
| `<cm-theme-birds-of-paradise>` | `<cm-theme-noctis-lilac>`    | thememirror             |
| `<cm-theme-boys-and-girls>`    | `<cm-theme-rose-pine-dawn>`  | thememirror             |
| `<cm-theme-cobalt>`            | `<cm-theme-smoothy>`         | thememirror             |
| `<cm-theme-cool-glow>`         | `<cm-theme-tomorrow>`        | thememirror             |
| `<cm-theme-dracula>`           |                              | thememirror             |

`@codemirror/theme-one-dark` is the only theme under the official `@codemirror`
scope. The rest come from [thememirror](https://thememirror.net/) and
[@fsegurai](https://github.com/fsegurai/codemirror-themes), both of which have
previews, and both of which publish more themes than are wrapped here — adding
one is a two-line entry in the
[element manifest](DEVELOPMENT.md#generating-extension-elements).

`@uiw` publishes a larger and more popular collection, and is deliberately not
used: every one of its theme packages imports `@babel/runtime` helpers without
declaring the dependency, which would make `@babel/runtime` a dependency of this
package. The `@fsegurai` packages have no runtime dependencies at all.

### Theming with CSS

`<cm-editor>` reads a set of CSS custom properties, so the editor can be themed
from ordinary CSS instead of by importing a JavaScript theme. There's no element
to add — setting `--cm-background` is what turns it on:

```html
<style>
  cm-editor {
    color-scheme: dark;
    --cm-background: #1e1e2e;
    --cm-foreground: #cdd6f4;
    --cm-keyword: #cba6f7;
    --cm-string: #a6e3a1;
    --cm-comment: #6c7086;
  }
</style>

<cm-editor>
  <cm-lang-python></cm-lang-python>
</cm-editor>
```

This works because CodeMirror injects its styles _into_ `<cm-editor>`'s shadow
root while custom properties inherit _through_ the shadow boundary, so the
properties can be set from anywhere above the editor — including from a
stylesheet that knows nothing about CodeMirror.

Until `--cm-background` is set, none of this applies and the editor renders
exactly as it would without it. That matters: the fallbacks can't be relied on to
be invisible, because CodeMirror's base theme already has light and dark defaults
for the active line, gutters, and selection, and a highlight style covering every
property would displace `defaultHighlightStyle` and change how an unthemed editor
looks. So the properties stay dormant until you opt in with a background.

An explicit theme element wins over these properties, since it's added after
them. `<cm-theme-monokai>` plus `--cm-background` gives you Monokai.

Every other property is optional and falls back to CodeMirror's default light
appearance, so you can override just the few you care about. The full list is
exported as `cssVars` from `codemirror-elements/lib/css-vars-theme.js`:

- Chrome: `--cm-background`, `--cm-foreground`, `--cm-caret`, `--cm-selection`,
  `--cm-selection-match`, `--cm-active-line`, `--cm-gutter-background`,
  `--cm-gutter-foreground`, `--cm-gutter-active-foreground`,
  `--cm-gutter-border`, `--cm-font-family`
- Syntax: `--cm-comment`, `--cm-keyword`, `--cm-string`, `--cm-number`,
  `--cm-variable`, `--cm-function`, `--cm-type`, `--cm-constant`,
  `--cm-operator`, `--cm-punctuation`, `--cm-property`, `--cm-tag`,
  `--cm-attribute`, `--cm-heading`, `--cm-link`, `--cm-invalid`

#### Light and dark

CodeMirror needs to know whether it's on a light or dark background: the flag
picks between the `&light` and `&dark` halves of its base theme, which style the
parts these properties don't — panels, tooltips, buttons, search matches. That
comes from the standard
[`color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)
property, so the whole theme is still declared in one CSS block:

```css
cm-editor {
  color-scheme: dark;
  --cm-background: #1e1e2e;
}
```

`color-scheme: light dark` works too, and follows the reader's
`prefers-color-scheme`. Setting it on `<cm-editor>` rather than `:root` gives a
dark editor on an otherwise light page. It's worth setting regardless: it's also
what tells the browser to draw the editor's scrollbars and form controls to
match.

The editor reconfigures itself whenever the used scheme changes, so a theme
switcher that swaps a class on `<html>` needs no extra wiring — and neither does
the reader changing their system preference.

<details>
<summary>How that works, since CSS can't be read from the element that needs it</summary>

`<cm-editor>` sets two registered custom properties on its own internal DOM and
reads them back:

```css
.cm-editor {
  --cm-color-scheme-probe: light-dark(rgb(0, 0, 0), rgb(255, 255, 255));
  --cm-background-probe: var(--cm-background, rgba(0, 0, 0, 0));
}
```

`light-dark()` resolves against the used `color-scheme`, so the computed value of
the first _is_ the platform's own light/dark answer, `prefers-color-scheme`
included. The second reports whether `--cm-background` was set, which is what
gates the whole thing — an editor themed by `<cm-theme-github-light>` on a page
with `color-scheme: dark` must not claim to be dark.

Both are registered with `CSS.registerProperty` as `<color>`, which makes them
animatable, and a 1ms transition on them means any change — anywhere up the tree
— fires a `transitionrun` event. Neither has any visual effect, but they do
occupy the `transition-*` longhands on `.cm-editor`, so don't expect to
transition that element yourself.

</details>

### Write an extension element

Any CodeMirror extension can be wrapped as an element, including ones this
package doesn't ship. Extend `CodeMirrorExtensionElement`, which takes care of
adding the extension to the nearest `<cm-editor>` and removing it again when the
element goes away:

```ts
import {customElement} from 'lit/decorators.js';
import {CodeMirrorExtensionElement} from 'codemirror-elements/lib/cm-extension-element.js';
import {someExtension} from 'some-codemirror-extension';

@customElement('cm-some-extension')
export class CodeMirrorSomeExtension extends CodeMirrorExtensionElement {
  constructor() {
    super();
    this.setExtensions([someExtension()]);
  }
}
```

Extensions can also by dynamically updated with
`CodeMirrorExtensionElement.addExtensions()` and
`CodeMirrorExtensionElement.removeExtensions()`. This can be used to reconfigure
extensions based on element properties.

See the `<cm-lang-javascript>` element for an example:

```ts
import {type PropertyValues} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {javascript} from '@codemirror/lang-javascript';
import {CodeMirrorExtensionElement} from './cm-extension-element.js';

@customElement('cm-lang-javascript')
export class CodeMirrorLangJavascript extends CodeMirrorExtensionElement {
  @property({type: Boolean, reflect: true, useDefault: true})
  jsx = false;

  @property({type: Boolean, reflect: true, useDefault: true})
  typescript = false;

  override update(changedProperties: PropertyValues<this>) {
    if (!this.hasUpdated || changedProperties.size > 0) {
      this.setExtensions([
        javascript({jsx: this.jsx, typescript: this.typescript}),
      ]);
    }
    super.update(changedProperties);
  }
}
```

Note the `!this.hasUpdated` half of that condition. `useDefault` deliberately
keeps a property's initial value out of `changedProperties`, so an element that
only checks `changedProperties` never applies its extension on the first update.

## Demo

A gallery of every language and theme, with a picker for each:

```bash
npm run start:demo
```

Then open <http://localhost:8123/demo/>. Selections are kept in the URL, so a
particular combination can be linked — `#lang=Rust&theme=Cobalt`. The page loads
each extension element on demand, and shows the markup that matches whatever is
selected.

## Contributing

This is a small side-project of mine. If you can make use of these elements and
need some features or bug fixes, please reach out and hopefully we can
collaborate!

[DEVELOPMENT.md](DEVELOPMENT.md) covers building and testing the package, and
how the elements are generated.
