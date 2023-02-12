import {type PropertyValues} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {javascript} from '@codemirror/lang-javascript';
import {CodeMirrorExtensionElement} from './cm-extension-element.js';

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
