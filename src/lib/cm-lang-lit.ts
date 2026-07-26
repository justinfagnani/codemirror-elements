import {type PropertyValues} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {CodeMirrorExtensionElement} from './cm-extension-element.js';
import {lit} from './lang-lit.js';

declare global {
  interface HTMLElementTagNameMap {
    'cm-lang-lit': CodeMirrorLangLit;
  }
}

/**
 * CodeMirror language support for Lit.
 *
 * TypeScript is enabled by default. To enable JavaScript, set the `javascript`
 * property to true.
 */
@customElement('cm-lang-lit')
export class CodeMirrorLangLit extends CodeMirrorExtensionElement {
  @property({type: Boolean, reflect: true, useDefault: true})
  jsx = false;

  @property({type: Boolean, reflect: true, useDefault: true})
  javascript = false;

  override update(changedProperties: PropertyValues<this>) {
    // `useDefault` keeps the initial property values out of `changedProperties`,
    // so the first update has to be caught with `hasUpdated`. This matches what
    // the generated elements do.
    if (!this.hasUpdated || changedProperties.size > 0) {
      this.setExtensions([lit({jsx: this.jsx, typescript: !this.javascript})]);
    }
    super.update(changedProperties);
  }
}
