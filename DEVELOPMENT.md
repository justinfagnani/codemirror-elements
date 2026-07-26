# Developing codemirror-elements

Notes for working on the package itself. Nothing here is needed to _use_ it —
see the [README](README.md) for that.

## Getting started

```bash
npm install
npm run build
npm test
```

The build is driven by [wireit](https://github.com/google/wireit), so scripts
declare what they depend on and only rerun when their inputs change. `npm test`
builds first; so does `npm run start:demo`.

| Script                 | What it does                                               |
| ---------------------- | ---------------------------------------------------------- |
| `npm run build`        | Compiles `src/` with `tsconfig.json`                       |
| `npm test`             | Runs the browser tests in Chromium with `@web/test-runner` |
| `npm run start:demo`   | Serves the repo on <http://localhost:8123/demo/>           |
| `npm run generate`     | Regenerates the extension elements (see below)             |
| `npm run format`       | Formats everything with Prettier                           |
| `npm run format:check` | Fails if anything is unformatted                           |

## Project layout

Everything is written in `src/` and compiled out beside it, so the compiled
output of `src/lib` is `lib/`, of `src/demo` is `demo/`, and so on. Only `lib/`
and `index.js` are published — see the `files` field in `package.json`.

| Source         | Output     |                                             |
| -------------- | ---------- | ------------------------------------------- |
| `src/lib/`     | `lib/`     | The elements. Most are generated.           |
| `src/demo/`    | `demo/`    | The demo's scripts, landing beside its HTML |
| `src/scripts/` | `scripts/` | The element generator                       |
| `src/test/`    | `test/`    | Browser tests                               |

There are two tsconfigs:

- [`tsconfig.json`](tsconfig.json) builds the library, the demo, and the tests.
  They're all browser code, so they share it.
- [`tsconfig.scripts.json`](tsconfig.scripts.json) builds `src/scripts`, which
  runs in Node and needs the Node typings. `src/scripts` is excluded from the
  main build so that none of it reaches the published package.

The compiled output is gitignored. The demo is the one place where source and
output share a directory: `demo/*.html` is source, `demo/*.js` is built from
`src/demo/`.

## Generating extension elements

Most of the elements aren't written by hand. `npm run generate` reads the
TypeScript declarations of each wrapped package with the TypeScript compiler
API, discovers the options of each extension from the type of its config
parameter, and writes an element to `src/lib/`:

- A plain `Extension` value, like most themes, becomes an element that applies
  the extension from its constructor.
- A function returning an `Extension`, like most languages, has each property of
  its config parameter turned into a reactive property. Boolean, string, and
  number options also get a reflecting attribute; options with richer types are
  property-only, unless the manifest opts them into a JSON attribute with
  `jsonAttributes`. JSDoc comments come along from the upstream declarations.

TypeScript declarations don't record default values, but a boolean option's
default decides whether it's exposed directly or inverted, so the generator
reads it from the option's doc comment (`"Defaults to true"`,
`"Set this to false to disable"`, and friends). Guessing wrong would silently
flip the option, so an option whose documentation is inconclusive is a hard
error, fixed by declaring it in the manifest:

```ts
{module: '@codemirror/lang-xml', export: 'xml', booleanDefaults: {autoCloseTags: true}}
```

To wrap a new extension, add it to the dependencies and add an entry to
[`src/scripts/extension-manifest.ts`](src/scripts/extension-manifest.ts):

```ts
{module: '@codemirror/lang-python', export: 'python'}
```

A whole collection can be wrapped at once with `autoDiscover`, which is how the
thememirror themes are generated:

```ts
{
  module: 'thememirror',
  autoDiscover: true,
  exclude: ['createTheme'],
  tagPrefix: 'cm-theme-',
  classPrefix: 'CodeMirrorTheme',
}
```

Then run:

```bash
npm run generate
```

Generated files are committed and formatted with the repo's Prettier config, so
regenerating produces no diff unless something upstream changed.
`npm run generate -- --check` fails if any generated file is out of date, and
`npm run generate -- --markdown` prints the tables in the README.

The generator refuses to emit an option whose name would shadow a DOM member
(`<cm-lang-xml>`'s `attributes` becomes `attributeSpecs` this way), and options
that deserve a friendlier declarative API than their type implies can be
replaced by hand-written members from the manifest — see the `lang-sql` entry,
which turns an `SQLDialect` instance into a `dialect` name.

Generated files can be edited by hand, but a regeneration overwrites them.
Dropping an extension from the manifest deletes its element, so a tag is never
left registered for a dependency that's no longer installed.

The generator uses the project's own `tsconfig.json` to read declarations, so
what it can see matches what `tsc` will accept in the code it writes. Under a
laxer `moduleResolution` it can discover exports that the project can't actually
import — some packages re-export from extensionless relative paths, which
`nodenext` rejects — and would emit elements that don't compile.

## Running the demo

```bash
npm run start:demo
```

Then open <http://localhost:8123/demo/>. It's served by
[Zipadee](https://github.com/justinfagnani/zipadee)'s `@zipadee/dev-server`,
which resolves the bare module specifiers in the built output to paths under
`/node_modules/`, so the demo can use plain `<script type="module">` with no
bundling.
