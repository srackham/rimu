/*
 This module renders text containing Quote and Replacement elements.

 Quote and replacement processing involves splitting the source text into
 fragments where a quote or a replacement occurs then splicing the fragments
 containing HTML markup into the breaks.  A fragment is flagged as 'done' to
 exclude it from further substitutions.

 Once all quotes and replacements are processed fragments not yet flagged as
 'done' have special characters (&, <, >) replaced with corresponding special
 character entities. The fragments are then reassembled (defraged) into a
 resultant HTML string.
 */

import * as utils from './utils'
import * as quotes from './quotes'
import * as replacements from './replacements'

interface Fragment {
  text: string
  done: boolean
  verbatim?: string   // Replacements text rendered verbatim.
}

export function render(source: string): string {
  let result: string
  result = preReplacements(source)
  let fragments: Fragment[] = [{text: result, done: false}]
  fragQuotes(fragments)
  fragSpecials(fragments)
  result = defrag(fragments)
  return postReplacements(result)
}

/*
 Replace render() with this function to process replacements *after* quotes (pre version 5 behaviour).
 */
//export function render(source: string): string {
//  let fragments: Fragment[] = [{text: source, done: false}]
//  fragQuotes(fragments)
//  fragReplacements(fragments)
//  fragSpecials(fragments)
//  return defrag(fragments)
//}

// Converts fragments to a string.
function defrag(fragments: Fragment[]): string {
  let result: string = ''
  for (let fragment of fragments) {
    result += fragment.text
  }
  return result
}

function fragQuotes(fragments: Fragment[]): void {
  let matchRe = quotes.quotesRe
  let fragmentIndex = 0
  let fragment = fragments[fragmentIndex]
  let fragmentIsDone: boolean
  let match: RegExpExecArray
  matchRe.lastIndex = 0
  while (true) {
    if (fragment.done) {
      fragmentIsDone = true
    }
    else {
      match = matchRe.exec(fragment.text)
      fragmentIsDone = !match
    }
    if (fragmentIsDone) {
      fragmentIndex++
      if (fragmentIndex >= fragments.length) {
        break // All fragments processed.
      }
      fragment = fragments[fragmentIndex]
      matchRe.lastIndex = 0
      continue
    }
    if (match[0][0] === '\\') {
      // Restart search after opening quote.
      matchRe.lastIndex = match.index + match[1].length + 1
      continue
    }
    // Arrive here if we have a matched quote.
    let def = quotes.getDefinition(match[1])
    if (def.verify && !def.verify(match, matchRe)) {
      // Restart search after opening quote.
      matchRe.lastIndex = match.index + match[1].length + 1
      continue
    }
    // Check for same closing quote one character further to the right.
    while (fragment.text[matchRe.lastIndex] === match[1][0]) {
      // Move to closing quote one character to right.
      match[2] += match[1][0]
      matchRe.lastIndex += 1
    }
    // The quotes splits the fragment into 5 fragments.
    let before = match.input.slice(0, match.index)
    let quoted = match[2]
    let after = match.input.slice(matchRe.lastIndex)
    fragments.splice(fragmentIndex, 1,
      {text: before, done: false},
      {text: def.openTag, done: true},
      {text: quoted, done: false},
      {text: def.closeTag, done: true},
      {text: after, done: false}
    )
    // Move to 'quoted' fragment.
    fragmentIndex += 2
    fragment = fragments[fragmentIndex]
    if (!def.spans) {
      fragment.text = utils.replaceSpecialChars(fragment.text)
      fragment.text = fragment.text.replace('\u0000', '\u0001')   // Use verbatim replacement.
      fragment.done = true
      // Move to 'after' fragment.
      fragmentIndex += 2
      fragment = fragments[fragmentIndex]
    }
    matchRe.lastIndex = 0
  }
  // Strip backlash from escaped quotes in non-done fragments.
  for (let fragment of fragments) {
    if (!fragment.done) {
      fragment.text = quotes.unescape(fragment.text)
    }
  }
}

// Replacements fragments set by `preReplacements()`, used by `postReplacements()`.
let savedReplacements: Fragment[]

// Return text with replacements replaced with placeholders (see `postReplacements()`).
function preReplacements(text: string): string {
  savedReplacements = []
  let fragments: Fragment[] = [{text: text, done: false}]
  fragReplacements(fragments)
  // Reassemble text with replacement placeholders.
  let result: string = ''
  for (let fragment of fragments) {
    if (fragment.done) {
      savedReplacements.push(fragment)  // Save replaced text.
      result += '\u0000'                // Placeholder for replaced test.
    }
    else {
      result += fragment.text
    }
  }
  return result
}

// Replace replacements placeholders with replacements text from savedReplacements[].
function postReplacements(text: string): string {
  let result: string
  result = text.replace(/\u0000|\u0001/g, function (match): string {
    let fragment = savedReplacements.shift()
    return (match === '\u0000') ? fragment.text : fragment.verbatim
  })
  return result
}

function fragReplacements(fragments: Fragment[]): void {
  for (let def of replacements.defs) {
    fragReplacement(fragments, def)
  }
}

function fragReplacement(fragments: Fragment[], def: replacements.Definition): void {
  let replacementRe = def.match
  let fragmentIndex = 0
  let fragment = fragments[fragmentIndex]
  let fragmentIsDone: boolean
  let match: RegExpExecArray
  replacementRe.lastIndex = 0
  while (true) {
    if (fragment.done) {
      fragmentIsDone = true
    }
    else {
      match = replacementRe.exec(fragment.text)
      fragmentIsDone = !match
    }
    if (fragmentIsDone) {
      fragmentIndex++
      if (fragmentIndex >= fragments.length) {
        break
      }
      fragment = fragments[fragmentIndex]
      if (match) {
        replacementRe.lastIndex = 0
      }
      continue
    }
    // Arrive here if we have a matched replacement.
    // The replacement splits the fragment into 3 fragments.
    let before = match.input.slice(0, match.index)
    let after = match.input.slice(replacementRe.lastIndex)
    fragments.splice(fragmentIndex, 1,
      {text: before, done: false},
      {text: '', done: true},
      {text: after, done: false}
    )
    // Advance to 'matched' fragment and fill in the replacement text.
    fragmentIndex++
    fragment = fragments[fragmentIndex]
    if (match[0][0] === '\\') {
      // Remove leading backslash.
      fragment.text = utils.replaceSpecialChars(match[0].slice(1))
      fragment.verbatim = fragment.text
    }
    else {
      if (!def.filter) {
        fragment.text = utils.replaceMatch(match, def.replacement, {specials: true})
      }
      else {
        fragment.text = def.filter(match)
      }
      fragment.verbatim = utils.replaceSpecialChars(match[0])
    }
    fragmentIndex++
    fragment = fragments[fragmentIndex]
    replacementRe.lastIndex = 0
  }
}

function fragSpecials(fragments: Fragment[]): void {
  // Replace special characters in all non-done fragments.
  let fragment: Fragment
  for (let fragment of fragments) {
    if (!fragment.done) {
      fragment.text = utils.replaceSpecialChars(fragment.text)
    }
  }
}

