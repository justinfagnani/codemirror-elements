import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import {defaultKeymap, history, historyKeymap} from '@codemirror/commands';
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import {lintKeymap} from '@codemirror/lint';
import {highlightSelectionMatches, searchKeymap} from '@codemirror/search';
import {
  Compartment,
  EditorState,
  Transaction,
  type ChangeSpec,
  type EditorSelection,
  type Extension,
  type Text,
} from '@codemirror/state';
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import {ContextProvider} from '@lit/context';
import {css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {extensionsContext} from './extension-host-context.js';

/**
 * An event emmitted for all CodeMirror transactions.
 *
 * Calling `preventDefault()` on this event will prevent the transaction from
 * being applied to the editor.
 */
export class TransactionEvent extends Event {
  static readonly eventName = 'codemirror-transaction';

  public readonly transaction: Transaction;

  declare target: CodeMirrorEditor;

  constructor(transaction: Transaction) {
    super(TransactionEvent.eventName, {bubbles: true});
    this.transaction = transaction;
  }
}

/**
 * An event emmitted for all CodeMirror document changes. This event is emitted
 * after the transaction event.
 *
 * Calling `preventDefault()` on this event will prevent the transaction from
 * being applied to the editor.
 */
export class DocumentChangeEvent extends Event {
  static readonly eventName = 'codemirror-document-change';

  public readonly transaction: Transaction;
  public changes: Array<Change>;

  declare target: CodeMirrorEditor;

  constructor(transaction: Transaction, changes: Array<Change>) {
    super(DocumentChangeEvent.eventName, {bubbles: true});
    this.transaction = transaction;
    this.changes = changes;
  }
}

export type Change = {
  fromA: number;
  toA: number;
  fromB: number;
  toB: number;
  inserted: Text;
};

/**
 * An event emmitted for all CodeMirror selection changes. This event is emitted
 * after the transaction event.
 *
 * Calling `preventDefault()` on this event will prevent the transaction from
 * being applied to the editor.
 */
export class SelectionChangeEvent extends Event {
  static readonly eventName = 'codemirror-selection-change';

  public readonly transaction: Transaction;
  public readonly selection: EditorSelection;

  declare target: CodeMirrorEditor;

  constructor(transaction: Transaction, selection: EditorSelection) {
    super(SelectionChangeEvent.eventName, {bubbles: true});
    this.transaction = transaction;
    this.selection = selection;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cm-editor': CodeMirrorEditor;
  }
}

@customElement('cm-editor')
export class CodeMirrorEditor extends LitElement {
  static override styles = css`
    :host {
      display: block;
      /* TODO: grab from theme */
      border: solid 1px rgb(221, 221, 221);
    }
    .cm-editor {
      height: 100%;
      max-height: 100%;
    }
    .cm-scroller {
      overflow: auto;
    }
  `;

  @property({attribute: false})
  editorView!: EditorView;

  @property()
  get value(): string | undefined {
    return this.editorView.state.doc.toString();
  }

  set value(v: string | undefined) {
    this.editorView.dispatch({
      changes: [{from: 0, to: this.editorView.state.doc.length, insert: v}],
    });
  }

  constructor() {
    super();
    this._createEditorView();
    new ContextProvider(this, {context: extensionsContext, initialValue: this});
  }

  #addedExtensions = new Set<Extension>();
  #addedExtensionCompartment = new Compartment();

  override render() {
    return this.editorView.dom;
  }

  override createRenderRoot() {
    const root = super.createRenderRoot();
    this.editorView.setRoot(root as ShadowRoot);
    return root;
  }

  changeDocument(change: ChangeSpec): void {
    this.editorView.dispatch({
      changes: [change],
    });
  }

  addExtensions(extensions: Array<Extension>) {
    for (const extension of extensions) {
      this.#addedExtensions.add(extension);
    }
    console;
    const effect = this.#addedExtensionCompartment.reconfigure([
      ...this.#addedExtensions,
    ]);
    this.editorView?.dispatch({effects: [effect]});
  }

  removeExtensions(extensions: Array<Extension>) {
    for (const extension of extensions) {
      this.#addedExtensions.delete(extension);
    }
    const effect = this.#addedExtensionCompartment.reconfigure([
      ...this.#addedExtensions,
    ]);
    this.editorView?.dispatch({effects: [effect]});
  }

  private _createEditorView() {
    const view = (this.editorView = new EditorView({
      dispatch: (t: Transaction) => {
        let notPrevented = this.dispatchEvent(new TransactionEvent(t));

        if (t.docChanged) {
          const changes: Array<Change> = [];
          t.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
            changes.push({fromA, toA, fromB, toB, inserted});
          });

          notPrevented &&= this.dispatchEvent(
            new DocumentChangeEvent(t, changes),
          );
        }

        if (t.selection) {
          notPrevented &&= this.dispatchEvent(
            new SelectionChangeEvent(t, t.selection),
          );
        }

        if (notPrevented) {
          view.update([t]);
        }
      },
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
        ]),
        this.#addedExtensionCompartment.of([]),
      ],
    }));
  }
}
