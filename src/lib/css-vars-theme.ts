import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {Compartment, type Extension} from '@codemirror/state';
import {EditorView, ViewPlugin, type PluginValue} from '@codemirror/view';
import {tags as t} from '@lezer/highlight';

/**
 * Every custom property this theme reads, with the value it falls back to.
 *
 * The fallbacks reproduce CodeMirror's default light appearance, so the theme
 * is usable with no configuration and each property can be overridden on its
 * own.
 */
export const cssVars = {
  // Editor chrome
  background: '--cm-background',
  foreground: '--cm-foreground',
  caret: '--cm-caret',
  selection: '--cm-selection',
  selectionMatch: '--cm-selection-match',
  activeLine: '--cm-active-line',
  gutterBackground: '--cm-gutter-background',
  gutterForeground: '--cm-gutter-foreground',
  gutterActiveForeground: '--cm-gutter-active-foreground',
  gutterBorder: '--cm-gutter-border',
  fontFamily: '--cm-font-family',
  // Syntax
  comment: '--cm-comment',
  keyword: '--cm-keyword',
  string: '--cm-string',
  number: '--cm-number',
  variable: '--cm-variable',
  function: '--cm-function',
  type: '--cm-type',
  constant: '--cm-constant',
  operator: '--cm-operator',
  punctuation: '--cm-punctuation',
  property: '--cm-property',
  tag: '--cm-tag',
  attribute: '--cm-attribute',
  heading: '--cm-heading',
  link: '--cm-link',
  invalid: '--cm-invalid',
} as const;

/** `var(--cm-thing, fallback)`, with an optional second-choice property. */
const cssVar = (name: keyof typeof cssVars, fallback: string) =>
  `var(${cssVars[name]}, ${fallback})`;

/**
 * A property the theme sets on the editor to `light-dark()`, so that reading it
 * back reports the used color scheme.
 *
 * CodeMirror needs to know whether it's on a light or dark background — the flag
 * picks between the `&light` and `&dark` halves of its base theme, which style
 * the parts this theme doesn't (panels, tooltips, buttons, search matches). That
 * can't be read from a CSS variable directly, but `light-dark()` resolves
 * against the standard `color-scheme` property, so setting a variable to it and
 * reading the computed value gives exactly the platform's own answer, including
 * `prefers-color-scheme` when `color-scheme` is `light dark`.
 *
 * Registering it as a typed `<color>` also makes it animatable, which is what
 * makes changes observable: a transition on the property fires `transitionrun`
 * whenever the used scheme changes, anywhere up the tree.
 */
const colorSchemeProbe = '--cm-color-scheme-probe';
const lightProbeValue = 'rgb(0, 0, 0)';
const darkProbeValue = 'rgb(255, 255, 255)';

/**
 * A second probe, for whether this theme is the one supplying the editor's
 * background.
 *
 * The theme is always active, so it can't announce a dark editor just because
 * the page is dark: `<cm-theme-github-light>` on a page with
 * `color-scheme: dark` would then be paired with the dark half of CodeMirror's
 * base theme. Announcing it only when `--cm-background` is set keeps that to
 * editors actually themed through these properties.
 *
 * Reading `--cm-background` directly wouldn't be observable, since an
 * unregistered property can't transition. Copying it into a registered one
 * makes both the value and its changes readable.
 */
const backgroundProbe = '--cm-background-probe';
const unsetProbeValue = 'rgba(0, 0, 0, 0)';

let probesRegistered = false;
const registerProbes = () => {
  if (probesRegistered) {
    return;
  }
  probesRegistered = true;
  for (const [name, initialValue] of [
    [colorSchemeProbe, lightProbeValue],
    [backgroundProbe, unsetProbeValue],
  ]) {
    try {
      CSS.registerProperty({
        name: name!,
        syntax: '<color>',
        inherits: true,
        initialValue: initialValue!,
      });
    } catch {
      // Already registered, or the browser doesn't support typed properties.
      // The theme still works; only the reaction to a later change is lost.
    }
  }
};

/**
 * Whether this editor is themed through these properties, and if so whether the
 * used color scheme is dark.
 */
const readState = (element: HTMLElement) => {
  const styles = getComputedStyle(element);
  const background = styles.getPropertyValue(backgroundProbe).trim();
  return {
    active: background !== '' && background !== unsetProbeValue,
    dark: styles.getPropertyValue(colorSchemeProbe).trim() === darkProbeValue,
  };
};

/**
 * Keeps the theme's light/dark half in step with the used color scheme.
 *
 * The element can't read the scheme itself: as an unslotted child of
 * `<cm-editor>`'s shadow host it isn't rendered, so `getComputedStyle` reports
 * nothing useful. The editor's own DOM is rendered and inherits from the same
 * place, so the decision is made here instead.
 */
class ColorSchemeWatcher implements PluginValue {
  readonly #view: EditorView;
  readonly #compartment: Compartment;
  readonly #onTransitionRun: (event: TransitionEvent) => void;
  #active = false;
  #dark = false;

  constructor(view: EditorView, compartment: Compartment) {
    this.#view = view;
    this.#compartment = compartment;

    this.#onTransitionRun = (event: TransitionEvent) => {
      if (
        event.propertyName === colorSchemeProbe ||
        event.propertyName === backgroundProbe
      ) {
        this.#sync();
      }
    };
    view.dom.addEventListener('transitionrun', this.#onTransitionRun);

    // The extensions have to be built before there is a view to read the
    // properties from, so they start out inactive and are corrected here. The
    // microtask lands the correction before the first paint; the frame after it
    // catches properties set in the same task the editor was created in, which
    // no transition reports because the element had no previous style to
    // transition from.
    queueMicrotask(() => this.#sync());
    requestAnimationFrame(() => this.#sync());
  }

  #sync() {
    const {active, dark} = readState(this.#view.dom);
    if (active === this.#active && dark === this.#dark) {
      return;
    }
    this.#active = active;
    this.#dark = dark;
    this.#view.dispatch({
      effects: this.#compartment.reconfigure(active ? buildTheme(dark) : []),
    });
  }

