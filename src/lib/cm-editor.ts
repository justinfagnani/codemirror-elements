import {css, html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {ContextProvider} from '@lit-labs/context';

import {
  EditorView,
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
  highlightActiveLineGutter,
} from '@codemirror/view';
import {
  Compartment,
  type EditorSelection,
  EditorState,
  Transaction,
  type Extension,
  type Text,
} from '@codemirror/state';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from '@codemirror/language';
import {defaultKeymap, history, historyKeymap} from '@codemirror/commands';
import {searchKeymap, highlightSelectionMatches} from '@codemirror/search';
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';
import {lintKeymap} from '@codemirror/lint';
import {extensionsContext} from './extension-host-context.js';

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
    }
    #wrapper {
      /* TODO: grad from theme */
      border: solid 1px rgb(221, 221, 221);
    }
  `;

  @property({attribute: false})
  editorView?: EditorView;

  /**
   * If we don't have an editor view yet, this will be the value set from the
   * outside.
   */
  #setValue?: string;

  @property()
  get value(): string | undefined {
    if (this.editorView === undefined) {
      return this.#setValue;
    } else {
      return this.editorView.state.doc.toString();
    }
  }

  set value(v: string | undefined) {
    if (this.editorView === undefined) {
      this.#setValue = v;
    } else {
      this.editorView.dispatch({
        changes: [{from: 0, to: this.editorView.state.doc.length, insert: v}],
      });
    }
  }

  constructor() {
    super();
    new ContextProvider(this, extensionsContext, this);
  }

  #addedExtensions = new Set<Extension>();
  #addedExtensionCompartment = new Compartment();

  override render() {
    return html`<div id="wrapper"></div>`;
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

  // protected override updated(
  //   changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  // ): void {
  //   // console.log('updated');
  //   if (changedProperties.has('value')) {
  //     const editor = this.editorView!;
  //     const length = editor.state.doc.length;
  //     editor.dispatch({
  //       changes: [{from: 0, to: length, insert: this.value}],
  //     });
  //   }
  // }

  protected override async firstUpdated() {
    const wrapper = this.shadowRoot!.querySelector('#wrapper');
    const view = (this.editorView = new EditorView({
      doc: this.#setValue,
      dispatch: (t: Transaction) => {
        let notPrevented = this.dispatchEvent(new TransactionEvent(t));

        if (t.docChanged) {
          const changes: Array<Change> = [];
          t.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
            changes.push({fromA, toA, fromB, toB, inserted});
          });

          notPrevented &&= this.dispatchEvent(
            new DocumentChangeEvent(t, changes)
          );
        }

        if (t.selection) {
          notPrevented &&= this.dispatchEvent(
            new SelectionChangeEvent(t, t.selection)
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
      parent: wrapper!,
    }));
    this.#setValue = undefined;
  }
}

export class TransactionEvent extends Event {
  static readonly eventName = 'codemirror-transaction';

  public readonly transaction: Transaction;

  declare target: CodeMirrorEditor;

  constructor(transaction: Transaction) {
    super(TransactionEvent.eventName, {bubbles: true});
    this.transaction = transaction;
  }
}

export class DocumentChangeEvent extends Event {
  static readonly eventName = 'codemirror-document-change';

  public readonly transaction: Transaction;
  public changes: Array<Change>;

  declare target: CodeMirrorEditor;

  constructor(transaction: Transaction, changes: Array<Change>) {
    super(TransactionEvent.eventName, {bubbles: true});
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

export class SelectionChangeEvent extends Event {
  static readonly eventName = 'codemirror-selection-change';

  public readonly transaction: Transaction;
  public readonly selection: EditorSelection;

  declare target: CodeMirrorEditor;

  constructor(transaction: Transaction, selection: EditorSelection) {
    super(TransactionEvent.eventName, {bubbles: true});
    this.transaction = transaction;
    this.selection = selection;
  }
}
