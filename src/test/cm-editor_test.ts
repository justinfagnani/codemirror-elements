import {
  DocumentChangeEvent,
  SelectionChangeEvent,
  TransactionEvent,
} from '../lib/cm-editor.js';
import type {CodeMirrorEditor} from '../lib/cm-editor.js';
import {assert} from 'chai';
import {EditorSelection} from '@codemirror/state';

suite('cm-editor', () => {
  let el: CodeMirrorEditor;

  setup(() => {
    el = document.createElement('cm-editor');
    document.body.appendChild(el);
  });

  teardown(() => {
    el.remove();
  });

  test('can set and read a value', async () => {
    el.value = 'foo';
    assert.equal(el.value, 'foo');
  });

  test('fires selection, transaction, and document change event when text is edited', async () => {
    let selectionEventFired = false;
    let transactionEventFired = false;
    let documentChangeEventFired = false;
    el.addEventListener(SelectionChangeEvent.eventName, () => {
      selectionEventFired = true;
    });
    el.addEventListener(TransactionEvent.eventName, () => {
      transactionEventFired = true;
    });
    el.addEventListener(DocumentChangeEvent.eventName, () => {
      documentChangeEventFired = true;
    });

    el.value = 'foo';
    el.editorView.dispatch({
      selection: EditorSelection.cursor(1),
    });

    assert.isTrue(selectionEventFired);
    assert.isTrue(transactionEventFired);
    assert.isTrue(documentChangeEventFired);
  });
});
