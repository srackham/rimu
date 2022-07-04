import * as Api from "./api.ts";
import { BlockAttributes } from "./blockattributes.ts";
import * as Io from "./io.ts";
import * as Macros from "./macros.ts";
import * as Options from "./options.ts";
import * as Utils from "./utils.ts";

/* tslint:disable:max-line-length */
const MATCH_INLINE_TAG =
  /^(a|abbr|acronym|address|b|bdi|bdo|big|blockquote|br|cite|code|del|dfn|em|i|img|ins|kbd|mark|q|s|samp|small|span|strike|strong|sub|sup|time|tt|u|var|wbr)$/i;
/* tslint:enable:max-line-length */

// Multi-line block element definition.
export interface Definition {
  name: string; // Unique identifier.
  openMatch: RegExp;
  closeMatch?: RegExp; // $1 (if defined) is appended to block content.
  openTag: string;
  closeTag: string;
  verify?: (match: RegExpMatchArray) => boolean; // Additional match verification checks.
  delimiterFilter?: (match: string[]) => string; // Process opening delimiter. Return any delimiter content.
  contentFilter?: (
    text: string,
    match: string[],
    expansionOptions: Utils.ExpansionOptions,
  ) => string;
  expansionOptions: Utils.ExpansionOptions;
}

export let defs: Definition[] // Mutable definitions initialized by DEFAULT_DEFS.
;

