import {customElement} from 'lit/decorators.js';
import {CodeMirrorExtensionElement} from './cm-extention-element.js';
import {css} from '@codemirror/lang-css';

@customElement('cm-lang-css')
export class CodeMirrorLangJavascript extends CodeMirrorExtensionElement {
  constructor() {
    super();
    this.setExtensions([css()]);
  }
}
