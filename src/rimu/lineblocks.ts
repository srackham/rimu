import * as utils from './utils'
import * as options from './options'
import * as io from './io'
import * as delimitedBlocks from './delimitedblocks'
import * as quotes from './quotes'
import * as replacements from './replacements'
import * as macros from './macros'

export interface Definition {
  name?: string   // Optional unique identifier.
  filter?: (match: RegExpExecArray, reader?: io.Reader) => string
  verify?: (match: RegExpExecArray) => boolean   // Additional match verification checks.
  match: RegExp
  replacement?: string
}

let defs: Definition[] = [
  // Prefix match with backslash to allow escaping.

  // Expand lines prefixed with a macro invocation prior to all other processing.
  // macro name = $1, macro value = $2
  {
    match: macros.MACRO_LINE,
    verify: function (match: RegExpExecArray): boolean {
      // Do not process macro definitions.
      if (macros.MACRO_DEF_OPEN.test(match[0])) {
        return false
      }
      // Stop if the macro value is the same as the invocation (to stop infinite recursion).
      let value = macros.render(match[0], false)
      if (value === match[0]) {
        return false
      }
      return true
    },
    filter: function (match: RegExpExecArray, reader?: io.Reader): string {
      // Insert the macro value into the reader just ahead of the cursor.
      let value = macros.render(match[0], false)
      let spliceArgs = ([reader.pos + 1, 0]).concat(value.split('\n') as any[])
      Array.prototype.splice.apply(reader.lines, spliceArgs)
      return ''
    }
  },
  // Delimited Block definition.
  // name = $1, definition = $2
  {
    match: /^\\?\|([\w\-]+)\|\s*=\s*'(.*)'$/,
    filter: function (match: RegExpExecArray): string {
      if (options.isSafe()) {
        return ''   // Skip if a safe mode is set.
      }
      delimitedBlocks.setDefinition(match[1], match[2])
      return ''
    }
  },
  // Quote definition.
  // quote = $1, openTag = $2, separator = $3, closeTag = $4
  {
    match: /^(\S{1,2})\s*=\s*'([^\|]*)(\|{1,2})(.*)'$/,
    filter: function (match: RegExpExecArray): string {
      if (options.isSafe()) {
        return ''   // Skip if a safe mode is set.
      }
      quotes.setDefinition({
        quote: match[1],
        openTag: utils.replaceInline(match[2], {macros: true}),
        closeTag: utils.replaceInline(match[4], {macros: true}),
        spans: match[3] === '|'
      })
      return ''
    }
  },
  // Replacement definition.
  // pattern = $1, flags = $2, replacement = $3
  {
    match: /^\\?\/(.+)\/([igm]*)\s*=\s*'(.*)'$/,
    filter: function (match: RegExpExecArray): string {
      if (options.isSafe()) {
        return ''   // Skip if a safe mode is set.
      }
      let pattern = match[1]
      let flags = match[2]
      let replacement = match[3]
      replacement = utils.replaceInline(replacement, {macros: true})
      replacements.setDefinition(pattern, flags, replacement)
      return ''
    }
  },
  // Macro definition.
  // name = $1, value = $2
  {
    match: macros.MACRO_DEF,
    filter: function (match: RegExpExecArray): string {
      if (options.isSafe()) {
        return ''   // Skip if a safe mode is set.
      }
      let name = match[1]
      let value = match[2]
      value = utils.replaceInline(value, {macros: true})
      macros.setValue(name, value)
      return ''
    }
  },
  // Headers.
  // $1 is ID, $2 is header text.
  {
    match: /^\\?((?:#|=){1,6})\s+(.+?)(?:\s+(?:#|=){1,6})?$/,
    replacement: '<h$1>$$2</h$1>',
    filter: function (match: RegExpExecArray): string {
      match[1] = match[1].length.toString()  // Replace $1 with header number.
      return utils.replaceMatch(match, this.replacement, {macros: true})
    }
  },
  // Comment line.
  {
    match: /^\\?\/{2}(.*)$/,
  },
  // Block image: <image:src|alt>
  // src = $1, alt = $2
  {
    match: /^\\?<image:([^\s\|]+)\|([\s\S]+?)>$/,
    replacement: '<img src="$1" alt="$2">',
  },
  // Block image: <image:src>
  // src = $1, alt = $1
  {
    match: /^\\?<image:([^\s\|]+?)>$/,
    replacement: '<img src="$1" alt="$1">',
  },
  // DEPRECATED as of 3.4.0.
  // Block anchor: <<#id>>
  // id = $1
  {
    match: /^\\?<<#([a-zA-Z][\w\-]*)>>$/,
    replacement: '<div id="$1"></div>',
  },
  // Block Attributes.
  // Syntax: .class-names #id [html-attributes] block-options
  {
    name: 'attributes',
    match: /^\\?\.[a-zA-Z#\[+-].*$/,  // A loose match because Block Attributes can contain macro references.
    verify: function (match: RegExpExecArray): boolean {
      // Parse Block Attributes.
      // class names = $1, id = $2, html-attributes = $3, block-options = $4
      let text = match[0]
      text = utils.replaceInline(text, {macros: true})
      match = /^\\?\.((?:\s*[a-zA-Z][\w\-]*)+)*(?:\s*)?(#[a-zA-Z][\w\-]*\s*)?(?:\s*)?(\[.+\])?(?:\s*)?([+-][ \w+-]+)?$/.exec(text)
      if (!match) {
        return false
      }
      if (match[1]) { // HTML element class names.
        htmlClasses += ' ' + utils.trim(match[1])
        htmlClasses = utils.trim(htmlClasses)
      }
      if (match[2]) { // HTML element id.
        htmlAttributes += ' id="' + utils.trim(match[2]).slice(1) + '"'
      }
      if (match[3] && !options.isSafe()) { // HTML attributes.
        htmlAttributes += ' ' + utils.trim(match[3].slice(1, match[3].length - 1))
      }
      htmlAttributes = utils.trim(htmlAttributes)
      delimitedBlocks.setBlockOptions(blockOptions, match[4])
      return true
    },
  },
  // API Option.
  // name = $1, value = $2
  {
    match: /^\\?\.(\w+)\s*=\s*'(.*)'$/,
    filter: function (match: RegExpExecArray): string {
      if (!/^(safeMode|htmlReplacement|reset)$/.test(match[1])) {
        options.errorCallback('illegal API option: ' + match[1] + ': ' + match[0])
      }
      else if (!options.isSafe()) {
        let value = utils.replaceInline(match[2], {macros: true})
        options.setOption(match[1], value)
      }
      return ''
    }
  },
]

// Globals set by Block Attributes filter.
export let htmlClasses: string = ''
export let htmlAttributes: string = ''
export let blockOptions: utils.ExpansionOptions = {}

// If the next element in the reader is a valid line block render it
// and return true, else return false.
export function render(reader: io.Reader, writer: io.Writer): boolean {
  if (reader.eof()) throw 'premature eof'
  for (let def of defs) {
    let match = def.match.exec(reader.cursor())
    if (match) {
      if (match[0][0] === '\\') {
        // Drop backslash escape and continue.
        reader.cursor(reader.cursor().slice(1))
        continue
      }
      if (def.verify && !def.verify(match)) {
        continue
      }
      let text: string
      if (!def.filter) {
        text = def.replacement ? utils.replaceMatch(match, def.replacement, {macros: true}) : ''
      }
      else {
        text = def.filter(match, reader)
      }
      if (text) {
        text = utils.injectHtmlAttributes(text)
        writer.write(text)
        reader.next()
        if (!reader.eof()) {
          writer.write('\n')  // Add a trailing '\n' if there are more lines.
        }
      }
      else {
        reader.next()
      }
      return true
    }
  }
  return false
}

// Return line block definition or undefined if not found.
export function getDefinition(name: string): Definition {
  return defs.filter(def => def.name === name)[0]
}

