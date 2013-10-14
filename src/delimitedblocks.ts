module Rimu.DelimitedBlocks {

  export interface Definition {
    name?: string;      // Optional unique identifier.
    openMatch: RegExp;  // $1 (if defined) is prepended to block content.
    closeMatch: RegExp; // $1 (if defined) is appended to block content. If null then must match opening delimiter.
    openTag: string;
    closeTag: string;
    filter?: (text: string, match: string[]) => string;
    verify?: (match: string[]) => boolean; // Additional match verification checks.
    macros?: boolean;  // Not applicable to container or skipped elements.
    // container, skip, spans and specials properties are mutually exclusive,
    // they are assumed false if they are not explicitly defined.
    container?: boolean;
    skip?: boolean;
    spans?: boolean;  // Span substitution also expands special characters.
    specials?: boolean;
  }

  var defs: Definition[] = [
    // Delimited blocks cannot be escaped with a backslash.

    // Macro definition block.
    {
      openMatch: Macros.MACRO_DEF_OPEN,    // $1 is first line of macro.
      closeMatch: Macros.MACRO_DEF_CLOSE,  // $1 is last line of macro.
      openTag: '',
      closeTag: '',
      macros: true,
      filter: function (text, match): string {
        // Set macro.
        // Get the macro name from the match in the first line of the block.
        var name = match[0].match(/^\{([\w\-]+)\}/)[1];
        text = text.replace(/'\s*\\\n/g, "'\n");  // Drop line continuations.
        text = replaceInline(text, this);         // Expand macro invocations.
        Macros.setValue(name, text);
        return '';
      },
    },
    // Comment block.
    {
      openMatch: /^\\?\/\*+$/,
      closeMatch: /^\*+\/$/,
      openTag: '',
      closeTag: '',
      skip: true,
    },
    // Division block.
    {
      name: 'division',
      openMatch: /^\\?\.{2,}$/,
      closeMatch: null,
      openTag: '<div>',
      closeTag: '</div>',
      container: true,
    },
    // Quote block.
    {
      name: 'quote',
      openMatch: /^\\?"{2,}$/,
      closeMatch: null,
      openTag: '<blockquote>',
      closeTag: '</blockquote>',
      container: true,
    },
    // Code block.
    {
      name: 'code',
      openMatch: /^\\?\-{2,}$/,
      closeMatch: null,
      openTag: '<pre><code>',
      closeTag: '</code></pre>',
      macros: true,
      specials: true,
    },
    // HTML block.
    {
      name: 'html',
      // Must start with  an <! or a block-level element start or end tag.
      // $1 is first line of block.
      openMatch:
      /^(<!.*|(?:<\/?(?:html|head|body|iframe|script|style|address|article|aside|audio|blockquote|canvas|dd|div|dl|fieldset|figcaption|figure|figcaption|footer|form|h1|h2|h3|h4|h5|h6|header|hgroup|hr|img|math|nav|noscript|ol|output|p|pre|section|table|tfoot|td|th|tr|ul|video)(?:[ >].*)?))$/i,
      closeMatch: /^$/, // Blank line or EOF.
      openTag: '',
      closeTag: '',
      macros: true,
      filter: function (text) {
        return Options.safeModeFilter(text);
      },
    },
    // Indented paragraph.
    {
      name: 'indented',
      openMatch: /^\\?(\s+.*)$/,  // $1 is first line of block.
      closeMatch: /^$/,           // Blank line or EOF.
      openTag: '<pre>',
      closeTag: '</pre>',
      macros: true,
      specials: true,
      filter: function (text): string {
        // Strip indent from start of each line.
        var first_indent = text.search(/\S/);
        var buffer = text.split('\n');
        for (var i in buffer) {
          // Strip first line indent width or up to first non-space character.
          var indent = buffer[i].search(/\S/);
          if (indent > first_indent) indent =  first_indent;
          buffer[i] = buffer[i].slice(indent);
        }
        return buffer.join('\n');
      },
    },
    // Paragraph (lowest priority, cannot be escaped).
    {
      name: 'paragraph',
      openMatch: /^(.*)$/,  // $1 is first line of block.
      closeMatch: /^$/,     // Blank line or EOF.
      openTag: '<p>',
      closeTag: '</p>',
      macros: true,
      spans: true,
    },
  ];

  // If the next element in the reader is a valid delimited block render it
  // and return true, else return false.
  export function render(reader: Reader, writer: Writer): boolean {
    if (reader.eof()) throw 'premature eof';
    for (var i in defs) {
      var def = defs[i];
      var match = reader.cursor().match(def.openMatch);
      if (match) {
        // Escape non-paragraphs.
        if (match[0][0] === '\\' && def.name !== 'paragraph') {
          // Drop backslash escape and continue.
          reader.cursor(reader.cursor().slice(1));
          continue;
        }
        if (def.verify && !def.verify(match)) {
          continue;
        }
        var lines: string[] = [];
        // Prepend delimiter text.
        if (match.length > 1) {
          lines.push(match[1]);   // $1
        }
        // Read content up to the closing delimiter.
        reader.next();
        var closeMatch: RegExp;
        if (def.closeMatch === null) {  // Close delimiter must match opening delimiter.
          closeMatch = RegExp('^' + escapeRegExp(match[0]) + '$');
        }
        else {
          closeMatch = def.closeMatch;
        }
        var content = reader.readTo(closeMatch);
        if (content !== null) {
          lines = lines.concat(content);
        }
        if (def.skip) {
          break;
        }
        // Load block expansion options.
        var saveMacrosProperty = def.macros;
        if (['code','html','indented','paragraph'].indexOf(def.name) !== -1) {
          if ('macros' in LineBlocks.blockOptions) {
            def.macros = LineBlocks.blockOptions.macros;
          }
        }
        // Process block.
        writer.write(injectHtmlAttributes(def.openTag));
        var text = lines.join('\n');
        if (def.filter) {
          text = def.filter(text, match);
        }
        if (def.container) {
          text = Rimu.renderSource(text);
        }
        else {
          text = replaceInline(text, def);
        }
        writer.write(text);
        writer.write(def.closeTag);
        if (text && !reader.eof()) {
          writer.write('\n'); // Add a trailing '\n' if there are more lines.
        }
        // Restore block expansion options to default state.
        if (saveMacrosProperty !== undefined) {
          def.macros = saveMacrosProperty;
        }
        LineBlocks.blockOptions = {};

        return true;
      }
    }
    return false;
  }

  // Return block definition or null if not found.
  export function getDefinition(name: string): Definition {
    for (var i in defs) {
      if (defs[i].name === name) {
        return defs[i]
      }
    }
    return null;
  }

  // CommonJS module exports.
  declare var exports: any;
  if (typeof exports !== 'undefined') {
    exports.DelimitedBlocks = Rimu.DelimitedBlocks;
  }

}
