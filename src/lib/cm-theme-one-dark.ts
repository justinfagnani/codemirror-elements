import {customElement} from 'lit/decorators.js';
import {CodeMirrorExtensionElement} from './cm-extension-element.js';
import {oneDark} from '@codemirror/theme-one-dark';

declare global {
  interface HTMLElementTagNameMap {
    'cm-theme-one-dark': CodeMirrorThemeOneDark;
  }
}

@customElement('cm-theme-one-dark')
export class CodeMirrorThemeOneDark extends CodeMirrorExtensionElement {
  constructor() {
    super();
    this.setExtensions([oneDark]);
  }
}
