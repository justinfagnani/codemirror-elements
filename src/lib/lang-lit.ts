import {cssLanguage} from '@codemirror/lang-css';
import {htmlLanguage} from '@codemirror/lang-html';
import {javascriptLanguage, jsxLanguage} from '@codemirror/lang-javascript';
import {xmlLanguage} from '@codemirror/lang-xml';
import {LanguageSupport, LRLanguage} from '@codemirror/language';
import {type Input, parseMixed, type SyntaxNodeRef} from '@lezer/common';
import type {LRParser} from '@lezer/lr';

const parsers: Record<string, LRParser> = {
  html: htmlLanguage.parser,
  css: cssLanguage.parser,
  svg: xmlLanguage.parser,
  mathml: xmlLanguage.parser,
};

const litParseWrapper = parseMixed((node: SyntaxNodeRef, input: Input) => {
  const isTaggedTemplate = node.type.name === 'TaggedTemplateExpression';
  if (isTaggedTemplate === false) {
    return null;
  }

  const tag = node.node.getChild('VariableName');
  if (tag === null) {
    return null;
  }

  const tagName = input.read(tag.from, tag.to);
  const parser = parsers[tagName];
  console.log('tagName', tagName, parser);
  if (parser === undefined) {
    return null;
  }

  const content = node.node.getChild('TemplateString');
  if (content !== null) {
    return {
      from: content.from,
      to: content.to,
      parser: htmlLanguage.parser,
      delims: {open: '${', close: '}'},
    };
  }
  return null;
});

export const litLanguage = LRLanguage.define({
  name: 'lit',
  parser: javascriptLanguage.parser.configure({
    wrap: litParseWrapper,
  }),
  languageData: javascriptLanguage.data.of({}),
});

export const litJsxLanguage = LRLanguage.define({
  name: 'lit-jsx',
  parser: jsxLanguage.parser.configure({
    wrap: litParseWrapper,
  }),
  languageData: jsxLanguage.data.of({}),
});

export const litTypeScriptLanguage = LRLanguage.define({
  name: 'lit-typescript',
  parser: javascriptLanguage.parser.configure({
    dialect: 'ts',
    wrap: litParseWrapper,
  }),
  languageData: javascriptLanguage.data.of({}),
});

export const litTsxLanguage = LRLanguage.define({
  name: 'lit-tsx',
  parser: jsxLanguage.parser.configure({
    dialect: 'tsx',
    wrap: litParseWrapper,
  }),
  languageData: jsxLanguage.data.of({}),
});

/**
 * Language support for Lit, which builds on JavaScript/TypeScript and adds
 * support for HTML, CSS, SVG, and MathML tagged template literals.
 */
export const lit = (config: {jsx?: boolean; typescript?: boolean} = {}) => {
  const lang = config.jsx
    ? config.typescript
      ? litTsxLanguage
      : litJsxLanguage
    : config.typescript
      ? litTypeScriptLanguage
      : litLanguage;
  return new LanguageSupport(lang, [
    lang.extension,
    htmlLanguage.extension,
    cssLanguage.extension,
    xmlLanguage.extension,
  ]);
};
