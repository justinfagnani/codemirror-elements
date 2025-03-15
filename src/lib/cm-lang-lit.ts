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
  @property({type: Boolean})
  jsx = false;

  @property({type: Boolean})
  javascript = false;

  override update(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('jsx') || changedProperties.has('javascript')) {
      this.setExtensions([lit({jsx: this.jsx, typescript: !this.javascript})]);
    }
    super.update(changedProperties);
  }
}
