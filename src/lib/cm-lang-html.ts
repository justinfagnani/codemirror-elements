import {html, type TagSpec} from '@codemirror/lang-html';
import type {Parser} from '@lezer/common';
import {type PropertyValues} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {CodeMirrorExtensionElement} from './cm-extension-element.js';

declare global {
  interface HTMLElementTagNameMap {
    'cm-lang-html': CodeMirrorLangHTML;
  }
}

@customElement('cm-lang-html')
export class CodeMirrorLangHTML extends CodeMirrorExtensionElement {
  /**
   * By default, the syntax tree will highlight mismatched closing
   * tags. Set this to `true` to turn that off (for example when you
   * expect to only be parsing a fragment of HTML text, not a full
   * document).
   */
  @property({type: Boolean})
  noMatchClosingTags = false;

  @property({type: Boolean})
  selfClosingTags = false;

  /**
   * Determines whether [`autoCloseTags`](https://codemirror.net/6/docs/ref/#lang-html.autoCloseTags)
   * is included in the support extensions. Defaults to false.
   */
  @property({type: Boolean})
  noAutoCloseTags = false;

  /**
   * Add additional tags that can be completed.
   */
  @property({type: Object, attribute: 'extra-tags'})
  extraTags?: Record<string, TagSpec>;

  /**
   * Add additional completable attributes to all tags.
   */
  @property({type: Object, attribute: 'extra-global-attributes'})
  extraGlobalAttributes?: Record<string, null | readonly string[]>;

  /**
   * Register additional languages to parse the content of specific
   * tags. If given, `attrs` should be a function that, given an
   * object representing the tag's attributes, returns `true` if this
   * language applies.
   */
  @property({attribute: false})
  nestedLanguages?: NestedLang[];

  /**
   * Register additional languages to parse attribute values with.
   */
  @property({attribute: false})
  nestedAttributes?: NestedAttr[];

  override update(changedProperties: PropertyValues<this>) {
    if (changedProperties.size > 0) {
      this.setExtensions([
        html({
          matchClosingTags: !this.noMatchClosingTags,
          selfClosingTags: this.selfClosingTags,
          autoCloseTags: !this.noAutoCloseTags,
          extraTags: this.extraTags,
          extraGlobalAttributes: this.extraGlobalAttributes,
          nestedLanguages: this.nestedLanguages,
          nestedAttributes: this.nestedAttributes,
        }),
      ]);
    }
    super.update(changedProperties);
  }
}

export type NestedLang = {
  tag: string;
  attrs?: (attrs: {[attr: string]: string}) => boolean;
  parser: Parser;
};

export type NestedAttr = {
  name: string;
  tagName?: string;
  parser: Parser;
};
