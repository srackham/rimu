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
  }

  export function render(source: string): string {
    var fragments: Fragment[] = [{text: source, done: false}]
    fragQuotes(fragments)
    fragReplacements(fragments)
    fragSpecials(fragments)
    return defrag(fragments)
  }

  // Converts fragments to a string.
  function defrag(fragments: Fragment[]): string {
    var result: string[] = []
    for (let fragment of fragments) {
      result.push(fragment.text)
    }
    return result.join('')
  }

  function fragQuotes(fragments: Fragment[]): void {
    var findRe = quotes.findRe
    var fragmentIndex = 0
    var fragment = fragments[fragmentIndex]
    var nextFragment: boolean
    var match: RegExpExecArray
    findRe.lastIndex = 0
    while (true) {
      if (fragment.done) {
        nextFragment = true
      }
      else {
        match = findRe.exec(fragment.text)
        nextFragment = !match
      }
      if (nextFragment) {
        fragmentIndex++
        if (fragmentIndex >= fragments.length) {
          break
        }
        fragment = fragments[fragmentIndex]
        if (match) {
          findRe.lastIndex = 0
        }
        continue
      }
      if (match[0][0] === '\\') {
        // Restart search after opening quote.
        findRe.lastIndex = match.index + match[1].length + 1
        continue
      }
      // Arrive here if we have a matched quote.
      var def = quotes.getDefinition(match[1])
      if (def.verify && !def.verify(match, findRe)) {
        // Restart search after opening quote.
        findRe.lastIndex = match.index + match[1].length + 1
        continue
      }
      // Check for same closing quote one character further to the right.
      while (fragment.text[findRe.lastIndex] === match[1][0]) {
        // Move to closing quote one character to right.
        match[2] += match[1][0]
        findRe.lastIndex += 1
      }
      // The quotes splits the fragment into 5 fragments.
      var before = match.input.slice(0, match.index)
      var quoted = match[2]
      var after = match.input.slice(findRe.lastIndex)
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
        fragment.text = quotes.unescape(fragment.text)
        fragment.text = utils.replaceSpecialChars(fragment.text)
        fragment.done = true
        // Move to 'after' fragment.
        fragmentIndex += 2
        fragment = fragments[fragmentIndex]
      }
      findRe.lastIndex = 0
    }
    // Strip backlash from escaped quotes in non-done fragments.
    for (let fragment of fragments) {
      if (!fragment.done) {
        fragment.text = quotes.unescape(fragment.text)
      }
    }
  }

  function fragReplacements(fragments: Fragment[]): void {
    for (let def of replacements.defs) {
      fragReplacement(fragments, def)
    }
  }

  function fragReplacement(fragments: Fragment[], def: replacements.Definition): void {
    var findRe = def.match
    var fragmentIndex = 0
    var fragment = fragments[fragmentIndex]
    var nextFragment: boolean
    var match: RegExpExecArray
    findRe.lastIndex = 0
    while (true) {
      if (fragment.done) {
        nextFragment = true
      }
      else {
        match = findRe.exec(fragment.text)
        nextFragment = !match
      }
      if (nextFragment) {
        fragmentIndex++
        if (fragmentIndex >= fragments.length) {
          break
        }
        fragment = fragments[fragmentIndex]
        if (match) {
          findRe.lastIndex = 0
        }
        continue
      }
      // Arrive here if we have a matched replacement.
      // The replacement splits the fragment into 3 fragments.
      var before = match.input.slice(0, match.index)
      var after = match.input.slice(findRe.lastIndex)
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
        fragment.text = match.input.slice(match.index + 1, findRe.lastIndex)
        fragment.text = utils.replaceSpecialChars(fragment.text)
      }
      else {
        if (!def.filter) {
          fragment.text = utils.replaceMatch(match, def.replacement, {specials: true})
        }
        else {
          fragment.text = def.filter(match)
        }
      }
      fragmentIndex++
      fragment = fragments[fragmentIndex]
      findRe.lastIndex = 0
    }
  }

  function fragSpecials(fragments: Fragment[]): void {
    // Replace special characters in all non-done fragments.
    var fragment: Fragment
    for (let fragment of fragments) {
      if (!fragment.done) {
        fragment.text = utils.replaceSpecialChars(fragment.text)
      }
    }
  }

