/*
 This module renders inline text containing Quote and Replacement elements.

 Quote and replacement processing involves splitting the source text into
 fragments where at the points where quotes and replacements occur then splicing fragments
 containing output markup into the breaks. A fragment is flagged as 'done' to
 exclude it from further processing.

 Once all quotes and replacements are processed fragments not yet flagged as
 'done' have special characters (&, <, >) replaced with corresponding special
 character entities. The fragments are then reassembled (defraged) into a
 resultant HTML string.
 */

import * as Quotes from "./quotes.ts";
import * as Replacements from "./replacements.ts";
import * as Utils from "./utils.ts";

interface Fragment {
  text: string;
  done: boolean;
  verbatim?: string; // Replacements text rendered verbatim.
}

export function render(source: string): string {
  let result: string;
  result = preReplacements(source);
  let fragments: Fragment[] = [{ text: result, done: false }];
  fragments = fragQuotes(fragments);
  fragSpecials(fragments);
  result = defrag(fragments);
  return postReplacements(result);
}

// Converts fragments to a string.
function defrag(fragments: Fragment[]): string {
  return fragments.reduce((result, fragment) => result + fragment.text, "");
}

// Fragment quotes in all fragments and return resulting fragments array.
function fragQuotes(fragments: Fragment[]): Fragment[] {
  let result: Fragment[];
  result = [];
  fragments.forEach(fragment => {
    result.push.apply(result, fragQuote(fragment));
  });
  // Strip backlash from escaped quotes in non-done fragments.
  result
    .filter(fragment => !fragment.done)
    .forEach(fragment => fragment.text = Quotes.unescape(fragment.text));
  return result;
}

// Fragment quotes in a single fragment and return resulting fragments array.
function fragQuote(fragment: Fragment): Fragment[] {
  if (fragment.done) {
    return [fragment];
  }
  let quotesRe = Quotes.quotesRe;
  let match: RegExpExecArray | null;
  quotesRe.lastIndex = 0;
  while (true) {
    match = quotesRe.exec(fragment.text);
    if (!match) {
      return [fragment];
    }
    // Check if quote is escaped.
    if (match[0][0] === "\\") {
      // Restart search after escaped opening quote.
      quotesRe.lastIndex = match.index + match[1].length + 1;
      continue;
    }
    break;
  }
  let result: Fragment[] = [];
  // Arrive here if we have a matched quote.
  // The quote splits the input fragment into 5 or more output fragments:
  // Text before the quote, left quote tag, quoted text, right quote tag and text after the quote.
  let def = Quotes.getDefinition(match[1]);
  // Check for same closing quote one character further to the right.
  while (fragment.text[quotesRe.lastIndex] === match[1][0]) {
    // Move to closing quote one character to right.
    match[2] += match[1][0];
    quotesRe.lastIndex += 1;
  }
  let before = match.input.slice(0, match.index);
  let quoted = match[2];
  let after = match.input.slice(quotesRe.lastIndex);
  result.push({ text: before, done: false });
  result.push({ text: def.openTag, done: true });
  if (!def.spans) {
    // Spans are disabled so render the quoted text verbatim.
    quoted = Utils.replaceSpecialChars(quoted);
    quoted = quoted.replace(/\u0000/g, "\u0001"); // Flag replacements as verbatim.
    result.push({ text: quoted, done: true });
  } else {
    // Recursively process the quoted text.
    result.push.apply(result, fragQuote({ text: quoted, done: false }));
  }
  result.push({ text: def.closeTag, done: true });
  // Recursively process the following text.
  result.push.apply(result, fragQuote({ text: after, done: false }));
  return result;
}

// Stores placeholder replacement fragments saved by `preReplacements()` and restored by `postReplacements()`.
let savedReplacements: Fragment[];

// Return text with replacements replaced with a placeholder character (see `postReplacements()`):
// '\u0000' is placeholder for expanded replacement text.
// '\u0001' is placeholder for unexpanded replacement text (replacements that occur within quotes are rendered verbatim).
function preReplacements(text: string): string {
  savedReplacements = [];
  let fragments = fragReplacements([{ text: text, done: false }]);
  // Reassemble text with replacement placeholders.
  return fragments.reduce((result, fragment) => {
    if (fragment.done) {
      savedReplacements.push(fragment); // Save replaced text.
      return result + "\u0000"; // Placeholder for replaced text.
    } else {
      return result + fragment.text;
    }
  }, "");
}

// Replace replacements placeholders with replacements text from savedReplacements[].
function postReplacements(text: string): string {
  return text.replace(/[\u0000\u0001]/g, function(match): string {
    let fragment = savedReplacements.shift() as Fragment;
    return (match === "\u0000")
      ? fragment.text
      : Utils.replaceSpecialChars(fragment.verbatim as string);
  });
}

// Fragment replacements in all fragments and return resulting fragments array.
function fragReplacements(fragments: Fragment[]): Fragment[] {
  let result: Fragment[];
  Replacements.defs.forEach(def => {
    result = [];
    fragments.forEach(fragment => {
      result.push.apply(result, fragReplacement(fragment, def));
    });
    fragments = result;
  });
  return fragments;
}

// Fragment replacements in a single fragment for a single replacement definition.
// Return resulting fragments array.
function fragReplacement(
  fragment: Fragment,
  def: Replacements.Definition
): Fragment[] {
  if (fragment.done) {
    return [fragment];
  }
  let replacementRe = def.match;
  let match: RegExpExecArray | null;
  replacementRe.lastIndex = 0;
  match = replacementRe.exec(fragment.text);
  if (!match) {
    return [fragment];
  }
  let result: Fragment[] = [];
  // Arrive here if we have a matched replacement.
  // The replacement splits the input fragment into 3 output fragments:
  // Text before the replacement, replaced text and text after the replacement.
  // NOTE: Because this function is called recursively must ensure mutable index and
  //       lastIndex properties are read before the recursive call.
  let before: string = match.input.slice(0, match.index);
  let after: string = match.input.slice(replacementRe.lastIndex);
  result.push({ text: before, done: false });
  let replacement: string;
  if (match[0][0] === "\\") {
    // Remove leading backslash.
    replacement = Utils.replaceSpecialChars(match[0].slice(1));
  } else {
    if (!def.filter) {
      replacement = Utils.replaceMatch(match, def.replacement);
    } else {
      replacement = def.filter(match);
    }
  }
  result.push({ text: replacement, done: true, verbatim: match[0] });
  // Recursively process the remaining text.
  result.push.apply(
    result,
    fragReplacement({ text: after, done: false }, def)
  );
  return result;
}

function fragSpecials(fragments: Fragment[]): void {
  // Replace special characters in all non-done fragments.
  fragments
    .filter(fragment => !fragment.done)
    .forEach(fragment =>
      fragment.text = Utils.replaceSpecialChars(fragment.text)
    );
}
