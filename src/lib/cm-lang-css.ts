import {customElement} from 'lit/decorators.js';
import {CodeMirrorExtensionElement} from './cm-extension-element.js';
import {css} from '@codemirror/lang-css';

@customElement('cm-lang-css')
export class CodeMirrorLangJavascript extends CodeMirrorExtensionElement {
  constructor() {
    super();
    this.setExtensions([css()]);
  }
}
