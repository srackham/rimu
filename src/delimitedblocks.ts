import * as api from './api'
import * as utils from './utils'
import * as options from './options'
import * as io from './io'
import * as macros from './macros'
import * as lineBlocks from './lineblocks'

// Multi-line block element definition.
export interface Definition {
  name?: string        // Optional unique identifier.
  openMatch: RegExp
  closeMatch?: RegExp  // $1 (if defined) is appended to block content.
  openTag: string
  closeTag: string
  delimiterFilter?: (match: string[]) => string   // Process opening delimiter. Return any delimiter content.
  contentfilter?: (text: string, match?: string[], expansionOptions?: utils.ExpansionOptions) => string
  expansionOptions: utils.ExpansionOptions
}

let defs: Definition[]  // Mutable definitions initialized by DEFAULT_DEFS.

const DEFAULT_DEFS: Definition[] = [
  // Delimited blocks cannot be escaped with a backslash.

  // Macro definition block.
  {
    openMatch: macros.MACRO_DEF_OPEN,    // $1 is first line of macro.
    closeMatch: macros.MACRO_DEF_CLOSE,  // $1 is last line of macro.
    openTag: '',
    closeTag: '',
    expansionOptions: {
      macros: true
    },
    delimiterFilter: delimiterTextFilter,
    contentfilter: function (text, match, expansionOptions): string {
      // Process macro definition.
      let name = match[0].match(/^\{([\w\-]+)\}/)[1]  // Get the macro name from opening delimiter.
      text = text.replace(/' *\\\n/g, '\'\n')         // Unescape line-continuations.
      text = text.replace(/(' *[\\]+)\\\n/g, '$1\n')  // Unescape escaped line-continuations.
      text = utils.replaceInline(text, expansionOptions)    // Expand macro invocations.
      macros.setValue(name, text)
      return ''
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
    openMatch: /^\\?(\.{2,})([\w\s-]*)$/, // $1 is delimiter text, $2 is optional class names.
    openTag: '<div>',
    closeTag: '</div>',
    expansionOptions: {
      container: true,
      specials: true // Fall-back if container is disabled.
    },
    delimiterFilter: classInjectionFilter
  },
  // Quote block.
  {
    name: 'quote',
    openMatch: /^\\?("{2,})([\w\s-]*)$/, // $1 is delimiter text, $2 is optional class names.
    openTag: '<blockquote>',
    closeTag: '</blockquote>',
    expansionOptions: {
      container: true,
      specials: true // Fall-back if container is disabled.
    },
    delimiterFilter: classInjectionFilter
  },
  // Code block.
  {
    name: 'code',
    // Backtick hex literal \x60 to work arount eslint problem.
    // See https://github.com/palantir/tslint/issues/357.
    openMatch: /^\\?(\-{2,}|\x60{2,})([\w\s-]*)$/, // $1 is delimiter text, $2 is optional class names.
    openTag: '<pre><code>',
    closeTag: '</code></pre>',
    expansionOptions: {
      macros: false,
      specials: true
    },
    delimiterFilter: classInjectionFilter
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
    delimiterFilter: delimiterTextFilter,
    contentfilter: options.safeModeFilter
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
    delimiterFilter: delimiterTextFilter,
    contentfilter: function (text: string): string {
      // Strip indent from start of each line.
      let first_indent = text.search(/\S/)
      let buffer = text.split('\n')
      for (let i in buffer) {
        // Strip first line indent width or up to first non-space character.
        let indent = buffer[i].search(/\S/)
        if (indent > first_indent) indent = first_indent
        buffer[i] = buffer[i].slice(indent)
      }
      return buffer.join('\n')
    }
  },
  // Quote paragraph.
  {
    name: 'quote-paragraph',
    openMatch: /^\\?(>.*)$/,      // $1 is first line of block.
    closeMatch: /^$/,             // Blank line or EOF.
    openTag: '<blockquote><p>',
    closeTag: '</p></blockquote>',
    expansionOptions: {
      macros: true,
      spans: true,
      specials: true       // Fall-back if spans is disabled.
    },
    delimiterFilter: delimiterTextFilter,
    contentfilter: function (text: string): string {
      // Strip leading > from start of each line and unescape escaped leading >.
      let buffer = text.split('\n')
      for (let i in buffer) {
        buffer[i] = buffer[i].replace(/^>/, '')
        buffer[i] = buffer[i].replace(/^\\>/, '>')
      }
      return buffer.join('\n')
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
    },
    delimiterFilter: delimiterTextFilter
  },
]

// Reset definitions to defaults.
export function reset(): void {
  defs = DEFAULT_DEFS.map(def => utils.copy(def))
}

// If the next element in the reader is a valid delimited block render it
// and return true, else return false.
export function render(reader: io.Reader, writer: io.Writer): boolean {
  if (reader.eof()) throw 'premature eof'
  for (let def of defs) {
    let match = reader.cursor().match(def.openMatch)
    if (match) {
      // Escape non-paragraphs.
      if (match[0][0] === '\\' && def.name !== 'paragraph') {
        // Drop backslash escape and continue.
        reader.cursor(reader.cursor().slice(1))
        continue
      }
      // Process opening delimiter.
      let delimiterText = def.delimiterFilter ? def.delimiterFilter(match) : ''
      // Read block content into lines.
      let lines: string[] = []
      if (delimiterText) {
        lines.push(delimiterText)
      }
      // Read content up to the closing delimiter.
      reader.next()
      let content = reader.readTo(def.closeMatch)
      if (content) {
        lines = lines.concat(content)
      }
      // Calculate block expansion options.
      let expansionOptions: utils.ExpansionOptions = {
        macros: false,
        spans: false,
        specials: false,
        container: false,
        skip: false
      }
      utils.merge(expansionOptions, def.expansionOptions)
      utils.merge(expansionOptions, lineBlocks.blockOptions)
      // Translate block.
      if (!expansionOptions.skip) {
        let text = lines.join('\n')
        if (def.contentfilter) {
          text = def.contentfilter(text, match, expansionOptions)
        }
        writer.write(utils.injectHtmlAttributes(def.openTag))
        if (expansionOptions.container) {
          delete lineBlocks.blockOptions.container  // Consume before recursion.
          text = api.render(text)
        }
        else {
          text = utils.replaceInline(text, expansionOptions)
        }
        writer.write(text)
        writer.write(def.closeTag)
        if ((def.openTag || text || def.closeTag) && !reader.eof()) {
          // Add a trailing '\n' if we've written a non-blank line and there are more source lines left.
          writer.write('\n')
        }
      }
      // Reset consumed Block Attributes expansion options.
      lineBlocks.blockOptions = {}
      return true
    }
  }
  return false  // No matching delimited block found.
}

// Return block definition or undefined if not found.
export function getDefinition(name: string): Definition {
  return defs.filter(def => def.name === name)[0]
}

// Parse block-options string into blockOptions.
export function setBlockOptions(blockOptions: utils.ExpansionOptions, optionsString: string): void {
  if (optionsString) {
    let opts = optionsString.trim().split(/\s+/)
    for (let opt of opts) {
      if (options.isSafe() && opt === '-specials') {
        return
      }
      if (/^[+-](macros|spans|specials|container|skip)$/.test(opt)) {
        blockOptions[opt.slice(1)] = opt[0] === '+'
      }
    }
  }
}

// Update existing named definition.
// Value syntax: <open-tag>|<close-tag> block-options
export function setDefinition(name: string, value: string): void {
  let def = getDefinition(name)
  let match = utils.trim(value).match(/^(?:(<[a-zA-Z].*>)\|(<[a-zA-Z/].*>))?(?:\s*)?([+-][ \w+-]+)?$/)
  if (match) {
    if (match[1]) {
      def.openTag = match[1]
      def.closeTag = match[2]
    }
    setBlockOptions(def.expansionOptions, match[3])
  }
}

// delimiterFilter that returns opening delimiter line text from match group $1.
function delimiterTextFilter(match: string[]): string {
  return match[1]
}

// delimiterFilter for code, division and quote blocks.
// Inject $2 into block class attribute, set close delimiter to $1.
function classInjectionFilter(match: string[]): string {
  if (match[2]) {
    let p1: string
    if ((p1 = utils.trim(match[2]))) {
      lineBlocks.htmlClasses = p1
    }
  }
  this.closeMatch = RegExp('^' + utils.escapeRegExp(match[1]) + '$')
  return ''
}

