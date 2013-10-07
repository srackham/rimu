module Rimu.DelimitedBlocks {

  export interface Definition {
    name?: string;  // Optional unique identifier.
    openMatch: RegExp;  // $1 (if defined) is prepended to block content.
    closeMatch: RegExp; // $1 (if defined) is appended to block content.
    openTag: string;
    closeTag: string;
    macros?: boolean;  // Not applicable to container or skipped elements.
    filter?: (text: string, match: string[]) => string;
    verify?: (match: string[]) => boolean; // Additional match verification checks.
    // container, skip, spans and specials properties are mutually exclusive,
    // they are assumed false if they are not explicitly defined.
    container?: boolean;
    skip?: boolean;
    spans?: boolean;
    specials?: boolean;
  }
    
  var defs: Definition[] = [
    // Delimited blocks cannot be escaped with a backslash.

    // Macro definition block.
    {
      openMatch: /^\\?\{[\w\-]+\}\s*=\s*'(.*)$/,  // $1 is first line of macro.
      closeMatch: /^(.*)'$/,                      // $1 is last line of macro.
      openTag: '',
      closeTag: '',
      macros: true,
      filter: function (text, match): string {
        // Set macro.
        // Get the macro name from the match in the first line of the block.
        var name = match[0].match(/^\{([\w\-]+)\}/)[1];
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
      closeMatch: /^\.{2,}$/,
      openTag: '<div>',
      closeTag: '</div>',
      container: true,
    },
    // Quote block.
    {
      name: 'quote',
      openMatch: /^\\?"{2,}$/,
      closeMatch: /^"{2,}$/,
      openTag: '<blockquote>',
      closeTag: '</blockquote>',
      container: true,
    },
    // Code block.
    {
      name: 'code',
      openMatch: /^\\?\-{2,}$/,
      closeMatch: /^\-{2,}$/,
      openTag: '<pre><code>',
      closeTag: '</code></pre>',
      macros: true,
      specials: true,
    },
    // HTML block.
    {
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
      openMatch: /^(.*)$/,  // $1 is first line of block.
      closeMatch: /^$/,     // Blank line or EOF.
      openTag: '<p>',
      closeTag: '</p>',
      macros: true,
      spans: true,
    },
  ];

  export function render(reader: Reader, writer: Writer): boolean {
    if (reader.eof()) throw 'premature eof';
    for (var i in defs) {
      var def = defs[i];
      var match = reader.cursor().match(def.openMatch);
      if (match) {
        // Escape non-paragraphs.
        if (match[0][0] === '\\' && parseInt(i) !== defs.length - 1) {
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
        var content = reader.readTo(def.closeMatch);
        if (content !== null) {
          lines = lines.concat(content);
        }
        // Process block.
        if (def.skip) return true;
        writer.write(injectAttributes(def.openTag));
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
