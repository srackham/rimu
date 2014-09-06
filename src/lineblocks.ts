/// <reference path="references.ts" />

module Rimu.LineBlocks {

  export interface Definition {
    name?: string;  // Optional unique identifier.
    filter?: (match: RegExpExecArray, reader?: Reader) => string;
    verify?: (match: RegExpExecArray) => boolean;  // Additional match verification checks.
    match: RegExp;
    replacement: string;
    expansionOptions: ExpansionOptions;
  }

  var defs: Definition[] = [
    // Prefix match with backslash to allow escaping.

    // Delimited Block definition.
    // name = $1, definition = $2
    {
      match: /^\\?\|([\w\-]+)\|\s*=\s*'(.*)'$/,
      replacement: '',
      expansionOptions: {},
      filter: function (match) {
        if (Options.safeMode !== 0) {
          return '';  // Skip if a safe mode is set.
        }
        DelimitedBlocks.setDefinition(match[1], match[2]);
        return '';
      }
    },
    // Quote definition.
    // quote = $1, openTag = $2, separator = $3, closeTag = $4
    {
      match: /^(\S{1,2})\s*=\s*'([^\|]*)(\|{1,2})(.*)'$/,
      replacement: '',
      expansionOptions: {
        macros: true,
      },
      filter: function (match) {
        if (Options.safeMode !== 0) {
          return '';  // Skip if a safe mode is set.
        }
        Quotes.setDefinition({quote: match[1],
          openTag: replaceInline(match[2], this.expansionOptions),
          closeTag: replaceInline(match[4], this.expansionOptions),
          spans: match[3] === '|'});
        return '';
      }
    },
    // Replacement definition.
    // pattern = $1, flags = $2, replacement = $3
    {
      match: /^\\?\/(.+)\/([igm]*)\s*=\s*'(.*)'$/,
      replacement: '',
      expansionOptions: {
        macros: true,
      },
      filter: function (match) {
        if (Options.safeMode !== 0) {
          return '';  // Skip if a safe mode is set.
        }
        var pattern = match[1];
        var flags = match[2];
        var replacement = match[3];
        replacement = replaceInline(replacement, this.expansionOptions);
        Replacements.setDefinition(pattern, flags, replacement);
        return '';
      }
    },
    // Macro definition.
    // name = $1, value = $2
    {
      match: Macros.MACRO_DEF,
      replacement: '',
      expansionOptions: {
        macros: true,
      },
      filter: function (match) {
        if (Options.safeMode !== 0) {
          return '';  // Skip if a safe mode is set.
        }
        var name = match[1];
        var value = match[2];
        value = replaceInline(value, this.expansionOptions);
        Macros.setValue(name, value);
        return '';
      }
    },
    // Macro Line block.
    {
      match: Macros.MACRO_LINE,
      replacement: '',
      expansionOptions: {},
      verify: function (match) {
        return !Macros.MACRO_DEF_OPEN.test(match[0]); // Don't match macro definition blocks.
      },
      filter: function (match, reader?) {
        var value = Macros.render(match[0]);
        // Insert the macro value into the reader just ahead of the cursor.
        var spliceArgs = (<any[]> [reader.pos + 1, 0]).concat(value.split('\n'));
        Array.prototype.splice.apply(reader.lines, spliceArgs);
        return '';
      }
    },
    // Headers.
    // $1 is ID, $2 is header text.
    {
      match: /^\\?((?:#|=){1,6})\s+(.+?)(?:\s+(?:#|=){1,6})?$/,
      replacement: '<h$1>$2</h$1>',
      expansionOptions: {
        macros: true,
        spans: true,
      },
      filter: function (match) {
        match[1] = match[1].length.toString(); // Replace $1 with header number.
        return replaceMatch(match, this.replacement, this.expansionOptions);
      }
    },
    // Comment line.
    {
      match: /^\\?\/{2}(.*)$/,
      replacement: '',
      expansionOptions: {}
    },
    // Block image: <image:src|alt>
    // src = $1, alt = $2
    {
      match: /^\\?<image:([^\s\|]+)\|([\s\S]+?)>$/,
      replacement: '<img src="$1" alt="$2">',
      expansionOptions: {
        macros: true,
        specials: true,
      }
    },
    // Block image: <image:src>
    // src = $1, alt = $1
    {
      match: /^\\?<image:([^\s\|]+?)>$/,
      replacement: '<img src="$1" alt="$1">',
      expansionOptions: {
        macros: true,
        specials: true,
      }
    },
    // Block anchor: <<#id>>
    // id = $1
    {
      match: /^\\?<<#([a-zA-Z][\w\-]*)>>$/,
      replacement: '<div id="$1"></div>',
      expansionOptions: {
        macros: true,
        specials: true,
      }
    },
    // Block Attributes.
    // Syntax: .class-names #id [html-attributes] block-options
    {
      name: 'attributes',
      match: /^\\?\.[a-zA-Z#\[+-].*$/,  // A loose match because Block Attributes can contain macro references.
      replacement: '',
      expansionOptions: {
        macros: true,
      },
      verify: function (match) {
        // Parse Block Attributes.
        // class names = $1, id = $2, html-attributes = $3, block-options = $4
        var text = match[0];
        text = replaceInline(text, this.expansionOptions); // Expand macro references.
        match = /^\\?\.([a-zA-Z][\w\ -]*)?(#[a-zA-Z][\w\-]*\s*)?(?:\s*)?(\[.+\])?(?:\s*)?([+-][ \w+-]+)?$/.exec(text);
        if (!match) {
          return false;
        }
        if (match[1]) { // HTML element class names.
          htmlClasses += ' ' + trim(match[1]);
          htmlClasses = trim(htmlClasses);
        }
        if (match[2]) { // HTML element id.
          htmlAttributes += ' id="' + trim(match[2]).slice(1) + '"';
        }
        if (match[3] && Options.safeMode === 0) { // HTML attributes.
          htmlAttributes += ' ' + trim(match[3].slice(1, match[3].length - 1));
        }
        htmlAttributes = trim(htmlAttributes);
        DelimitedBlocks.setBlockOptions(blockOptions, match[4]);
        return true;
      },
      filter: function (match) {
        return '';
      }
    },
  ];

  // Globals set by Block Attributes filter.
  export var htmlClasses: string = '';
  export var htmlAttributes: string = '';
  export var blockOptions: ExpansionOptions = {};

  // If the next element in the reader is a valid line block render it
  // and return true, else return false.
  export function render(reader: Reader, writer: Writer): boolean {
    if (reader.eof()) throw 'premature eof';
    for (var i in defs) {
      var def = defs[i];
      var match = def.match.exec(reader.cursor());
      if (match) {
        if (match[0][0] === '\\') {
          // Drop backslash escape and continue.
          reader.cursor(reader.cursor().slice(1));
          continue;
        }
        if (def.verify && !def.verify(match)) {
          continue;
        }
        var text: string;
        if (!def.filter) {
          text = replaceMatch(match, def.replacement, def.expansionOptions);
        }
        else {
          text = def.filter(match, reader);
        }
        text = injectHtmlAttributes(text);
        writer.write(text);
        reader.next();
        if (text && !reader.eof()) {
          writer.write('\n'); // Add a trailing '\n' if there are more lines.
        }
        return true;
      }
    }
    return false;
  }

  // Return def definition or null if not found.
  export function getDefinition(name: string): Definition {
    for (var i in defs) {
      if (defs[i].name === name) {
        return defs[i];
      }
    }
    return null;
  }

}

// Exposed for unit tests.
Rimu.exportCommonjs({LineBlocks: Rimu.LineBlocks});
