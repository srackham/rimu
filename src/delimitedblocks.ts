/// <reference path="references.ts" />

module Rimu.DelimitedBlocks {

  // Multi-line block element definition.
  export interface Definition {
    name?: string;       // Optional unique identifier.
    openMatch: RegExp;   // $1 (if defined) is prepended to block content.
    closeMatch?: RegExp; // $1 (if defined) is appended to block content. If closeMatch is undefined then it must match opening delimiter.
    openTag: string;
    closeTag: string;
    filter?: (text: string, match?: string[], expansionOptions?: ExpansionOptions) => string;
    verify?: (match: string[]) => boolean;  // Additional match verification checks.
    expansionOptions: ExpansionOptions;
  }

  var defs: Definition[] = [
    // Delimited blocks cannot be escaped with a backslash.

    // Macro definition block.
    {
      openMatch: Macros.MACRO_DEF_OPEN,    // $1 is first line of macro.
      closeMatch: Macros.MACRO_DEF_CLOSE,  // $1 is last line of macro.
      openTag: '',
      closeTag: '',
      expansionOptions: {
        macros: true
      },
      filter: function (text: string, match: string[], expansionOptions: ExpansionOptions): string {
        // Set macro.
        // Get the macro name from the match in the first line of the block.
        var name = match[0].match(/^\{([\w\-]+)\}/)[1];
        text = text.replace(/' *\\\n/g, '\'\n');        // Unescape line-continuations.
        text = text.replace(/(' *[\\]+)\\\n/g, '$1\n'); // Unescape escaped line-continuations.
        text = replaceInline(text, expansionOptions);   // Expand macro invocations.
        Macros.setValue(name, text);
        return '';
      }
    },
    // Comment block.
    {
      name: 'comment',
      openMatch: /^\\?\/\*+$/,
      closeMatch: /^\*+\/$/,
      openTag: '',
      closeTag: '',
      expansionOptions: {
        skip: true,
        specials: true // Fall-back if skip is disabled.
      }
    },
    // Division block.
    {
      name: 'division',
      openMatch: /^\\?\.{2,}$/,
      openTag: '<div>',
      closeTag: '</div>',
      expansionOptions: {
        container: true,
        specials: true // Fall-back if container is disabled.
      }
    },
    // Quote block.
    {
      name: 'quote',
      openMatch: /^\\?"{2,}$/,
      openTag: '<blockquote>',
      closeTag: '</blockquote>',
      expansionOptions: {
        container: true,
        specials: true // Fall-back if container is disabled.
      }
    },
    // Code block.
    {
      name: 'code',
      openMatch: /^\\?(?:\-{2,}|`{2,})$/,
      openTag: '<pre><code>',
      closeTag: '</code></pre>',
      expansionOptions: {
        macros: false,
        specials: true
      }
    },
    // HTML block.
    {
      name: 'html',
      // Must start with  an <! or a block-level element start or end tag.
      // $1 is first line of block.
      /* tslint:disable:max-line-length */
      openMatch: /^(<!.*|(?:<\/?(?:html|head|body|iframe|script|style|address|article|aside|audio|blockquote|canvas|dd|div|dl|fieldset|figcaption|figure|figcaption|footer|form|h1|h2|h3|h4|h5|h6|header|hgroup|hr|img|math|nav|noscript|ol|output|p|pre|section|table|tfoot|td|th|tr|ul|video)(?:[ >].*)?))$/i,
      /* tslint:enable:max-line-length */
      closeMatch: /^$/, // Blank line or EOF.
      openTag: '',
      closeTag: '',
      expansionOptions: {
        macros: true
      },
      filter: function (text: string): string {
        return Options.safeModeFilter(text);
      }
    },
    // Indented paragraph.
    {
      name: 'indented',
      openMatch: /^\\?(\s+.*)$/,  // $1 is first line of block.
      closeMatch: /^$/,           // Blank line or EOF.
      openTag: '<pre><code>',
      closeTag: '</code></pre>',
      expansionOptions: {
        macros: false,
        specials: true
      },
      filter: function (text: string): string {
        // Strip indent from start of each line.
        var first_indent = text.search(/\S/);
        var buffer = text.split('\n');
        for (var i in buffer) {
          // Strip first line indent width or up to first non-space character.
          var indent = buffer[i].search(/\S/);
          if (indent > first_indent) indent = first_indent;
          buffer[i] = buffer[i].slice(indent);
        }
        return buffer.join('\n');
      }
    },
    // Paragraph (lowest priority, cannot be escaped).
    {
      name: 'paragraph',
      openMatch: /^(.*)$/,  // $1 is first line of block.
      closeMatch: /^$/,     // Blank line or EOF.
      openTag: '<p>',
      closeTag: '</p>',
      expansionOptions: {
        macros: true,
        spans: true,
        specials: true       // Fall-back if spans is disabled.
      }
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
        if (def.closeMatch === undefined) {
          // Close delimiter matches opening delimiter.
          closeMatch = RegExp('^' + escapeRegExp(match[0]) + '$');
        }
        else {
          closeMatch = def.closeMatch;
        }
        var content = reader.readTo(closeMatch);
        if (content !== null) {
          lines = lines.concat(content);
        }
        // Set block expansion options.
        var expansionOptions: ExpansionOptions;
        expansionOptions = {macros: false, spans: false, specials: false, container: false, skip: false};
        var k: string;
        for (k in expansionOptions) expansionOptions[k] = def.expansionOptions[k];
        for (k in LineBlocks.blockOptions) expansionOptions[k] = LineBlocks.blockOptions[k];
        // Process block.
        if (!expansionOptions.skip) {
          var text = lines.join('\n');
          if (def.filter) {
            text = def.filter(text, match, expansionOptions);
          }
          writer.write(injectHtmlAttributes(def.openTag));
          if (expansionOptions.container) {
            text = Rimu.renderSource(text);
          }
          else {
            text = replaceInline(text, expansionOptions);
          }
          writer.write(text);
          writer.write(def.closeTag);
          if ((def.openTag || text || def.closeTag) && !reader.eof()) {
            // Add a trailing '\n' if we've written a non-blank line and there are more source lines left.
            writer.write('\n');
          }
        }
        // Reset consumed Block Attributes expansion options.
        LineBlocks.blockOptions = {};
        return true;
      }
    }
    return false; // No matching delimited block found.
  }

  // Return block definition or null if not found.
  export function getDefinition(name: string): Definition {
    for (var i in defs) {
      if (defs[i].name === name) {
        return defs[i];
      }
    }
    return null;
  }

  // Parse delimited block expansion options string into blockOptions.
  export function setBlockOptions(blockOptions: ExpansionOptions, options: string): void {
    if (options) {
      var opts = options.trim().split(/\s+/);
      for (var i in opts) {
        var opt = opts[i];
        if (Options.safeMode !== 0 && opt === '-specials') {
          return;
        }
        if (/^[+-](macros|spans|specials|container|skip)$/.test(opt)) {
          blockOptions[opt.slice(1)] = opt[0] === '+';
        }
      }
    }
  }

  // Update existing named definition.
  // Value syntax: <open-tag>|<close-tag> block-options
  export function setDefinition(name: string, value: string): void {
    var def = DelimitedBlocks.getDefinition(name);
    var match = trim(value).match(/^(?:(<[a-zA-Z].*>)\|(<[a-zA-Z/].*>))?(?:\s*)?([+-][ \w+-]+)?$/);
    if (match) {
      if (match[1]) {
        def.openTag = match[1];
        def.closeTag = match[2];
      }
      setBlockOptions(def.expansionOptions, match[3]);
    }
  }

}

