import type {Extension} from '@codemirror/state';
import {createContext} from '@lit/context';

export const extensionsContext = createContext<CodeMirrorExtensionHost>(
  Symbol('CodeMirrorExtensionHost'),
);

/**
 * An object that can dynamically add and remove extensions.
 *
 * CMEditor implements this interface.
 */
export interface CodeMirrorExtensionHost {
  addExtensions(extensions: Array<Extension>): void;
  removeExtensions(extensions: Array<Extension>): void;
}
