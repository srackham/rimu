import * as DelimitedBlocks from "./delimitedblocks.ts";
import * as Macros from "./macros.ts";
import * as Options from "./options.ts";
import * as Spans from "./spans.ts";

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
    let i = Number(arguments[2]); // match group number.
    let result = match[i]; // match group text.
    if (result === undefined) {
      Options.errorCallback("undefined replacement group: " + arguments[0]);
      return "";
    }
    return replaceInline(result, expansionOptions);
  });
}

// Shallow object clone.
export function copy(source: any): any {
  let result: any = {};
  for (let key in source) {
    if (source.hasOwnProperty(key)) {
      result[key] = source[key];
    }
  }
  return result;
}

// Copy properties in source object to target object.
export function merge(target: any, source: any): void {
  for (let key in source) {
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

// Global Block Attributes state (namespace "singleton", see http://stackoverflow.com/a/30174360).
export namespace BlockAttributes {
  export let classes: string // Space separated HTML class names.
  ;
  export let id: string // HTML element id.
  ;
  export let css: string // HTML CSS styles.
  ;
  export let attributes: string // Other HTML element attributes.
  ;
  export let options: ExpansionOptions;

  let ids: string[] // List of allocated HTML ids.
  ;

  export function init(): void {
    classes = "";
    id = "";
    css = "";
    attributes = "";
    options = {};
    ids = [];
  }

  export function parse(match: RegExpExecArray): boolean {
    // Parse Block Attributes.
    // class names = $1, id = $2, css-properties = $3, html-attributes = $4, block-options = $5
    let text = match[0];
    text = replaceInline(text, { macros: true });
    let m =
      /^\\?\.((?:\s*[a-zA-Z][\w\-]*)+)*(?:\s*)?(#[a-zA-Z][\w\-]*\s*)?(?:\s*)?(?:"(.+?)")?(?:\s*)?(\[.+])?(?:\s*)?([+-][ \w+-]+)?$/
        .exec(text);
    if (!m) {
      return false;
    }
    if (!Options.skipBlockAttributes()) {
      if (m[1]) { // HTML element class names.
        classes += " " + m[1].trim();
        classes = classes.trim();
      }
      if (m[2]) { // HTML element id.
        id = m[2].trim().slice(1);
      }
      if (m[3]) { // CSS properties.
        if (css && css.substr(-1) !== ";") css += ";";
        css += " " + m[3].trim();
        css = css.trim();
      }
      if (m[4] && !Options.isSafeModeNz()) { // HTML attributes.
        attributes += " " + m[4].slice(1, m[4].length - 1).trim();
        attributes = attributes.trim();
      }
      DelimitedBlocks.setBlockOptions(options, m[5]);
    }
    return true;
  }

  // Inject HTML attributes from attrs into the opening tag.
  // Consume HTML attributes unless the 'tag' argument is blank.
  export function inject(tag: string, consume: boolean = true): string {
    if (!tag) {
      return tag;
    }
    let attrs = "";
    if (classes) {
      let re = /^(<[^>]*class=")(.*?)"/i;
      if (re.test(tag)) {
        // Inject class names into first existing class attribute in first tag.
        tag = tag.replace(re, `$1${classes} $2"`);
      } else {
        attrs = `class="${classes}"`;
      }
    }
    if (id) {
      id = id.toLowerCase();
      let has_id = /^<[^<]*id=".*?"/i.test(tag);
      if (has_id || ids.indexOf(id) > -1) {
        Options.errorCallback(`duplicate 'id' attribute: ${id}`);
      } else {
        ids.push(id);
      }
      if (!has_id) {
        attrs += ` id="${id}"`;
      }
    }
    if (css) {
      let re = /^(<[^>]*style=")(.*?)"/i;
      if (re.test(tag)) {
        // Inject CSS styles into first existing style attribute in first tag.
        tag = tag.replace(
          re,
          function (match: string, p1: string, p2: string): string {
            p2 = p2.trim();
            if (p2 && p2.substr(-1) !== ";") p2 += ";";
            return `${p1}${p2} ${css}"`;
          },
        );
      } else {
        attrs += ` style="${css}"`;
      }
    }
    if (attributes) {
      attrs += " " + attributes;
    }
    attrs = attrs.trim();
    if (attrs) {
      let match = tag.match(/^<([a-zA-Z]+|h[1-6])(?=[ >])/);
      if (match) {
        let before = tag.slice(0, match[0].length);
        let after = tag.slice(match[0].length);
        tag = before + " " + attrs + after;
      }
    }
    // Consume the attributes.
    if (consume) {
      classes = "";
      id = "";
      css = "";
      attributes = "";
    }
    return tag;
  }

  export function slugify(text: string): string {
    let slug = text.replace(/\W+/g, "-") // Replace non-alphanumeric characters with dashes.
      .replace(/-+/g, "-") // Replace multiple dashes with single dash.
      .replace(/(^-)|(-$)/g, "") // Trim leading and trailing dashes.
      .toLowerCase();
    if (!slug) slug = "x";
    if (ids.indexOf(slug) > -1) { // Another element already has that id.
      let i = 2;
      while (ids.indexOf(slug + "-" + i) > -1) {
        i++;
      }
      slug += "-" + i;
    }
    return slug;
  }
}
