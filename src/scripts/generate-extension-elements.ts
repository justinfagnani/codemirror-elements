#!/usr/bin/env node

/**
 * Generates `CodeMirrorExtensionElement` subclasses for the CodeMirror
 * extensions listed in `extension-manifest.ts`.
 *
 * For each extension, the TypeScript declarations of its package are loaded with
 * the TypeScript compiler API and the extension's export is inspected:
 *
 * - A plain `Extension` value (most themes) becomes an element that applies the
 *   extension from its constructor.
 * - A function returning an `Extension` (most languages) has the properties of
 *   its config parameter turned into reactive properties. Boolean, string, and
 *   number options also get attributes; options with richer types (parsers,
 *   languages, completion sources) are property-only.
 *
 * String, number, and complex options default to `undefined` and are only passed
 * to the extension once set, so an option left alone keeps its upstream default.
 *
 * Boolean options are plain boolean attributes that default to false. A boolean
 * option that CodeMirror defaults to `true` is inverted, and exposed as
 * `noFoo`/`no-foo`, so that an absent boolean attribute always means "the
 * CodeMirror default" and a present one always means the opposite. The default
 * is read from the option's doc comment, which is a hard error when inconclusive
 * (see `detectBooleanDefault`).
 *
 * Usage:
 *
 *     npm run generate               # write the elements
 *     npm run generate -- --check    # fail if any generated file is out of date
 *     npm run generate -- --markdown # print a table of what was generated
 *
 * Generated files are committed and can be edited by hand, but a regeneration
 * will overwrite them. Prefer `extraMembers` in the manifest for customizations
 * that should survive.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as prettier from 'prettier';
import ts from 'typescript';
import {manifest, type ManifestEntry} from './extension-manifest.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const outDir = path.join(packageRoot, 'src', 'lib');
const check = process.argv.includes('--check');

/** How an option is exposed on the generated element. */
type AttributeType = 'Boolean' | 'String' | 'Number' | 'Object' | 'complex';

/** One option of an extension, as it will appear on the element. */
interface Option {
  /** The name of the property on the extension's config object. */
  optionName: string;
  /** The name of the reactive property, which may be renamed or inverted. */
  name: string;
  attributeType: AttributeType;
  hasAttribute: boolean;
  /** Whether this is a `noFoo` property for an option that defaults to true. */
  inverted: boolean;
  optional: boolean;
  doc: string;
}

/** A single element to generate, after a manifest entry has been expanded. */
interface Descriptor extends ManifestEntry {
  exportName: string;
  humanName: string;
  moduleSpecifier: string;
  tagName: string;
  className: string;
  doc?: string;
}

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------

const toKebabCase = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

const toPascalCase = (name: string) => name[0]!.toUpperCase() + name.slice(1);

const toHumanName = (name: string) =>
  toKebabCase(name)
    .split('-')
    .map((word) => toPascalCase(word))
    .join(' ');

// ---------------------------------------------------------------------------
// Reading the extension package's declarations
// ---------------------------------------------------------------------------

/**
 * Resolves the entrypoint `.d.ts` of an installed package, from its `types`
 * field or its `exports` map.
 */
