module Rimu.Quotes {

  export interface Definition {
    quote: string;    // Single quote character.
    openTag: string;
    closeTag: string;
    spans: bool;      // Allow span elements inside quotes.
    verify?: (match: RegExpExecArray, re: RegExp) => bool; // Additional match verification checks.
  }
    
  var defs: Definition[] = [
    {
      quote: '_',
      openTag: '<em>',
      closeTag: '</em>',
      spans: true,
    },
    {
      quote: '*',
      openTag: '<strong>',
      closeTag: '</strong>',
      spans: true,
    },
    {
      quote: '`',
      openTag: '<code>',
      closeTag: '</code>',
      spans: false,
    },
  ];

  export var findRe: RegExp;  // Searches for quoted text.
  var unescapeRe: RegExp;     // Searches for escaped quotes.

  // Synthesise re's to find and unescape quotes.
  var s: string[] = [];
  for (var i in defs) {
    s.push(escapeRegExp(defs[i].quote));
  }
  // $1 is quote character, $2 is quoted text.
  // Quoted text cannot begin or end with whitespace.
  // Quoted can span multiple lines.
  // Quoted text cannot end with a backslash.
  findRe = RegExp('\\\\?(' + s.join('|') + ')([^\\s\\\\]|\\S[\\s\\S]*?[^\\s\\\\])\\1', 'g');
  // $1 is quote character.
  unescapeRe = RegExp('\\\\(' + s.join('|') + ')', 'g');

  // Return the quote definition corresponding to 'quote' character.
  export function find(quote: string): Definition {
    for (var i in defs) {
      if (defs[i].quote === quote) return defs[i];
    }
  }

  // Strip backslashes from quote characters.
  export function unescape(s: string): string {
    return s.replace(unescapeRe, '$1');
  }


}
