import {oneDark} from '@codemirror/theme-one-dark';
import {customElement} from 'lit/decorators.js';
import {CodeMirrorExtensionElement} from './cm-extension-element.js';

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