const resolveDeclarationFile = (moduleSpecifier: string): string => {
  const segments = moduleSpecifier.split('/');
  const packageName = moduleSpecifier.startsWith('@')
    ? segments.slice(0, 2).join('/')
    : segments[0]!;
  const subpath = moduleSpecifier.slice(packageName.length + 1);
  const packageDir = path.join(packageRoot, 'node_modules', packageName);

  const packageJsonPath = path.join(packageDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(
      `${moduleSpecifier} is not installed. Add it to the dependencies of ` +
        `codemirror-elements before wrapping it.`,
    );
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    types?: string;
    typings?: string;
    main?: string;
    exports?: unknown;
  };

  // Picks the `.d.ts` out of one entry of an `exports` map, preferring the
  // `types` condition.
  const fromExports = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
      return value.endsWith('.d.ts') ? value : undefined;
    }
    if (value == null || typeof value !== 'object') {
      return undefined;
    }
    for (const key of ['types', 'import', 'default', 'require']) {
      const resolved = fromExports((value as Record<string, unknown>)[key]);
      if (resolved !== undefined) {
        return resolved;
      }
    }
    return undefined;
  };

  const exportsMap = packageJson.exports as
    Record<string, unknown> | undefined | null;

  // A subpath specifier such as `pkg/esm/dark.js` or `pkg/dark` names a module
  // directly. Needed for packages whose entry point re-exports from
  // extensionless paths, which `nodenext` can't follow. The `exports` map is
  // consulted first, since the declarations for a subpath aren't always beside
  // the JavaScript it points at.
  const candidates =
    subpath !== ''
      ? [
          fromExports(exportsMap?.[`./${subpath}`]),
          subpath.replace(/\.[cm]?js$/, '') + '.d.ts',
        ]
      : [
          packageJson.types,
          packageJson.typings,
          fromExports(exportsMap?.['.']),
          packageJson.main?.replace(/\.[cm]?js$/, '.d.ts'),
          'index.d.ts',
        ];

  for (const candidate of candidates) {
    if (candidate === undefined) {
      continue;
    }
    const declarationFile = path.join(packageDir, candidate);
    if (fs.existsSync(declarationFile)) {
      return declarationFile;
    }
  }
  throw new Error(
    `Could not find TypeScript declarations for ${moduleSpecifier}`,
  );
};

/**
 * Creates a `TypeChecker` over the declaration files of every module in the
 * manifest, so that the compiler is only started once.
 *
 * The project's own compiler options are used, so that what the generator can
 * see matches what `tsc` will accept in the generated code. Under a laxer
 * `moduleResolution` the generator can discover exports that the project can't
 * actually import — some packages re-export from extensionless relative paths,
 * which `nodenext` rejects — and would emit elements that don't compile.
 */
const createChecker = (declarationFiles: Array<string>) => {
  const configPath = path.join(packageRoot, 'tsconfig.json');
  const {config, error} = ts.readConfigFile(configPath, ts.sys.readFile);
  if (error !== undefined) {
    throw new Error(`Could not read ${configPath}`);
  }
  const {options} = ts.parseJsonConfigFileContent(config, ts.sys, packageRoot);

  const program = ts.createProgram(declarationFiles, {
    ...options,
    // The generator only reads types, so anything about emit is dropped.
    noEmit: true,
    incremental: false,
    composite: false,
    declaration: false,
    tsBuildInfoFile: undefined,
    outDir: undefined,
    rootDir: undefined,
    skipLibCheck: true,
  });
  return {program, checker: program.getTypeChecker()};
};

const getModuleExports = (
  program: ts.Program,
  checker: ts.TypeChecker,
  declarationFile: string,
): Array<ts.Symbol> => {
  const sourceFile = program.getSourceFile(declarationFile);
  if (sourceFile === undefined) {
    throw new Error(`Could not load ${declarationFile}`);
  }
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (moduleSymbol === undefined) {
    throw new Error(`${declarationFile} does not declare a module`);
  }
  return checker.getExportsOfModule(moduleSymbol);
};

const getDeclaration = (symbol: ts.Symbol): ts.Declaration | undefined =>
  symbol.valueDeclaration ?? symbol.declarations?.[0];

const getDocumentation = (symbol: ts.Symbol, checker: ts.TypeChecker) =>
  ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();

const getType = (symbol: ts.Symbol, checker: ts.TypeChecker): ts.Type => {
  const declaration = getDeclaration(symbol);
  return declaration === undefined
    ? checker.getDeclaredTypeOfSymbol(symbol)
    : checker.getTypeOfSymbolAtLocation(symbol, declaration);
};

