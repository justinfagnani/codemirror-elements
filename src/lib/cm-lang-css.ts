import {customElement} from 'lit/decorators.js';
import {CodeMirrorExtensionElement} from './cm-extension-element.js';
import {css} from '@codemirror/lang-css';

declare global {
  interface HTMLElementTagNameMap {
    'cm-lang-css': CodeMirrorLangCSS;
  }
}

@customElement('cm-lang-css')
export class CodeMirrorLangCSS extends CodeMirrorExtensionElement {
  constructor() {
    super();
    this.setExtensions([css()]);
  }
}
