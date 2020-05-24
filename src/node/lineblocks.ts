import * as DelimitedBlocks from "./delimitedblocks";
import * as Io from "./io";
import * as Macros from "./macros";
import * as Options from "./options";
import * as Quotes from "./quotes";
import * as Replacements from "./replacements";
import * as Utils from "./utils";
import { BlockAttributes } from "./utils";

export interface Definition {
  match: RegExp;
  replacement?: string;
  name?: string; // Optional unique identifier.
  verify?: (match: RegExpExecArray, reader: Io.Reader) => boolean; // Additional match verification checks.
  filter?: (match: RegExpExecArray, reader: Io.Reader) => string;
}

let defs: Definition[] = [
  // Prefix match with backslash to allow escaping.

  // Comment line.
  {
    match: /^\\?\/{2}(.*)$/,
  },
  // Expand lines prefixed with a macro invocation prior to all other processing.
  // macro name = $1, macro value = $2
  {
    match: Macros.MATCH_LINE,
    verify: function (match: RegExpExecArray, reader: Io.Reader): boolean {
      if (
        Macros.LITERAL_DEF_OPEN.test(match[0]) ||
        Macros.EXPRESSION_DEF_OPEN.test(match[0])
      ) {
        // Do not process macro definitions.
        return false;
      }
      // Silent because any macro expansion errors will be subsequently addressed downstream.
      let value = Macros.render(match[0], true);
      if (
        value.substr(0, match[0].length) === match[0] ||
        value.indexOf("\n" + match[0]) >= 0
      ) {
        // The leading macro invocation expansion failed or contains itself.
        // This stops infinite recursion.
        return false;
      }
      // Insert the macro value into the reader just ahead of the cursor.
      let spliceArgs: [number, number, ...any[]] = [
        reader.pos + 1,
        0,
        ...value.split("\n"),
      ];
      Array.prototype.splice.apply(reader.lines, spliceArgs);
      return true;
    },
    filter: function (match: RegExpExecArray, reader: Io.Reader): string {
      return ""; // Already processed in the `verify` function.
    },
  },
  // Delimited Block definition.
  // name = $1, definition = $2
  {
    match: /^\\?\|([\w\-]+)\|\s*=\s*'(.*)'$/,
    filter: function (match: RegExpExecArray): string {
      if (Options.isSafeModeNz()) {
        return ""; // Skip if a safe mode is set.
      }
      match[2] = Utils.replaceInline(match[2], { macros: true });
      DelimitedBlocks.setDefinition(match[1], match[2]);
      return "";
    },
  },
  // Quote definition.
  // quote = $1, openTag = $2, separator = $3, closeTag = $4
  {
    match: /^(\S{1,2})\s*=\s*'([^|]*)(\|{1,2})(.*)'$/,
    filter: function (match: RegExpExecArray): string {
      if (Options.isSafeModeNz()) {
        return ""; // Skip if a safe mode is set.
      }
      Quotes.setDefinition({
        quote: match[1],
        openTag: Utils.replaceInline(match[2], { macros: true }),
        closeTag: Utils.replaceInline(match[4], { macros: true }),
        spans: match[3] === "|",
      });
      return "";
    },
  },
  // Replacement definition.
  // pattern = $1, flags = $2, replacement = $3
  {
    match: /^\\?\/(.+)\/([igm]*)\s*=\s*'(.*)'$/,
    filter: function (match: RegExpExecArray): string {
      if (Options.isSafeModeNz()) {
        return ""; // Skip if a safe mode is set.
      }
      let pattern = match[1];
      let flags = match[2];
      let replacement = match[3];
      replacement = Utils.replaceInline(replacement, { macros: true });
      Replacements.setDefinition(pattern, flags, replacement);
      return "";
    },
  },
  // Macro definition.
  // name = $1, value = $2
  {
    match: Macros.LINE_DEF,
    filter: function (match: RegExpExecArray): string {
      let name = match[1];
      let quote = match[2];
      let value = match[3];
      value = Utils.replaceInline(value, { macros: true });
      Macros.setValue(name, value, quote);
      return "";
    },
  },
  // Headers.
  // $1 is ID, $2 is header text.
  {
    match: /^\\?([#=]{1,6})\s+(.+?)(?:\s+\1)?$/,
    replacement: "<h$1>$$2</h$1>",
    filter: function (match: RegExpExecArray): string {
      match[1] = match[1].length.toString(); // Replace $1 with header number.
      if (Macros.getValue("--header-ids") && BlockAttributes.id === "") {
        BlockAttributes.id = BlockAttributes.slugify(match[2]);
      }
      return Utils.replaceMatch(
        match,
        this.replacement as string,
        { macros: true },
      );
    },
  },
  // Block image: <image:src|alt>
  // src = $1, alt = $2
  {
    match: /^\\?<image:([^\s|]+)\|([^]+?)>$/,
    replacement: '<img src="$1" alt="$2">',
  },
  // Block image: <image:src>
  // src = $1, alt = $1
  {
    match: /^\\?<image:([^\s|]+?)>$/,
    replacement: '<img src="$1" alt="$1">',
  },
  // DEPRECATED as of 3.4.0.
  // Block anchor: <<#id>>
  // id = $1
  {
    match: /^\\?<<#([a-zA-Z][\w\-]*)>>$/,
    replacement: '<div id="$1"></div>',
    filter: function (match: RegExpExecArray, reader?: Io.Reader): string {
      if (Options.skipBlockAttributes()) {
        return "";
      } else {
        // Default (non-filter) replacement processing.
        return Utils.replaceMatch(
          match,
          this.replacement as string,
          { macros: true },
        );
      }
    },
  },
  // Block Attributes.
  // Syntax: .class-names #id [html-attributes] block-options
  {
    name: "attributes",
    match: /^\\?\.[a-zA-Z#"\[+-].*$/, // A loose match because Block Attributes can contain macro references.
    verify: function (match: RegExpExecArray): boolean {
      return BlockAttributes.parse(match);
    },
  },
  // API Option.
  // name = $1, value = $2
  {
    match: /^\\?\.(\w+)\s*=\s*'(.*)'$/,
    filter: function (match: RegExpExecArray): string {
      if (!Options.isSafeModeNz()) {
        let value = Utils.replaceInline(match[2], { macros: true });
        Options.setOption(match[1], value);
      }
      return "";
    },
  },
];

// If the next element in the reader is a valid line block render it
// and return true, else return false.
export function render(
  reader: Io.Reader,
  writer: Io.Writer,
  allowed: string[] = [],
): boolean {
  if (reader.eof()) Options.panic("premature eof");
  for (let def of defs) {
    if (
      allowed.length > 0 && allowed.indexOf(def.name ? def.name : "") === -1
    ) {
      continue;
    }
    let match = def.match.exec(reader.cursor);
    if (match) {
      if (match[0][0] === "\\") {
        // Drop backslash escape and continue.
        reader.cursor = reader.cursor.slice(1);
        continue;
      }
      if (def.verify && !def.verify(match, reader)) {
        continue;
      }
      let text: string;
      if (!def.filter) {
        text = def.replacement
          ? Utils.replaceMatch(match, def.replacement, { macros: true })
          : "";
      } else {
        text = def.filter(match, reader);
      }
      if (text) {
        text = BlockAttributes.inject(text);
        writer.write(text);
        reader.next();
        if (!reader.eof()) {
          writer.write("\n"); // Add a trailing '\n' if there are more lines.
        }
      } else {
        reader.next();
      }
      return true;
    }
  }
  return false;
}
