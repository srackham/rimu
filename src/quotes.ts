/// <reference path="references.ts" />

module Rimu.Quotes {

  export interface Definition {
    quote: string;    // Single quote character.
    openTag: string;
    closeTag: string;
    spans: boolean;      // Allow span elements inside quotes.
    verify?: (match: RegExpExecArray, re: RegExp) => boolean; // Additional match verification checks.
  }

  export var defs: Definition[] = [
    {
      quote: '_',
      openTag: '<em>',
      closeTag: '</em>',
      spans: true
    },
    {
      quote: '**',
      openTag: '<strong>',
      closeTag: '</strong>',
      spans: true
    },
    {
      quote: '*',
      openTag: '<strong>',
      closeTag: '</strong>',
      spans: true
    },
    {
      quote: '`',
      openTag: '<code>',
      closeTag: '</code>',
      spans: false
    },
  ];

  export var findRe: RegExp;  // Searches for quoted text.
  var unescapeRe: RegExp;     // Searches for escaped quotes.

  initialize();

  // Synthesise re's to find and unescape quotes.
  function initialize(): void {
    var s: string[] = [];
    for (var i in defs) {
      s.push(escapeRegExp(defs[i].quote));
    }
    // $1 is quote character, $2 is quoted text.
    // Quoted text cannot begin or end with whitespace.
    // Quoted can span multiple lines.
    // Quoted text cannot end with a backslash.
    findRe = RegExp('\\\\?(' + s.join('|') + ')([^\\s\\\\]|\\S[\\s\\S]*?[^\\s\\\\])\\1', 'g');
    // $1 is quote character(s).
    unescapeRe = RegExp('\\\\(' + s.join('|') + ')', 'g');
  }

  // Return the quote definition corresponding to 'quote' character, return null if not found.
  export function getDefinition(quote: string): Definition {
    for (var i in defs) {
      if (defs[i].quote === quote) return defs[i];
    }
    return null;
  }

  // Strip backslashes from quote characters.
  export function unescape(s: string): string {
    return s.replace(unescapeRe, '$1');
  }

  // Update existing or add new quote definition.
  export function setDefinition(def: Definition): void {
    for (var i in defs) {
      if (defs[i].quote === def.quote) {
        // Update existing definition.
        defs[i].openTag = def.openTag;
        defs[i].closeTag = def.closeTag;
        defs[i].spans = def.spans;
        return;
      }
    }
    // Double-quote definitions are prepended to the array so they are matched
    // before single-quote definitions (which are appended to the array).
    if (def.quote.length === 2) {
      defs.unshift(def);
    } else {
      defs.push(def);
    }
    initialize();
  }

}

