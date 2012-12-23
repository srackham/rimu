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
    {
      quote: '~',
      openTag: '<sub>',
      closeTag: '</sub>',
      spans: true,
    },
    {
      quote: '^',
      openTag: '<sup>',
      closeTag: '</sup>',
      spans: true,
    },
    {
      quote: '#',
      openTag: '<mark>',
      closeTag: '</mark>',
      spans: true,
      verify: function(match, re) {
        // Heuristic to suppress '#' quoting across anchors and links.
        // Skip if = is preceded by a < character and followed by an alpha
        // character.
        var precedingChar = match.input[match.index - 1] || '';
        var followingChar = match.input[re.lastIndex] || '';
        return !(/</.test(precedingChar) && /[a-zA-Z]/.test(followingChar));
      },
    },
    {
      quote: '=',
      openTag: '<del>',
      closeTag: '</del>',
      spans: true,
      verify: function(match, re) {
        // Heuristic to suppress '=' quoting across HTML attribute assignments.
        // Skip if = is preceded by an alpha character and followed by a "
        // character.
        var precedingChar = match.input[match.index - 1] || '';
        var followingChar = match.input[re.lastIndex] || '';
        return !(/[a-zA-Z]/.test(precedingChar) && /"/.test(followingChar));
      },
    },
    {
      quote: '+',
      openTag: '<ins>',
      closeTag: '</ins>',
      spans: true,
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

  // Strip backslashs from quote characters.
  export function unescape(s: string): string {
    return s.replace(unescapeRe, '$1');
  }


}