const getCallSignature = (
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
): ts.Signature | undefined =>
  checker.getSignaturesOfType(
    getType(symbol, checker),
    ts.SignatureKind.Call,
  )[0];

/**
 * Classifies an option's type as one of Lit's primitive attribute types, or as
 * `complex` for types that can only be set as a property.
 */
const classifyOptionType = (
  type: ts.Type,
  checker: ts.TypeChecker,
): AttributeType => {
  const nonNullable = checker.getNonNullableType(type);
  const matches = (flags: ts.TypeFlags) =>
    Boolean(nonNullable.flags & flags) ||
    (nonNullable.isUnion() &&
      nonNullable.types.every((constituent) => constituent.flags & flags));

  if (matches(ts.TypeFlags.BooleanLike)) {
    return 'Boolean';
  }
  if (matches(ts.TypeFlags.StringLike)) {
    return 'String';
  }
  if (matches(ts.TypeFlags.NumberLike)) {
    return 'Number';
  }
  return 'complex';
};

/**
 * Names that can't be used as reactive properties because they would shadow a
 * member of the DOM or of `CodeMirrorExtensionElement`. An option with one of
 * these names has to be renamed with `renameOptions` in the manifest.
 */
const reservedNames = new Set([
  // Node, Element, and HTMLElement
  'attributes',
  'children',
  'classList',
  'className',
  'dataset',
  'dir',
  'hidden',
  'id',
  'inert',
  'innerHTML',
  'innerText',
  'lang',
  'nonce',
  'outerHTML',
  'outerText',
  'part',
  'prefix',
  'role',
  'shadowRoot',
  'slot',
  'spellcheck',
  'style',
  'tabIndex',
  'textContent',
  'title',
  'translate',
  // ReactiveElement and CodeMirrorExtensionElement
  'extensionHost',
  'hasUpdated',
  'renderRoot',
  'setExtensions',
  'updateComplete',
]);

/**
 * Phrasings that CodeMirror's option documentation uses to state a boolean
 * option's default. TypeScript declarations don't carry default values, but a
 * boolean option's default decides whether the element exposes it directly or
 * inverted, so it has to come from somewhere.
 *
 * Guessing wrong would silently flip the option, so an option whose default
 * can't be read confidently is a hard error, fixed by declaring it in the
 * manifest.
 */
