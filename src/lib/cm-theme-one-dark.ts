import {customElement} from 'lit/decorators.js';
import {CodeMirrorExtensionElement} from './cm-extension-element.js';
import {oneDark} from '@codemirror/theme-one-dark';

@customElement('cm-theme-one-dark')
export class CodeMirrorLangJavascript extends CodeMirrorExtensionElement {
  constructor() {
    super();
    this.setExtensions([oneDark]);
  }
}
