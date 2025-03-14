import {type Extension} from '@codemirror/state';
import {ContextConsumer} from '@lit/context';
import {css, ReactiveElement} from 'lit';
import {
  type CodeMirrorExtensionHost,
  extensionsContext,
} from './extension-host-context.js';

export abstract class CodeMirrorExtensionElement extends ReactiveElement {
  static override styles = css`
    :host {
      display: none;
    }
  `;

  protected extensionHost: CodeMirrorExtensionHost | undefined;

  /**
   * The extensions that this element adds to its nearest
   * CodeMirrorEditorElement.
   */
  #extensions?: Array<Extension>;

  constructor() {
    super();

    new ContextConsumer(
      this,
      extensionsContext,
      (extensionHost?: CodeMirrorExtensionHost) => {
        if (
          this.#extensions !== undefined &&
          this.extensionHost !== extensionHost
        ) {
          this.extensionHost?.removeExtensions(this.#extensions);
          extensionHost?.addExtensions(this.#extensions);
        }
        this.extensionHost = extensionHost;
      },
      true,
    );
  }

  protected setExtensions(extensions: Array<Extension>) {
    if (this.#extensions !== undefined) {
      this.extensionHost?.removeExtensions(this.#extensions);
    }
    this.#extensions = extensions;
    if (this.#extensions !== undefined) {
      this.extensionHost?.addExtensions(this.#extensions);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#extensions !== undefined) {
      this.extensionHost?.removeExtensions(this.#extensions);
    }
    this.extensionHost = undefined;
  }
}
