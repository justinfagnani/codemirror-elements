/**
 * The list of CodeMirror extensions that are wrapped as custom elements by
 * `generate-extension-elements.ts`.
 *
 * To wrap a new extension, add an entry here and run `npm run generate`. The
 * generator reads the package's TypeScript declarations to discover the
 * extension's options and turns each one into a reactive property (and, for
 * primitive options, an attribute).
 */
export interface ManifestEntry {
  /**
   * The npm specifier to import the extension from. Must be a dependency of this
   * package. A subpath such as `pkg/dark` is allowed, for packages whose entry
   * point can't be resolved.
   */
  module: string;

  /**
   * The name, or names, of the export to wrap. Either a function returning an
   * `Extension` — whose first parameter is introspected for options — or a plain
   * `Extension` value. Omit together with `autoDiscover`.
   */
  export?: string | Array<string>;

  /**
   * Wrap every exported `Extension` value in the module. Used for theme
   * collections, where each theme is a plain value with no options.
   */
  autoDiscover?: boolean;

  /** Export names to skip when `autoDiscover` is set. */
  exclude?: Array<string>;

  /** Prepended to the kebab-cased export name to form the tag name. */
  tagPrefix?: string;

  /** Prepended to the pascal-cased export name to form the class name. */
  classPrefix?: string;

  /**
   * Explicit name overrides, mostly for acronyms that don't survive automatic
   * casing (`json` -> `JSON`). Only usable when the entry wraps a single export.
   */
  tagName?: string;
  className?: string;

  /**
   * A doc comment for the generated class. Defaults to the doc comment on the
   * wrapped export.
   */
  doc?: string | ((exportName: string, humanName: string) => string);

  /**
   * Option names to leave off the generated element, for options that are
   * replaced by hand-written members.
   */
  skipOptions?: Array<string>;

  /**
   * Maps an option name to the property name to expose it as. Required for
   * options whose name would shadow a DOM member, which the generator refuses to
   * emit. Applied before a boolean option is inverted, so renaming `addKeymap`
   * to `keymap` produces `noKeymap`/`no-keymap`.
   */
  renameOptions?: Record<string, string>;

  /**
   * Maps a boolean option name to the value the extension defaults it to,
   * deciding whether the element exposes it directly or inverted as
   * `noFoo`/`no-foo`. Only needed when the generator can't read the default out
   * of the option's doc comment, which it treats as a hard error.
   */
  booleanDefaults?: Record<string, boolean>;

  /**
   * Option names whose types are too rich for an attribute, but which hold plain
   * data and so can be set as a JSON attribute. Without this, such an option is
   * property-only.
   */
  jsonAttributes?: Array<string>;

  /**
   * Raw source appended to the generated imports, class body, and module scope.
   * An escape hatch for options that deserve a friendlier declarative API than
   * their TypeScript type implies (see `lang-sql`).
   */
  extraImports?: string;
  extraMembers?: string;
  extraDeclarations?: string;

  /**
   * Maps an option name to an expression that produces its value, instead of
   * reading the generated property.
   */
  optionOverrides?: Record<string, string>;
}

/** Languages published under the official `@codemirror` scope. */
const languages: Array<ManifestEntry> = [
  {
    module: '@codemirror/lang-css',
    export: 'css',
    className: 'CodeMirrorLangCSS',
  },
  {
    module: '@codemirror/lang-javascript',
    export: 'javascript',
    // `javascript()`'s options carry no doc comments to read a default from.
    booleanDefaults: {jsx: false, typescript: false},
  },
  {
    module: '@codemirror/lang-html',
    export: 'html',
    className: 'CodeMirrorLangHTML',
    // These are plain data, so they're usable as JSON attributes, unlike
    // `nestedLanguages` and `nestedAttributes`, which hold `Parser` instances.
    jsonAttributes: ['extraTags', 'extraGlobalAttributes'],
    // `@codemirror/lang-html` doesn't export the types of its nested language
    // options, and this element did, so they're re-derived here.
    extraDeclarations: [
      `export type NestedLang = NonNullable<Options['nestedLanguages']>[number];`,
      ``,
      `export type NestedAttr = NonNullable<Options['nestedAttributes']>[number];`,
    ].join('\n'),
  },
  {
    module: '@codemirror/lang-json',
    export: 'json',
    className: 'CodeMirrorLangJSON',
  },
  {module: '@codemirror/lang-markdown', export: 'markdown'},
  {
    module: '@codemirror/lang-yaml',
    export: 'yaml',
    className: 'CodeMirrorLangYAML',
  },
  {module: '@codemirror/lang-python', export: 'python'},
  {module: '@codemirror/lang-java', export: 'java'},
  {
    module: '@codemirror/lang-cpp',
    export: 'cpp',
    className: 'CodeMirrorLangCPP',
  },
  {module: '@codemirror/lang-rust', export: 'rust'},
  {module: '@codemirror/lang-go', export: 'go'},
  {
    module: '@codemirror/lang-php',
    export: 'php',
    className: 'CodeMirrorLangPHP',
  },
  {
    module: '@codemirror/lang-xml',
    export: 'xml',
    className: 'CodeMirrorLangXML',
    // `attributes` would shadow `Element.prototype.attributes`.
    renameOptions: {attributes: 'attributeSpecs'},
  },
  {module: '@codemirror/lang-less', export: 'less'},
  {module: '@codemirror/lang-sass', export: 'sass'},
  {module: '@codemirror/lang-vue', export: 'vue'},
  {module: '@codemirror/lang-angular', export: 'angular'},
  {module: '@codemirror/lang-jinja', export: 'jinja'},
  {module: '@codemirror/lang-liquid', export: 'liquid'},
  {module: '@codemirror/lang-wast', export: 'wast'},
  {
    module: '@codemirror/lang-sql',
    export: 'sql',
    className: 'CodeMirrorLangSQL',
    // `dialect` is an `SQLDialect` instance, which can't be written as an
    // attribute. Accept the name of one of the dialects the package defines
    // instead, so the element is usable from plain HTML.
    skipOptions: ['dialect'],
    optionOverrides: {dialect: 'dialects[this.dialect]'},
    extraImports: [
      `import {`,
      `  Cassandra,`,
      `  MariaSQL,`,
      `  MSSQL,`,
      `  MySQL,`,
      `  PLSQL,`,
      `  PostgreSQL,`,
      `  SQLite,`,
      `  StandardSQL,`,
      `  type SQLDialect,`,
      `} from '@codemirror/lang-sql';`,
    ].join('\n'),
    extraMembers: [
      `  /**`,
      `   * The name of the SQL dialect to use. Defaults to \`StandardSQL\`.`,
      `   */`,
      `  @property({type: String, reflect: true, useDefault: true})`,
      `  dialect: SQLDialectName = 'StandardSQL';`,
    ].join('\n'),
    extraDeclarations: [
      `/**`,
      ` * The SQL dialects defined by \`@codemirror/lang-sql\`, keyed by the name`,
      ` * accepted by the \`dialect\` attribute of \`<cm-lang-sql>\`.`,
      ` */`,
      `export const dialects = {`,
      `  StandardSQL,`,
      `  PostgreSQL,`,
      `  MySQL,`,
      `  MariaSQL,`,
      `  MSSQL,`,
      `  SQLite,`,
      `  Cassandra,`,
      `  PLSQL,`,
      `} satisfies Record<string, SQLDialect>;`,
      ``,
      `export type SQLDialectName = keyof typeof dialects;`,
    ].join('\n'),
  },
];