  destroy() {
    this.#view.dom.removeEventListener('transitionrun', this.#onTransitionRun);
  }
}

/**
 * Declares the two probes and makes them observable. This is mounted for every
 * editor, including ones that aren't themed through these properties, so it sets
 * nothing that could affect how the editor looks.
 */
const probeTheme = EditorView.theme({
  '&': {
    [colorSchemeProbe]: `light-dark(${lightProbeValue}, ${darkProbeValue})`,
    [backgroundProbe]: `var(${cssVars.background}, ${unsetProbeValue})`,
    transitionProperty: `${colorSchemeProbe}, ${backgroundProbe}`,
    transitionDuration: '1ms',
    transitionTimingFunction: 'step-end',
  },
});

const buildTheme = (dark: boolean): Array<Extension> => {
  const foreground = cssVar('foreground', 'inherit');

  const theme = EditorView.theme(
    {
      '&': {
        color: foreground,
        backgroundColor: cssVar('background', 'transparent'),
        fontFamily: cssVar('fontFamily', 'monospace'),
      },
      '.cm-content': {
        caretColor: cssVar('caret', foreground),
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: cssVar('caret', foreground),
      },
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
        {
          backgroundColor: cssVar('selection', 'Highlight'),
        },
      '.cm-selectionMatch': {
        backgroundColor: cssVar('selectionMatch', 'transparent'),
      },
      '.cm-activeLine': {
        backgroundColor: cssVar('activeLine', 'transparent'),
      },
      '.cm-gutters': {
        color: cssVar('gutterForeground', foreground),
        backgroundColor: cssVar('gutterBackground', 'transparent'),
        borderRight: `1px solid ${cssVar('gutterBorder', 'transparent')}`,
      },
      '.cm-activeLineGutter': {
        color: cssVar(
          'gutterActiveForeground',
          cssVar('gutterForeground', foreground),
        ),
        backgroundColor: cssVar('activeLine', 'transparent'),
      },
    },
    // Tells CodeMirror which of its built-in light/dark styles to pair with the
    // custom properties. It can't be inferred from a CSS variable.
    {dark},
  );

  const highlightStyle = HighlightStyle.define(
    [
      {
        tag: [t.comment, t.lineComment, t.blockComment, t.docComment],
        color: cssVar('comment', '#940'),
      },
      {
        tag: [
          t.keyword,
          t.modifier,
          t.controlKeyword,
          t.moduleKeyword,
          t.self,
          t.null,
        ],
        color: cssVar('keyword', '#708'),
      },
      {
        tag: [t.string, t.special(t.string), t.regexp],
        color: cssVar('string', '#a11'),
      },
      {tag: [t.number, t.bool, t.literal], color: cssVar('number', '#164')},
      {
        tag: [t.variableName, t.labelName],
        color: cssVar('variable', foreground),
      },
      {
        tag: [
          t.function(t.variableName),
          t.function(t.propertyName),
          t.macroName,
        ],
        color: cssVar('function', '#00f'),
      },
      {
        tag: [t.typeName, t.className, t.namespace],
        color: cssVar('type', '#085'),
      },
      {
        tag: [t.constant(t.name), t.standard(t.name), t.atom],
        color: cssVar('constant', '#219'),
      },
      {
        tag: [t.operator, t.operatorKeyword, t.derefOperator],
        color: cssVar('operator', '#708'),
      },
      {
        tag: [t.punctuation, t.separator, t.bracket, t.paren, t.brace],
        color: cssVar('punctuation', foreground),
      },
      {
        tag: [t.propertyName, t.definition(t.propertyName)],
        color: cssVar('property', '#00c'),
      },
      {tag: [t.tagName, t.angleBracket], color: cssVar('tag', '#170')},
      {tag: [t.attributeName], color: cssVar('attribute', '#00c')},
      {tag: [t.heading], color: cssVar('heading', '#161'), fontWeight: 'bold'},
      {
        tag: [t.link, t.url],
        color: cssVar('link', '#219'),
        textDecoration: 'underline',
      },
      {tag: [t.invalid], color: cssVar('invalid', '#f00')},
      {tag: [t.emphasis], fontStyle: 'italic'},
      {tag: [t.strong], fontWeight: 'bold'},
      {tag: [t.strikethrough], textDecoration: 'line-through'},
    ],
    {themeType: dark ? 'dark' : 'light'},
  );

  return [theme, syntaxHighlighting(highlightStyle)];
};

/**
 * The CSS-variable theme, plus the watcher that keeps its light/dark half in
 * step with the used `color-scheme`.
 */
export const cssVarsTheme = (): Extension => {
  registerProbes();
  const compartment = new Compartment();
  return [
    probeTheme,
    // Nothing is styled until `--cm-background` is set. An editor that isn't
    // themed through these properties has to look exactly as it would without
    // them, and the fallbacks can't manage that on their own: they would
    // override CodeMirror's own base theme, which already has light and dark
    // defaults for the active line, gutters, and selection, and the highlight
    // style would displace `defaultHighlightStyle` entirely.
    compartment.of([]),
    ViewPlugin.define((view) => new ColorSchemeWatcher(view, compartment)),
  ];
};