const DEFAULT_DEFS: Definition[] = [
  // Delimited blocks cannot be escaped with a backslash.

  // Multi-line macro literal value definition.
  {
    name: "macro-definition",
    openMatch: Macros.LITERAL_DEF_OPEN, // $1 is first line of macro.
    closeMatch: Macros.LITERAL_DEF_CLOSE,
    openTag: "",
    closeTag: "",
    expansionOptions: {
      macros: true,
    },
    delimiterFilter: delimiterFilter1,
    contentFilter: macroDefContentFilter,
  },
  // Multi-line macro expression value definition.
  // DEPRECATED as of 11.0.0.
  {
    name: "deprecated-macro-expression",
    openMatch: Macros.EXPRESSION_DEF_OPEN, // $1 is first line of macro.
    closeMatch: Macros.EXPRESSION_DEF_CLOSE,
    openTag: "",
    closeTag: "",
    expansionOptions: {
      macros: true,
    },
    delimiterFilter: delimiterFilter1,
    contentFilter: macroDefContentFilter,
  },
  // Comment block.
  {
    name: "comment",
    openMatch: /^\\?\/\*+$/,
    closeMatch: /^\*+\/$/,
    openTag: "",
    closeTag: "",
    expansionOptions: {
      skip: true,
      specials: true, // Fall-back if skip is disabled.
    },
  },
  // Division block.
  {
    name: "division",
    openMatch: /^\\?(\.{2,})([\w\s-]*)$/, // $1 is delimiter text, $2 is optional class names.
    openTag: "<div>",
    closeTag: "</div>",
    expansionOptions: {
      container: true,
      specials: true, // Fall-back if container is disabled.
    },
    delimiterFilter: delimiterFilter2,
  },
  // Quote block.
  {
    name: "quote",
    openMatch: /^\\?("{2,})([\w\s-]*)$/, // $1 is delimiter text, $2 is optional class names.
    openTag: "<blockquote>",
    closeTag: "</blockquote>",
    expansionOptions: {
      container: true,
      specials: true, // Fall-back if container is disabled.
    },
    delimiterFilter: delimiterFilter2,
  },
  // Code block.
  {
    name: "code",
    openMatch: /^\\?(-{2,}|`{2,})([\w\s-]*)$/, // $1 is delimiter text, $2 is optional class names.
    openTag: "<pre><code>",
    closeTag: "</code></pre>",
    expansionOptions: {
      macros: false,
      specials: true,
    },
    verify: function (match: RegExpMatchArray): boolean {
      // The deprecated '-' delimiter does not support appended class names.
      return !(match[1][0] === "-" && match[2].trim() !== "");
    },
    delimiterFilter: delimiterFilter2,
  },
  // HTML block.
  {
    name: "html",
    // Block starts with HTML comment, DOCTYPE directive or block-level HTML start or end tag.
    // $1 is first line of block.
    // $2 is the alphanumeric tag name.
    openMatch:
      /^(<!--.*|<!DOCTYPE(?:\s.*)?|<\/?([a-z][a-z0-9]*)(?:[\s>].*)?)$/i,
    closeMatch: /^$/,
    openTag: "",
    closeTag: "",
    expansionOptions: {
      macros: true,
    },
    verify: function (match: RegExpMatchArray): boolean {
      // Return false if the HTML tag is an inline (non-block) HTML tag.
      if (match[2]) { // Matched alphanumeric tag name.
        return !MATCH_INLINE_TAG.test(match[2]);
      } else {
        return true; // Matched HTML comment or doctype tag.
      }
    },
    delimiterFilter: delimiterFilter1,
    contentFilter: Options.htmlSafeModeFilter,
  },
  // Indented paragraph.
  {
    name: "indented",
    openMatch: /^\\?(\s+\S.*)$/, // $1 is first line of block.
    closeMatch: /^$/,
    openTag: "<pre><code>",
    closeTag: "</code></pre>",
    expansionOptions: {
      macros: false,
      specials: true,
    },
    delimiterFilter: delimiterFilter1,
    contentFilter: function (text: string): string {
      // Strip indent from start of each line.
      const firstIndent = text.search(/\S/);
      return text.split("\n")
        .map((line) => {
          // Strip first line indent width or up to first non-space character.
          let indent = line.search(/\S|$/);
          if (indent > firstIndent) indent = firstIndent;
          return line.slice(indent);
        })
        .join("\n");
    },
  },
  // Quote paragraph.
  {
    name: "quote-paragraph",
    openMatch: /^\\?(>[^>].*)$/, // $1 is first line of block.
    closeMatch: /^$/,
    openTag: "<blockquote><p>",
    closeTag: "</p></blockquote>",
    expansionOptions: {
      macros: true,
      spans: true,
      specials: true, // Fall-back if spans is disabled.
    },
    delimiterFilter: delimiterFilter1,
    contentFilter: function (text: string): string {
      // Strip leading > from start of each line and unescape escaped leading >.
      return text.split("\n")
        .map((line) =>
          line
            .replace(/^>/, "")
            .replace(/^\\>/, ">")
        )
        .join("\n");
    },
  },
  // Paragraph (lowest priority, cannot be escaped).
  {
    name: "paragraph",
    openMatch: /(.*)/, // $1 is first line of block.
    closeMatch: /^$/,
    openTag: "<p>",
    closeTag: "</p>",
    expansionOptions: {
      macros: true,
      spans: true,
      specials: true, // Fall-back if spans is disabled.
    },
    delimiterFilter: delimiterFilter1,
  },
];

// Reset definitions to defaults.
export function init(): void {
  defs = DEFAULT_DEFS.map((def) => Utils.copy(def));
  // Copy definition object fields.
  defs.forEach((def, i) =>
    def.expansionOptions = Utils.copy(DEFAULT_DEFS[i].expansionOptions)
  );
}

// If the next element in the reader is a valid delimited block render it
// and return true, else return false.
export function render(
  reader: Io.Reader,
  writer: Io.Writer,
  allowed: string[] = [],
): boolean {
  if (reader.eof()) Options.panic("premature eof");
  for (const def of defs) {
    if (
      allowed.length > 0 && allowed.indexOf(def.name) === -1
    ) {
      continue;
    }
    const match = reader.cursor.match(def.openMatch);
    if (match) {
      // Escape non-paragraphs.
      if (match[0][0] === "\\" && def.name !== "paragraph") {
        // Drop backslash escape and continue.
        reader.cursor = reader.cursor.slice(1);
        continue;
      }
      if (def.verify && !def.verify(match)) {
        continue;
      }
      // Process opening delimiter.
      const delimiterText = def.delimiterFilter
        ? def.delimiterFilter(match)
        : "";
      // Read block content into lines.
      let lines: string[] = [];
      if (delimiterText) {
        lines.push(delimiterText);
      }
      // Read content up to the closing delimiter.
      reader.next();
      const content = reader.readTo(def.closeMatch as RegExp);
      if (
        reader.eof() &&
        ["code", "comment", "division", "quote"].indexOf(def.name) > -1
      ) {
        Options.errorCallback(
          `unterminated ${def.name} block: ${match[0]}`,
        );
      }
      lines = [...lines, ...content];
      reader.next(); // Skip closing delimiter.
      // Calculate block expansion options.
      const expansionOptions: Utils.ExpansionOptions = {
        macros: false,
        spans: false,
        specials: false,
        container: false,
        skip: false,
      };
      Utils.merge(expansionOptions, def.expansionOptions);
      Utils.merge(expansionOptions, BlockAttributes.options);
      // Translate block.
      if (!expansionOptions.skip) {
        let text = lines.join("\n");
        if (def.contentFilter) {
          text = def.contentFilter(text, match, expansionOptions);
        }
        let opentag = def.openTag;
        if (def.name === "html") {
          text = BlockAttributes.inject(text);
        } else {
          opentag = BlockAttributes.inject(opentag);
        }
        if (expansionOptions.container) {
          delete BlockAttributes.options.container; // Consume before recursion.
          text = Api.render(text);
        } else {
          text = Utils.replaceInline(text, expansionOptions);
        }
        let closetag = def.closeTag;
        if (def.name === "division" && opentag === "<div>") {
          // Drop div tags if the opening div has no attributes.
          opentag = "";
          closetag = "";
        }
        writer.write(opentag);
        writer.write(text);
        writer.write(closetag);
        if ((opentag || text || closetag) && !reader.eof()) {
          // Add a trailing '\n' if we've written a non-blank line and there are more source lines left.
          writer.write("\n");
        }
      }
      // Reset consumed Block Attributes expansion options.
      BlockAttributes.options = {};
      return true;
    }
  }
  return false; // No matching delimited block found.
}

// Return block definition or undefined if not found.
export function getDefinition(name: string): Definition {
  return defs.filter((def) => def.name === name)[0];
}

// Parse block-options string into blockOptions.
export function setBlockOptions(
  blockOptions: Utils.ExpansionOptions,
  optionsString: string,
): void {
  if (optionsString) {
    const opts = optionsString.trim().split(/\s+/);
    for (const opt of opts) {
      if (Options.isSafeModeNz() && opt === "-specials") {
        Options.errorCallback("-specials block option not valid in safeMode");
        continue;
      }
      if (/^[+-](macros|spans|specials|container|skip)$/.test(opt)) {
        blockOptions[opt.slice(1)] = opt[0] === "+";
      } else {
        Options.errorCallback("illegal block option: " + opt);
      }
    }
  }
}

// Update existing named definition.
// Value syntax: <open-tag>|<close-tag> block-options
export function setDefinition(name: string, value: string): void {
  const def = getDefinition(name);
  if (!def) {
    Options.errorCallback(
      "illegal delimited block name: " + name + ": |" + name + "|='" + value +
        "'",
    );
    return;
  }
  const match = value.trim().match(
    /^(?:(<[a-zA-Z].*>)\|(<[a-zA-Z/].*>))?(?:\s*)?([+-][ \w+-]+)?$/,
  );
  if (match === null) {
    Options.errorCallback(
      "illegal delimited block definition: |" + name + "|='" + value + "'",
    );
    return;
  }
  if (match[1]) {
    def.openTag = match[1];
    def.closeTag = match[2];
  }
  if (match[3]) {
    setBlockOptions(def.expansionOptions, match[3]);
  }
}

// delimiterFilter that returns opening delimiter line text from match group $1.
function delimiterFilter1(match: string[]): string {
  return match[1];
}

// delimiterFilter for code, division and quote blocks.
function delimiterFilter2(this: Definition, match: string[]): string {
  if (match[2]) {
    // Inject $2 into block class attribute.
    let p1: string;
    if ((p1 = match[2].trim())) {
      BlockAttributes.classes = p1;
    }
  }
  // Set close delimiter to $1.
  this.closeMatch = RegExp("^" + Utils.escapeRegExp(match[1]) + "$");
  return "";
}

// contentFilter for multi-line macro definitions.
function macroDefContentFilter(
  text: string,
  match: string[],
  expansionOptions: Utils.ExpansionOptions,
): string {
  const quote = match[0][match[0].length - match[1].length - 1]; // The leading macro value quote character.
  const name = (match[0].match(/^{([\w\-]+\??)}/) as RegExpMatchArray)[1]; // Extract macro name from opening delimiter.
  text = text.replace(RegExp("(" + quote + ") *\\\\\\n", "g"), "$1\n"); // Unescape line-continuations.
  text = text.replace(RegExp("(" + quote + " *[\\\\]+)\\\\\\n", "g"), "$1\n"); // Unescape escaped line-continuations.
  text = Utils.replaceInline(text, expansionOptions); // Expand macro invocations.
  Macros.setValue(name, text, quote);
  return "";
}
