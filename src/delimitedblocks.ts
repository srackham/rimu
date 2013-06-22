module Rimu.DelimitedBlocks {

  export interface Definition {
    id?: string;  // Optional unique identifier.
    openMatch: RegExp;  // $1 (if defined) is prepended to block content.
    closeMatch: RegExp; // $1 (if defined) is appended to block content.
    openTag: string;
    closeTag: string;
    variables?: bool;  // Not applicable to container or skipped elements.
    filter?: (text: string, match: RegExpExecArray) => string;
    verify?: (match: string[]) => bool; // Additional match verification checks.
    // container, skip, spans and specials properties are mutually exclusive,
    // they are assumed false if they are not explicitly defined.
    container?: bool;
    skip?: bool;
    spans?: bool;
    specials?: bool;
  }
    
  var defs: Definition[] = [
    // Delimited blocks cannot be escaped with a backslash.

    // Variable assignment block.
    {
      openMatch: /^\\?\{[\w\-]+\}\s*=\s*'(.*)$/, // $1 is first line of variable.
      closeMatch: /^(.*)'$/,                  // $1 is last line of variable.
      openTag: '',
      closeTag: '',
      variables: true,
      filter: function (text, match): string {
        // Set variable.
        // Get the variable name from the match in the first line of the block.
        var name = match[0].match(/^\{([\w\-]+)\}/)[1];
        Variables.set(name, text);
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
      id: 'division',
      openMatch: /^\\?\.{2,}$/,
      closeMatch: /^\.{2,}$/,
      openTag: '<div>',
      closeTag: '</div>',
      container: true,
    },
    // Quote block.
    {
      id: 'quote',
      openMatch: /^\\?"{2,}$/,
      closeMatch: /^"{2,}$/,
      openTag: '<blockquote>',
      closeTag: '</blockquote>',
      container: true,
    },
    // Code block.
    {
      id: 'code',
      openMatch: /^\\?\-{2,}$/,
      closeMatch: /^\-{2,}$/,
      openTag: '<pre><code>',
      closeTag: '</code></pre>',
      variables: true,
      specials: true,
    },
    // HTML block.
    {
      // Must start with  an <! or a block-level element start or end tag.
      // $1 is first line of block.
      openMatch:
      /^\\?(<!.*|(?:<\/?(?:html|head|body|iframe|script|style|address|article|aside|audio|blockquote|canvas|dd|div|dl|fieldset|figcaption|figure|figcaption|footer|form|h1|h2|h3|h4|h5|h6|header|hgroup|hr|img|math|nav|noscript|ol|output|p|pre|section|table|tfoot|ul|video)(?:[ >].*)?))$/i,
      closeMatch: /^$/, // Blank line or EOF.
      openTag: '',
      closeTag: '',
      variables: true,
      filter: function (text) {
        return Options.safeModeFilter(text);
      },
    },
    // Indented paragraph.
    {
      id: 'indented',
      openMatch: /^\\?(\s+.*)$/,  // $1 is first line of block.
      closeMatch: /^$/,           // Blank line or EOF.
      openTag: '<pre>',
      closeTag: '</pre>',
      variables: true,
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
      variables: true,
      spans: true,
    },
  ];

  export function render(reader: Reader, writer: Writer): bool {
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
          text = replaceOptions(text, def);
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
  export function getDefinition(id: string): Definition {
    for (var i in defs) {
      if (defs[i].id === id) {
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