// The boolean literal is often written as `true`/`false` in backticks or quotes.
const literal = (value: string) => new RegExp(`to ['"\`]?${value}\\b`, 'i');
const defaultTruePhrases = [
  /defaults? to ['"`]?true\b/i,
  new RegExp(`set (?:this|it) ${literal('false').source}`, 'i'),
  /turn (?:that|this|it) off/i,
];
const defaultFalsePhrases = [
  /defaults? to ['"`]?false\b/i,
  new RegExp(`set (?:this|it) ${literal('true').source}`, 'i'),
  /when (?:set to|enabled)/i,
];

/**
 * Reads a boolean option's default out of its doc comment. Returns `undefined`
 * when the documentation says nothing conclusive, or contradicts itself.
 */
const detectBooleanDefault = (doc: string): boolean | undefined => {
  const saysTrue = defaultTruePhrases.some((phrase) => phrase.test(doc));
  const saysFalse = defaultFalsePhrases.some((phrase) => phrase.test(doc));
  if (saysTrue === saysFalse) {
    return undefined;
  }
  return saysTrue;
};

/**
 * Inspects an extension export.
 *
 * Returns `undefined` if it's a plain `Extension` value, or the options
 * discovered from the properties of its config parameter if it's a factory
 * function. A factory that takes no arguments has no options, and gets an empty
 * array.
 */
const discoverOptions = (
  exportSymbol: ts.Symbol,
  checker: ts.TypeChecker,
  entry: ManifestEntry,
): Array<Option> | undefined => {
  const signature = getCallSignature(exportSymbol, checker);
  if (signature === undefined) {
    return undefined;
  }
  const [configParameter] = signature.parameters;
  if (configParameter === undefined) {
    return [];
  }

  const configType = checker.getNonNullableType(
    getType(configParameter, checker),
  );
  const skip = new Set(entry.skipOptions ?? []);
  const renames = entry.renameOptions ?? {};

  return checker
    .getPropertiesOfType(configType)
    .filter((option) => {
      // `@hide` marks options that the package documents as internal.
      const hidden = option
        .getJsDocTags(checker)
        .some((tag) => tag.name === 'hide');
      return !hidden && !skip.has(option.name);
    })
    .map((option): Option => {
      const baseName = renames[option.name] ?? option.name;
      const attributeType = classifyOptionType(
        getType(option, checker),
        checker,
      );
      const doc = getDocumentation(option, checker);

      // A boolean option that CodeMirror defaults to `true` is exposed
      // inverted, as `noFoo`/`no-foo`, so that every boolean attribute means
      // the same thing: absent is the CodeMirror default, present is the
      // opposite.
      let defaultsToTrue = false;
      if (attributeType === 'Boolean') {
        const declared = entry.booleanDefaults?.[option.name];
        const detected = declared ?? detectBooleanDefault(doc);
        if (detected === undefined) {
          throw new Error(
            `Can't tell whether the '${option.name}' option of ${entry.module} ` +
              `defaults to true or false, so it can't be exposed as a boolean ` +
              `attribute. Declare it in src/scripts/extension-manifest.ts as ` +
              `booleanDefaults: {${option.name}: true} (or false).`,
          );
        }
        defaultsToTrue = detected;
      }

      const propertyName = defaultsToTrue
        ? `no${toPascalCase(baseName)}`
        : baseName;
      if (reservedNames.has(propertyName)) {
        throw new Error(
          `The '${option.name}' option of ${entry.module} would shadow a ` +
            `built-in member as a reactive property. Add a ` +
            `renameOptions: {${option.name}: '...'} entry for it in ` +
            `src/scripts/extension-manifest.ts.`,
        );
      }
      // An option with a type too rich for an attribute is property-only, unless
      // the manifest opts it into a JSON attribute with `jsonAttributes`.
      const isJsonAttribute = (entry.jsonAttributes ?? []).includes(
        option.name,
      );
      return {
        optionName: option.name,
        name: propertyName,
        attributeType: isJsonAttribute ? 'Object' : attributeType,
        hasAttribute: attributeType !== 'complex' || isJsonAttribute,
        inverted: defaultsToTrue,
        optional: Boolean(option.flags & ts.SymbolFlags.Optional),
        doc,
      };
    });
};

// ---------------------------------------------------------------------------
// Emitting elements
// ---------------------------------------------------------------------------

const emitDocComment = (doc: string | undefined, indent = '') => {
  if (doc === undefined || doc === '') {
    return '';
  }
  const lines = doc.split('\n');
  return [
    `${indent}/**`,
    ...lines.map((line) => `${indent} *${line === '' ? '' : ` ${line}`}`),
    `${indent} */`,
    '',
  ].join('\n');
};

const emitHeader = () =>
  [
    `// This file is generated by src/scripts/generate-extension-elements.ts.`,
    `// Run \`npm run generate\` to update it. Hand edits will be overwritten;`,
    `// add customizations to src/scripts/extension-manifest.ts instead.`,
    ``,
  ].join('\n');

const emitTagNameMap = (tagName: string, className: string) =>
  [
    `declare global {`,
    `  interface HTMLElementTagNameMap {`,
    `    '${tagName}': ${className};`,
    `  }`,
    `}`,
    ``,
  ].join('\n');

/**
 * An element for an extension with no options: either a plain `Extension` value,
 * such as a theme, or a factory that takes no arguments.
 */
const emitValueElement = ({
  tagName,
  className,
  moduleSpecifier,
  exportName,
  doc,
  isFactory,
  extraImports,
  extraMembers,
  extraDeclarations,
}: Descriptor & {isFactory: boolean}) => {
  const members = [
    `  constructor() {`,
    `    super();`,
    `    this.setExtensions([${exportName}${isFactory ? '()' : ''}]);`,
    `  }`,
  ];
  if (extraMembers !== undefined) {
    members.push('', extraMembers);
  }

  return [
    emitHeader(),
    `import {${exportName}} from '${moduleSpecifier}';`,
    `import {customElement} from 'lit/decorators.js';`,
    `import {CodeMirrorExtensionElement} from './cm-extension-element.js';`,
    ...(extraImports === undefined ? [] : [extraImports]),
    ``,
    emitTagNameMap(tagName, className),
    ...(extraDeclarations === undefined ? [] : [extraDeclarations, '']),
    emitDocComment(doc) +
      `@customElement('${tagName}')\n` +
      `export class ${className} extends CodeMirrorExtensionElement {\n` +
      members.join('\n') +
      `\n}`,
    ``,
  ].join('\n');
};

/** An element for an extension that is a function taking a config object. */
const emitFactoryElement = ({
  tagName,
  className,
  moduleSpecifier,
  exportName,
  doc,
  options,
  optionOverrides,
  extraImports,
  extraMembers,
  extraDeclarations,
}: Descriptor & {options: Array<Option>}) => {
  const litImports = ['type PropertyValues'];
  const decoratorImports = ['customElement'];
  if (options.length > 0 || extraMembers !== undefined) {
    decoratorImports.push('property');
  }
  const members = options.map((option) => {
    const attribute = toKebabCase(option.name);
    const propertyOptions: Array<string> = [];
    if (option.hasAttribute) {
      propertyOptions.push(`type: ${option.attributeType}`);
      if (attribute !== option.name) {
        propertyOptions.push(`attribute: '${attribute}'`);
      }
      // Re-serializing an object on every change costs more than it's worth, so
      // only primitives reflect. `useDefault` keeps the initial value from
      // reflecting, and restores it when the attribute is removed.
      if (option.attributeType !== 'Object') {
        propertyOptions.push(`reflect: true`);
      }
      propertyOptions.push(`useDefault: true`);
    } else {
      propertyOptions.push(`attribute: false`);
    }

    // An inverted boolean keeps the upstream documentation, prefaced by a note
    // about which option it actually controls.
    const optionDoc = option.inverted
      ? `Disables the \`${option.optionName}\` option of \`${exportName}()\`, ` +
        `which is enabled by default.\n\nThe documentation for ` +
        `\`${option.optionName}\` follows:\n\n${option.doc}`
      : option.doc;

    // `useDefault` requires an initialized property, so anything with an
    // attribute gets one: `false` for booleans, whose absent attribute already
    // means false, and `undefined` for the rest.
    let declaration;
    if (option.attributeType === 'Boolean') {
      declaration = `  ${option.name} = false;`;
    } else if (option.hasAttribute) {
      declaration = `  ${option.name}: Options['${option.optionName}'] = undefined;`;
    } else {
      declaration = `  ${option.name}?: Options['${option.optionName}'];`;
    }

    return (
      emitDocComment(optionDoc, '  ') +
      `  @property({${propertyOptions.join(', ')}})\n` +
      declaration
    );
  });
  if (extraMembers !== undefined) {
    members.push(extraMembers);
  }

  // Booleans always have a value, and the value they default to matches the
  // upstream default, so they're passed through unconditionally. Everything else
  // is only passed through once set, so that an option left alone keeps its
  // upstream default.
  const assignments = options.map((option) => {
    if (option.attributeType === 'Boolean') {
      const value = option.inverted
        ? `!this.${option.name}`
        : `this.${option.name}`;
      return `      options.${option.optionName} = ${value};`;
    }
    return (
      `      if (this.${option.name} != null) {\n` +
      `        options.${option.optionName} = this.${option.name};\n` +
      `      }`
    );
  });
  for (const [name, expression] of Object.entries(optionOverrides ?? {})) {
    assignments.push(`      options.${name} = ${expression};`);
  }

  const allOptional = options.every((option) => option.optional);
  const update = [
    `  override update(changedProperties: PropertyValues<this>) {`,
    `    if (!this.hasUpdated || changedProperties.size > 0) {`,
    allOptional
      ? `      const options: Options = {};`
      : `      const options = {} as Options;`,
    ...assignments,
    `      this.setExtensions([${exportName}(options)]);`,
    `    }`,
    `    super.update(changedProperties);`,
    `  }`,
  ].join('\n');

  return [
    emitHeader(),
    `import {${exportName}} from '${moduleSpecifier}';`,
    `import {${litImports.join(', ')}} from 'lit';`,
    `import {${decoratorImports.join(', ')}} from 'lit/decorators.js';`,
    `import {CodeMirrorExtensionElement} from './cm-extension-element.js';`,
    ...(extraImports === undefined ? [] : [extraImports]),
    ``,
    emitTagNameMap(tagName, className),
    ...(extraDeclarations === undefined ? [] : [extraDeclarations, '']),
    `/**`,
    ` * The options accepted by \`${exportName}()\`.`,
    ` */`,
    `type Options = NonNullable<Parameters<typeof ${exportName}>[0]>;`,
    ``,
    emitDocComment(doc) +
      `@customElement('${tagName}')\n` +
      `export class ${className} extends CodeMirrorExtensionElement {\n` +
      [...members, update].join('\n\n') +
      `\n}`,
    ``,
  ].join('\n');
};

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

/** Expands a manifest entry into one descriptor per element to generate. */
const expandEntry = (
  entry: ManifestEntry,
  exportSymbols: Array<ts.Symbol>,
  checker: ts.TypeChecker,
): Array<Descriptor> => {
  const exportNames = entry.autoDiscover
    ? exportSymbols
        .filter((symbol) => {
          const excluded = (entry.exclude ?? []).includes(symbol.name);
          // Themes are plain values; anything callable is a factory such as
          // `createTheme` and needs an explicit manifest entry.
          const callable = getCallSignature(symbol, checker) !== undefined;
          return !excluded && !callable;
        })
        .map((symbol) => symbol.name)
    : // A theme package often exports several themes, so `export` takes either
      // one name or a list.
      [entry.export ?? []].flat();

  return exportNames.map((exportName) => {
    const tagPrefix = entry.tagPrefix ?? 'cm-';
    const classPrefix = entry.classPrefix ?? 'CodeMirrorLang';
    const humanName = toHumanName(exportName);
    const doc =
      typeof entry.doc === 'function'
        ? entry.doc(exportName, humanName)
        : entry.doc;
    return {
      ...entry,
      exportName,
      humanName,
      moduleSpecifier: entry.module,
      tagName: entry.tagName ?? `${tagPrefix}${toKebabCase(exportName)}`,
      className: entry.className ?? `${classPrefix}${toPascalCase(exportName)}`,
      doc,
    };
  });
};

/** One generated element, for the summary and the markdown table. */
interface GeneratedElement {
  tagName: string;
  fileName: string;
  module: string;
  exportName: string;
  humanName: string;
  options: Array<string>;
}

const declarationFiles = new Map(
  manifest.map((entry) => [entry.module, resolveDeclarationFile(entry.module)]),
);
const {program, checker} = createChecker([...declarationFiles.values()]);

// The emitted source is run through the repo's Prettier config, both so that
// generated files match the hand-written ones and so that `--check` compares
// against the same formatting the `format` script would produce.
const prettierConfig = await prettier.resolveConfig(
  path.join(outDir, 'cm-editor.ts'),
);
const format = (source: string) =>
  prettier.format(source, {...prettierConfig, parser: 'typescript'});

const generated: Array<GeneratedElement> = [];
for (const entry of manifest) {
  const exportSymbols = getModuleExports(
    program,
    checker,
    declarationFiles.get(entry.module)!,
  );
  const exportsByName = new Map(
    exportSymbols.map((symbol) => [symbol.name, symbol]),
  );

  for (const descriptor of expandEntry(entry, exportSymbols, checker)) {
    const exportSymbol = exportsByName.get(descriptor.exportName);
    if (exportSymbol === undefined) {
      throw new Error(
        `${entry.module} does not export ${descriptor.exportName}`,
      );
    }
    descriptor.doc ??= getDocumentation(exportSymbol, checker);

    const options = discoverOptions(exportSymbol, checker, entry);
    // An extension with no options doesn't need reactive properties or an
    // `update()` method, so it gets the simpler constructor-only form whether
    // it's a value or a no-argument factory.
    const source = await format(
      options === undefined || options.length === 0
        ? emitValueElement({...descriptor, isFactory: options !== undefined})
        : emitFactoryElement({...descriptor, options}),
    );

    for (const option of options ?? []) {
      if (!option.optional) {
        console.warn(
          `warning: ${descriptor.tagName} option '${option.name}' is required ` +
            `by ${descriptor.exportName}(), but element properties are always ` +
            `optional. The element will not work until it is set.`,
        );
      }
    }

    const fileName = `${descriptor.tagName}.ts`;
    const filePath = path.join(outDir, fileName);
    const existing = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, 'utf8')
      : undefined;
    if (check) {
      if (existing !== source) {
        console.error(`out of date: src/lib/${fileName}`);
        process.exitCode = 1;
      }
    } else if (existing !== source) {
      fs.writeFileSync(filePath, source);
    }

    generated.push({
      tagName: descriptor.tagName,
      fileName,
      module: entry.module,
      exportName: descriptor.exportName,
      humanName: descriptor.humanName,
      // Attributes are shown in kebab-case and property-only options in
      // camelCase, so the table shows how each one is actually set.
      options: (options ?? []).map((option) =>
        option.hasAttribute ? toKebabCase(option.name) : option.name,
      ),
    });
  }
}

// An extension dropped from the manifest leaves its element behind, which would
// otherwise keep registering a tag for a dependency that may no longer be
// installed. Only files carrying the generated header are considered, so
// hand-written elements are never touched.
const generatedHeader = emitHeader().split('\n')[0]!;
const expected = new Set(generated.map((element) => element.fileName));
const orphans = fs
  .readdirSync(outDir)
  .filter((fileName) => fileName.endsWith('.ts') && !expected.has(fileName))
  .filter((fileName) =>
    fs
      .readFileSync(path.join(outDir, fileName), 'utf8')
      .startsWith(generatedHeader),
  );

for (const fileName of orphans) {
  if (check) {
    console.error(`no longer in the manifest: src/lib/${fileName}`);
    process.exitCode = 1;
  } else {
    fs.rmSync(path.join(outDir, fileName));
    console.log(`Removed src/lib/${fileName}, no longer in the manifest.`);
  }
}

console.log(
  check
    ? `Checked ${generated.length} elements.`
    : `Generated ${generated.length} elements in src/lib/.`,
);

// A markdown table, to paste into the README.
if (process.argv.includes('--markdown')) {
  console.log('\n| Element | Extension | Options |');
  console.log('| --- | --- | --- |');
  for (const element of generated) {
    const options = element.options.map((name) => `\`${name}\``).join(', ');
    // The npm page is for the package, not the subpath a theme may be imported
    // from.
    const segments = element.module.split('/');
    const packageName = element.module.startsWith('@')
      ? segments.slice(0, 2).join('/')
      : segments[0];
    console.log(
      `| \`<${element.tagName}>\` | [\`${element.exportName}\`](https://www.npmjs.com/package/${packageName}) | ${options || '—'} |`,
    );
  }
}
