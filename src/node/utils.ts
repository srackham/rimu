// deno-lint-ignore-file no-explicit-any

import * as DelimitedBlocks from "./delimitedblocks";
import * as Macros from "./macros";
import * as Options from "./options";
import * as Spans from "./spans";

export interface ExpansionOptions {
  [key: string]: boolean | undefined;

  // Processing priority (highest to lowest): container, skip, spans and specials.
  // If spans is true then both spans and specials are processed.
  // They are assumed false if they are not explicitly defined.
  // If a custom filter is specified their use depends on the filter.
  macros?: boolean;
  container?: boolean;
  skip?: boolean;
  spans?: boolean; // Span substitution also expands special characters.
  specials?: boolean;
}

// http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
export function escapeRegExp(s: string): string {
  return s.replace(/[\-\/\\^$*+?.()|\[\]{}]/g, "\\$&");
}

export function replaceSpecialChars(s: string): string {
  return s.replace(/&/g, "&amp;")
    .replace(/>/g, "&gt;")
    .replace(/</g, "&lt;");
}

// Replace pattern '$1' or '$$1', '$2' or '$$2'... in `replacement` with corresponding match groups
// from `match`. If pattern starts with one '$' character add specials to `expansionOptions`,
// if it starts with two '$' characters add spans to `expansionOptions`.
export function replaceMatch(
  match: RegExpExecArray,
  replacement: string,
  expansionOptions: ExpansionOptions = {},
): string {
  return replacement.replace(/(\${1,2})(\d)/g, function (): string {
    // Replace $1, $2 ... with corresponding match groups.
    if (arguments[1] === "$$") {
      expansionOptions.spans = true;
    } else {
      expansionOptions.specials = true;
    }
    const i = Number(arguments[2]); // match group number.
    const result = match[i]; // match group text.
    if (result === undefined) {
      Options.errorCallback("undefined replacement group: " + arguments[0]);
      return "";
    }
    return replaceInline(result, expansionOptions);
  });
}

// Shallow object clone.
export function copy(source: any): any {
  const result: any = {};
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key];
    }
  }
  return result;
}

// Copy properties in source object to target object.
export function merge(target: any, source: any): void {
  for (const key in source) {
    target[key] = source[key];
  }
}

// Replace the inline elements specified in options in text and return the result.
export function replaceInline(
  text: string,
  expansionOptions: ExpansionOptions,
): string {
  if (expansionOptions.macros) {
    text = Macros.render(text);
  }
  // Spans also expand special characters.
  if (expansionOptions.spans) {
    text = Spans.render(text);
  } else if (expansionOptions.specials) {
    text = replaceSpecialChars(text);
  }
  return text;
}

class BlockAttributesSingleton {
  private static instance: BlockAttributesSingleton;

  public classes = ""; // Space separated HTML class names.
  public id = ""; // HTML element id.
  public css = ""; // HTML CSS styles.
  public attributes = ""; // Other HTML element attributes.
  public options: ExpansionOptions = {};
  public ids: string[] = []; // List of allocated HTML ids.

  constructor() {
    if (BlockAttributesSingleton.instance) {
      throw new Error(
        "BlockAttributesSingleton instantiation failed: use getInstance() instead of new",
      );
    }
    BlockAttributesSingleton.instance = this;
  }

  static getInstance(): BlockAttributesSingleton {
    BlockAttributesSingleton.instance = BlockAttributesSingleton.instance ||
      new BlockAttributesSingleton();
    return BlockAttributesSingleton.instance;
  }

  init(): void {
    this.classes = "";
    this.id = "";
    this.css = "";
    this.attributes = "";
    this.options = {};
    this.ids = [];
  }

