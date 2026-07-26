import '../index.js';
import {
  languages,
  themes,
  type LanguageSample,
  type ThemeEntry,
} from './samples.js';

const editor = document.querySelector('cm-editor')!;
const languageSelect = document.querySelector<HTMLSelectElement>('#language')!;
const themeSelect = document.querySelector<HTMLSelectElement>('#theme')!;
const markup = document.querySelector<HTMLPreElement>('#markup')!;

/**
 * Each extension element is its own module, so the demo only loads the ones
 * that are actually picked.
 */
const loadElement = (tag: string): Promise<unknown> =>
  import(new URL(`../lib/${tag}.js`, import.meta.url).href);

const addOption = (
  parent: HTMLSelectElement | HTMLOptGroupElement,
  value: number,
  label: string,
) => {
  const option = document.createElement('option');
  option.value = String(value);
  option.textContent = label;
  parent.append(option);
};

for (const [index, entry] of languages.entries()) {
  addOption(languageSelect, index, entry.label);
}

const themeGroups: Array<[ThemeEntry['variant'], string]> = [
  ['dark', 'Dark'],
  ['light', 'Light'],
  ['cssVars', 'Themed with CSS'],
];
for (const [variant, label] of themeGroups) {
  const group = document.createElement('optgroup');
  group.label = label;
  themeSelect.append(group);
  const inGroup = themes
    .filter((theme) => theme.variant === variant)
    .sort((a, b) => a.label.localeCompare(b.label));
  for (const theme of inGroup) {
    addOption(group, themes.indexOf(theme), theme.label);
  }
}

let languageElement: HTMLElement | undefined;
let themeElement: HTMLElement | undefined;

const setLanguage = async (entry: LanguageSample) => {
  await loadElement(entry.tag);

  const element = document.createElement(entry.tag);
  for (const [name, value] of Object.entries(entry.attributes ?? {})) {
    element.setAttribute(name, value);
  }

  // Removing the old element pulls its extensions back out of the editor.
  languageElement?.remove();
  editor.append(element);
  languageElement = element;

  editor.value = entry.sample;
};

/** The custom properties the previous theme set, so they can be cleared. */
let appliedCSSVars: Record<string, string> = {};

const setTheme = async (entry: ThemeEntry | undefined) => {
  // A theme may be pure CSS, with no element to load.
  if (entry?.tag !== undefined) {
    await loadElement(entry.tag);
  }
  themeElement?.remove();
  themeElement = undefined;

  // `<cm-editor>` reads these colors from CSS itself, so the demo only sets
  // them on the editor. They inherit through its shadow root to CodeMirror's
  // own styles.
  for (const name of Object.keys(appliedCSSVars)) {
    editor.style.removeProperty(name);
  }
  appliedCSSVars = entry?.cssVars ?? {};
  for (const [name, value] of Object.entries(appliedCSSVars)) {
    editor.style.setProperty(name, value);
  }

  if (entry?.tag === undefined) {
    return;
  }
  themeElement = document.createElement(entry.tag);
  editor.append(themeElement);
};

/** Shows the markup that matches the current selection, ready to copy. */
const showMarkup = () => {
  const lines = ['<cm-editor>'];
  for (const element of [languageElement, themeElement]) {
    if (element === undefined) {
      continue;
    }
    const attributes = [...element.attributes]
      .map(({name, value}) =>
        value === '' ? ` ${name}` : ` ${name}="${value}"`,
      )
      .join('');
    lines.push(`  <${element.localName}${attributes}></${element.localName}>`);
  }
  lines.push('</cm-editor>');

  // A CSS-driven theme is only half the story without the CSS itself.
  if (Object.keys(appliedCSSVars).length > 0) {
    lines.unshift(
      '<style>',
      '  cm-editor {',
      ...Object.entries(appliedCSSVars).map(
        ([name, value]) => `    ${name}: ${value};`,
      ),
      '  }',
      '</style>',
      '',
    );
  }
  markup.textContent = lines.join('\n');
};

/** Keeps the selection in the URL so a particular combination can be linked. */
const writeHash = () => {
  const params = new URLSearchParams({
    lang: languages[Number(languageSelect.value)]!.label,
  });
  if (themeSelect.value !== '') {
    params.set('theme', themes[Number(themeSelect.value)]!.label);
  }
  history.replaceState(null, '', `#${params}`);
};

const readHash = () => {
  const params = new URLSearchParams(location.hash.slice(1));
  const language = languages.findIndex((l) => l.label === params.get('lang'));
  const theme = themes.findIndex((t) => t.label === params.get('theme'));
  languageSelect.value = String(language === -1 ? 0 : language);
  themeSelect.value = theme === -1 ? '' : String(theme);
};

const apply = async () => {
  // An empty theme value is the "None" option, which leaves the editor on
  // CodeMirror's default styling.
  const theme =
    themeSelect.value === '' ? undefined : themes[Number(themeSelect.value)];
  await Promise.all([
    setLanguage(languages[Number(languageSelect.value)]!),
    setTheme(theme),
  ]);
  showMarkup();
  writeHash();
};

languageSelect.addEventListener('change', apply);
themeSelect.addEventListener('change', apply);

readHash();
await apply();
document.body.removeAttribute('loading');
