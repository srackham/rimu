/* tslint:disable */
import * as utils from './utils'
///* tslint:enable */

export interface Definition {
  quote: string     // Single quote character.
  openTag: string
  closeTag: string
  spans: boolean       // Allow span elements inside quotes.
  verify?: (match: RegExpExecArray, re: RegExp) => boolean  // Additional match verification checks.
}

let defs: Definition[]  // Mutable definitions initialized by DEFAULT_DEFS.

const DEFAULT_DEFS: Definition[] = [
  {
    quote: '**',
    openTag: '<strong>',
    closeTag: '</strong>',
    spans: true
  },
  {
    quote: '*',
    openTag: '<em>',
    closeTag: '</em>',
    spans: true
  },
  {
    quote: '__',
    openTag: '<strong>',
    closeTag: '</strong>',
    spans: true
  },
  {
    quote: '_',
    openTag: '<em>',
    closeTag: '</em>',
    spans: true
  },
  {
    quote: '``',
    openTag: '<code>',
    closeTag: '</code>',
    spans: false
  },
  {
    quote: '`',
    openTag: '<code>',
    closeTag: '</code>',
    spans: false
  },
  {
    quote: '~~',
    openTag: '<del>',
    closeTag: '</del>',
    spans: true
  },
]

export var findRe: RegExp   // Searches for quoted text.
var unescapeRe: RegExp      // Searches for escaped quotes.

// Reset definitions to defaults.
export function reset(): void {
  defs = []
  for (let def of DEFAULT_DEFS) {
    defs.push(utils.copy(def))
  }
  initializeRegExps()
}

// Synthesise re's to find and unescape quotes.
export function initializeRegExps(): void {
  var s: string[] = []
  for (let def of defs) {
    s.push(utils.escapeRegExp(def.quote))
  }
  // $1 is quote character, $2 is quoted text.
  // Quoted text cannot begin or end with whitespace.
  // Quoted can span multiple lines.
  // Quoted text cannot end with a backslash.
  findRe = RegExp('\\\\?(' + s.join('|') + ')([^\\s\\\\]|\\S[\\s\\S]*?[^\\s\\\\])\\1', 'g')
  // $1 is quote character(s).
  unescapeRe = RegExp('\\\\(' + s.join('|') + ')', 'g')
}

// Return the quote definition corresponding to 'quote' character, return null if not found.
export function getDefinition(quote: string): Definition {
  for (let def of defs) {
    if (def.quote === quote) return def
  }
  return null
}

// Strip backslashes from quote characters.
export function unescape(s: string): string {
  return s.replace(unescapeRe, '$1')
}

// Update existing or add new quote definition.
export function setDefinition(def: Definition): void {
  for (var i in defs) {
    if (defs[i].quote === def.quote) {
      // Update existing definition.
      defs[i].openTag = def.openTag
      defs[i].closeTag = def.closeTag
      defs[i].spans = def.spans
      return
    }
  }
  // Double-quote definitions are prepended to the array so they are matched
  // before single-quote definitions (which are appended to the array).
  if (def.quote.length === 2) {
    defs.unshift(def)
  } else {
    defs.push(def)
  }
  initializeRegExps()
}