  parse(match: RegExpExecArray): boolean {
    // Parse Block Attributes.
    // class names = $1, id = $2, css-properties = $3, html-attributes = $4, block-options = $5
    let text = match[0];
    text = replaceInline(text, { macros: true });
    const m =
      /^\\?\.((?:\s*[a-zA-Z][\w\-]*)+)*(?:\s*)?(#[a-zA-Z][\w\-]*\s*)?(?:\s*)?(?:"(.+?)")?(?:\s*)?(\[.+])?(?:\s*)?([+-][ \w+-]+)?$/
        .exec(text);
    if (!m) {
      return false;
    }
    if (!Options.skipBlockAttributes()) {
      if (m[1]) { // HTML element class names.
        this.classes += " " + m[1].trim();
        this.classes = this.classes.trim();
      }
      if (m[2]) { // HTML element id.
        this.id = m[2].trim().slice(1);
      }
      if (m[3]) { // CSS properties.
        if (this.css && this.css.slice(-1) !== ";") this.css += ";";
        this.css += " " + m[3].trim();
        this.css = this.css.trim();
      }
      if (m[4] && !Options.isSafeModeNz()) { // HTML attributes.
        this.attributes += " " + m[4].slice(1, m[4].length - 1).trim();
        this.attributes = this.attributes.trim();
      }
      DelimitedBlocks.setBlockOptions(this.options, m[5]);
    }
    return true;
  }

  // Inject HTML attributes from attrs into the opening tag.
  // Consume HTML attributes unless the 'tag' argument is blank.
  inject(tag: string, consume = true): string {
    if (!tag) {
      return tag;
    }
    let attrs = "";
    if (this.classes) {
      const re = /^(<[^>]*class=")(.*?)"/i;
      if (re.test(tag)) {
        // Inject class names into first existing class attribute in first tag.
        tag = tag.replace(re, `$1${this.classes} $2"`);
      } else {
        attrs = `class="${this.classes}"`;
      }
    }
    if (this.id) {
      this.id = this.id.toLowerCase();
      const hasId = /^<[^<]*id=".*?"/i.test(tag);
      if (hasId || this.ids.indexOf(this.id) > -1) {
        Options.errorCallback(`duplicate 'id' attribute: ${this.id}`);
      } else {
        this.ids.push(this.id);
      }
      if (!hasId) {
        attrs += ` id="${this.id}"`;
      }
    }
    if (this.css) {
      const re = /^(<[^>]*style=")(.*?)"/i;
      if (re.test(tag)) {
        // Inject CSS styles into first existing style attribute in first tag.
        tag = tag.replace(
          re,
          (_match: string, p1: string, p2: string): string => {
            p2 = p2.trim();
            if (p2 && p2.slice(-1) !== ";") p2 += ";";
            return `${p1}${p2} ${this.css}"`;
          },
        );
      } else {
        attrs += ` style="${this.css}"`;
      }
    }
    if (this.attributes) {
      attrs += " " + this.attributes;
    }
    attrs = attrs.trim();
    if (attrs) {
      const match = tag.match(/^<([a-zA-Z]+|h[1-6])(?=[ >])/);
      if (match) {
        const before = tag.slice(0, match[0].length);
        const after = tag.slice(match[0].length);
        tag = before + " " + attrs + after;
      }
    }
    // Consume the attributes.
    if (consume) {
      this.classes = "";
      this.id = "";
      this.css = "";
      this.attributes = "";
    }
    return tag;
  }

  slugify(text: string): string {
    let slug = text.replace(/\W+/g, "-") // Replace non-alphanumeric characters with dashes.
      .replace(/-+/g, "-") // Replace multiple dashes with single dash.
      .replace(/(^-)|(-$)/g, "") // Trim leading and trailing dashes.
      .toLowerCase();
    if (!slug) slug = "x";
    if (this.ids.indexOf(slug) > -1) { // Another element already has that id.
      let i = 2;
      while (this.ids.indexOf(slug + "-" + i) > -1) {
        i++;
      }
      slug += "-" + i;
    }
    return slug;
  }
}

export const BlockAttributes = BlockAttributesSingleton.getInstance();