/**
 * Themes. `@codemirror/theme-one-dark` is the only theme published under the
 * official `@codemirror` scope, and is already wrapped by the hand-written
 * `cm-theme-one-dark` element, so the generated themes come from
 * [thememirror](https://thememirror.net/), whose themes are all plain
 * `Extension` values.
 */
const themes: Array<ManifestEntry> = [
  {
    module: 'thememirror',
    autoDiscover: true,
    exclude: ['createTheme'],
    tagPrefix: 'cm-theme-',
    classPrefix: 'CodeMirrorTheme',
    doc: (_exportName, humanName) =>
      `The ${humanName} theme, from [thememirror](https://thememirror.net/).\n\n@see {@link https://thememirror.net/}`,
  },
];

/**
 * Casing that automatic humanization gets wrong, used only for the doc comment
 * on the generated element.
 */
const themeLabels: Record<string, string> = {
  githubLight: 'GitHub Light',
  githubDark: 'GitHub Dark',
  vsCodeLight: 'VS Code Light',
  vsCodeDark: 'VS Code Dark',
};

/**
 * A curated selection of the themes published by
 * [@fsegurai](https://github.com/fsegurai/codemirror-themes), which covers the
 * popular editor themes that thememirror doesn't have.
 *
 * `@uiw` publishes a larger collection, but every one of its theme packages
 * imports `@babel/runtime` helpers without declaring the dependency, which would
 * make `@babel/runtime` a dependency of this package. The `@fsegurai` packages
 * have no runtime dependencies at all.
 *
 * These are wrapped by naming each export rather than with `autoDiscover`,
 * because the packages also export merge-view styling that isn't an extension.
 * Themes that thememirror already provides — `dracula`, `bespin`, `noctisLilac`,
 * and `solarizedLight` — are left out so the tag names don't collide.
 */
const fseguraiThemes: Array<ManifestEntry> = (
  [
    ['monokai', 'monokai'],
    ['github-dark', 'githubDark'],
    ['github-light', 'githubLight'],
    // The vscode packages export `vsCodeDark`/`vsCodeLight`, which would kebab
    // to `cm-theme-vs-code-dark`, so the tag and class names are pinned.
    [
      'vscode-dark',
      'vsCodeDark',
      'cm-theme-vscode-dark',
      'CodeMirrorThemeVSCodeDark',
    ],
    [
      'vscode-light',
      'vsCodeLight',
      'cm-theme-vscode-light',
      'CodeMirrorThemeVSCodeLight',
    ],
    ['solarized-dark', 'solarizedDark'],
    ['nord', 'nord'],
    ['material-dark', 'materialDark'],
    ['material-light', 'materialLight'],
    ['gruvbox-dark', 'gruvboxDark'],
    ['gruvbox-light', 'gruvboxLight'],
  ] satisfies Array<[string, string, string?, string?]>
).map(([name, exportName, tagName, className]) => {
  const module = `@fsegurai/codemirror-theme-${name}`;
  return {
    module,
    export: exportName,
    tagName,
    className,
    tagPrefix: 'cm-theme-',
    classPrefix: 'CodeMirrorTheme',
    doc: (_exportName: string, humanName: string) =>
      `The ${themeLabels[exportName] ?? humanName} theme, from ` +
      `[${module}](https://www.npmjs.com/package/${module}).`,
  };
});

export const manifest: Array<ManifestEntry> = [
  ...languages.map((entry) => ({
    tagPrefix: 'cm-lang-',
    classPrefix: 'CodeMirrorLang',
    ...entry,
  })),
  ...themes,
  ...fseguraiThemes,
];
