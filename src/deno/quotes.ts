import * as Utils from "./utils.ts";

export interface Definition {
  quote: string; // Single quote character.
  openTag: string;
  closeTag: string;
  spans: boolean; // Allow span elements inside quotes.
}

let defs: Definition[] // Mutable definitions initialized by DEFAULT_DEFS.
;

const DEFAULT_DEFS: Definition[] = [
  {
    quote: "**",
    openTag: "<strong>",
    closeTag: "</strong>",
    spans: true
  },
  {
    quote: "*",
    openTag: "<em>",
    closeTag: "</em>",
    spans: true
  },
  {
    quote: "__",
    openTag: "<strong>",
    closeTag: "</strong>",
    spans: true
  },
  {
    quote: "_",
    openTag: "<em>",
    closeTag: "</em>",
    spans: true
  },
  {
    quote: "``",
    openTag: "<code>",
    closeTag: "</code>",
    spans: false
  },
  {
    quote: "`",
    openTag: "<code>",
    closeTag: "</code>",
    spans: false
  },
  {
    quote: "~~",
    openTag: "<del>",
    closeTag: "</del>",
    spans: true
  }
];

export let quotesRe: RegExp // Searches for quoted text.
;
let unescapeRe: RegExp // Searches for escaped quotes.
;

// Reset definitions to defaults.
export function init(): void {
  defs = DEFAULT_DEFS.map(def => Utils.copy(def));
  initializeRegExps();
}

// Synthesise re's to find and unescape quotes.
export function initializeRegExps(): void {
  let quotes = defs.map(def => Utils.escapeRegExp(def.quote));
  // $1 is quote character(s), $2 is quoted text.
  // Quoted text cannot begin or end with whitespace.
  // Quoted can span multiple lines.
  // Quoted text cannot end with a backslash.
  quotesRe = RegExp(
    "\\\\?(" + quotes.join("|") + ")([^\\s\\\\]|\\S[\\s\\S]*?[^\\s\\\\])\\1",
    "g"
  );
  // $1 is quote character(s).
  unescapeRe = RegExp("\\\\(" + quotes.join("|") + ")", "g");
}

// Return the quote definition corresponding to 'quote' character, return undefined if not found.
export function getDefinition(quote: string): Definition {
  return defs.filter(def => def.quote === quote)[0];
}

// Strip backslashes from quote characters.
export function unescape(s: string): string {
  return s.replace(unescapeRe, "$1");
}

// Update existing or add new quote definition.
export function setDefinition(def: Definition): void {
  for (let d of defs) {
    if (d.quote === def.quote) {
      // Update existing definition.
      d.openTag = def.openTag;
      d.closeTag = def.closeTag;
      d.spans = def.spans;
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
  initializeRegExps();
}
