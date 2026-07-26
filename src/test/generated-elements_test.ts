import {language} from '@codemirror/language';
import {EditorView} from '@codemirror/view';
import {assert} from 'chai';
import '../lib/cm-editor.js';
import type {CodeMirrorEditor} from '../lib/cm-editor.js';
import '../lib/cm-lang-lit.js';
import '../lib/cm-lang-python.js';
import '../lib/cm-lang-sass.js';
import '../lib/cm-lang-sql.js';
import {dialects} from '../lib/cm-lang-sql.js';
import '../lib/cm-lang-xml.js';
import '../lib/cm-theme-dracula.js';
import '../lib/cm-theme-monokai.js';
import '../lib/cm-theme-solarized-dark.js';
import '../lib/cm-theme-vscode-dark.js';

suite('generated extension elements', () => {
  let editor: CodeMirrorEditor;

  setup(() => {
    editor = document.createElement('cm-editor');
    document.body.appendChild(editor);
  });

  teardown(() => {
    editor.remove();
  });

  const currentLanguage = () => editor.editorView.state.facet(language);

  /** The theme reacts through CSS transitions, so changes land a tick later. */
  const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

  const inputHandlerCount = () =>
    editor.editorView.state.facet(EditorView.inputHandler).length;

  test('applies a language extension that has no options', async () => {
    const el = document.createElement('cm-lang-python');
    editor.appendChild(el);
    await el.updateComplete;

    assert.equal(currentLanguage()?.name, 'python');
  });

  test('removes the extension when the element is removed', async () => {
    const el = document.createElement('cm-lang-python');
    editor.appendChild(el);
    await el.updateComplete;
    assert.equal(currentLanguage()?.name, 'python');

    el.remove();

    assert.isNull(currentLanguage());
  });

  test('applies a language extension that has options', async () => {
    const el = document.createElement('cm-lang-xml');
    editor.appendChild(el);
    await el.updateComplete;

    assert.equal(currentLanguage()?.name, 'xml');
  });

  test('an option that defaults to true is exposed inverted', async () => {
    const el = document.createElement('cm-lang-xml');
    editor.appendChild(el);
    await el.updateComplete;

    // Absent, so `xml()` gets `autoCloseTags: true`, its own default.
    // `autoCloseTags` installs itself as an extra input handler.
    assert.isFalse(el.noAutoCloseTags);
    const withAutoClose = inputHandlerCount();

    el.toggleAttribute('no-auto-close-tags', true);
    await el.updateComplete;
    assert.isTrue(el.noAutoCloseTags);
    assert.equal(inputHandlerCount(), withAutoClose - 1);

    el.toggleAttribute('no-auto-close-tags', false);
    await el.updateComplete;
    assert.isFalse(el.noAutoCloseTags);
    assert.equal(inputHandlerCount(), withAutoClose);
  });

  test('an option that defaults to false is exposed directly', async () => {
    const el = document.createElement('cm-lang-sass');
    editor.appendChild(el);
    await el.updateComplete;

    assert.isFalse(el.indented);
    const scss = currentLanguage();

    el.toggleAttribute('indented', true);
    await el.updateComplete;

    assert.isTrue(el.indented);
    assert.notEqual(currentLanguage(), scss);
  });

  test('reconfigures the extension when an option changes', async () => {
    const el = document.createElement('cm-lang-sql');
    editor.appendChild(el);
    await el.updateComplete;
    assert.equal(currentLanguage(), dialects.StandardSQL.language);

    el.setAttribute('dialect', 'PostgreSQL');
    await el.updateComplete;

    assert.equal(currentLanguage(), dialects.PostgreSQL.language);
  });

  test('reflects primitive options, but not their initial values', async () => {
    const el = document.createElement('cm-lang-sql');
    editor.appendChild(el);
    await el.updateComplete;

    // `useDefault` keeps the initial values off an unconfigured element.
    assert.isFalse(el.hasAttribute('dialect'));
    assert.isFalse(el.hasAttribute('upper-case-keywords'));

    el.dialect = 'SQLite';
    el.upperCaseKeywords = true;
    await el.updateComplete;

    assert.equal(el.getAttribute('dialect'), 'SQLite');
    assert.equal(el.getAttribute('upper-case-keywords'), '');
  });

  test('restores a non-nullish option default when its attribute is removed', async () => {
    const el = document.createElement('cm-lang-sql');
    el.setAttribute('dialect', 'SQLite');
    editor.appendChild(el);
    await el.updateComplete;
    assert.equal(currentLanguage(), dialects.SQLite.language);

    el.removeAttribute('dialect');
    await el.updateComplete;

    // `useDefault` restores the initial value rather than leaving it `null`.
    assert.equal(el.dialect, 'StandardSQL');
    assert.equal(currentLanguage(), dialects.StandardSQL.language);
  });

  test('drops an option whose attribute is removed', async () => {
    const el = document.createElement('cm-lang-sql');
    el.setAttribute('default-table', 'users');
    editor.appendChild(el);
    await el.updateComplete;
    assert.equal(el.defaultTable, 'users');

    el.removeAttribute('default-table');
    await el.updateComplete;

    // An option with no meaningful default can't be restored by `useDefault`,
    // because Lit treats a nullish stored default as "no default" and falls back
    // to the converter's `null`. The generated code tests for `!= null`, so the
    // option is dropped from the config either way.
    assert.isNull(el.defaultTable ?? null);
  });

  test('applies an extension whose options all use useDefault', async () => {
    // `<cm-lang-lit>` is hand-written and its options are `useDefault`, which
    // keeps their initial values out of `changedProperties`. Its first update
    // still has to apply the extension.
    const el = document.createElement('cm-lang-lit');
    editor.appendChild(el);
    await el.updateComplete;

    assert.isNotNull(currentLanguage());
  });

  test('applies the third-party themes', async () => {
    for (const tag of [
      'cm-theme-monokai',
      'cm-theme-solarized-dark',
      'cm-theme-vscode-dark',
    ] as const) {
      const before = getComputedStyle(editor.editorView.dom).backgroundColor;
      const el = document.createElement(tag);
      editor.appendChild(el);
      await el.updateComplete;

      assert.notEqual(
        getComputedStyle(editor.editorView.dom).backgroundColor,
        before,
        `${tag} did not change the editor background`,
      );
      el.remove();
    }
  });

  test('themes the editor from CSS custom properties', async () => {
    // No extension element: `<cm-editor>` reads these itself. The property is
    // set outside the editor's shadow root, so it has to inherit through the
    // boundary to reach CodeMirror's injected styles.
    editor.style.setProperty('--cm-background', 'rgb(30, 30, 46)');
    editor.style.setProperty('--cm-keyword', 'rgb(203, 166, 247)');
    await settle();

    assert.equal(
      getComputedStyle(editor.editorView.dom).backgroundColor,
      'rgb(30, 30, 46)',
    );
  });

  test('leaves an editor with no CSS variables untouched', async () => {
    // A page-wide dark color scheme must not make an unthemed editor claim to
    // be dark, or CodeMirror pairs a light theme with its dark base styles.
    editor.style.colorScheme = 'dark';
    await settle();
    assert.isFalse(editor.editorView.state.facet(EditorView.darkTheme));

    editor.style.setProperty('--cm-background', 'rgb(30, 30, 46)');
    await settle();
    assert.isTrue(editor.editorView.state.facet(EditorView.darkTheme));
  });

  test('CSS variable theming follows the `color-scheme` property', async () => {
    editor.style.setProperty('--cm-background', 'rgb(30, 30, 46)');
    editor.style.colorScheme = 'light';
    await settle();
    assert.isFalse(editor.editorView.state.facet(EditorView.darkTheme));

    editor.style.colorScheme = 'dark';
    await settle();
    assert.isTrue(
      editor.editorView.state.facet(EditorView.darkTheme),
      'color-scheme: dark should switch the editor to dark',
    );

    editor.style.colorScheme = 'light';
    await settle();
    assert.isFalse(
      editor.editorView.state.facet(EditorView.darkTheme),
      'color-scheme: light should switch it back',
    );
  });

  test('applies a theme extension', async () => {
    const before = getComputedStyle(editor.editorView.dom).backgroundColor;

    const el = document.createElement('cm-theme-dracula');
    editor.appendChild(el);
    await el.updateComplete;

    assert.notEqual(
      getComputedStyle(editor.editorView.dom).backgroundColor,
      before,
    );
  });
});
