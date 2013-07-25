module Rimu.Spans {
/*
  This module renders text containing Quote and Replacement span elements.

  Quote and replacement processing involves splitting the source text into
  fragments where a quote or a replacement occurs then splicing the fragments
  containing HTML markup into the breaks.  A fragment is flagged as 'done' to
  exclude it from further substitutions.

  Once all quotes and replacements are processed fragments not yet flagged as
  'done' are escaped with special character entities and the fragments are
  reassembled (defraged) into the resultant HTML string.
*/

  interface Fragment {
    text: string;
    done: bool;
  }

  export function render(source: string): string {
    var fragments: Fragment[] = [{text: source, done: false}];
    fragQuotes(fragments);
    fragReplacements(fragments);
    fragSpecials(fragments);
    return defrag(fragments);
  }

  // Converts fragments to a string.
  function defrag(fragments: Fragment[]): string {
    var result = [];
    for (var i in fragments) {
      result.push(fragments[i].text);
    }
    return result.join('');
  }

  function fragQuotes(fragments: Fragment[]): void {
    var findRe = Quotes.findRe;
    var fragmentIndex = 0;
    var fragment = fragments[fragmentIndex];
    var nextFragment: bool;
    var match: RegExpExecArray;
    findRe.lastIndex = 0;
    while (true) {
      if (fragment.done) {
        nextFragment = true;
      }
      else {
        match = findRe.exec(fragment.text);
        nextFragment = !match;
      }
      if (nextFragment) {
        fragmentIndex++
        if (fragmentIndex >= fragments.length) {
          break;
        }
        fragment = fragments[fragmentIndex];
        if (match) {
           findRe.lastIndex = 0;
        }
        continue;
      }
      if (match[0][0] === '\\') {
        continue;
      }
      // Arrive here if we have a matched quote.
      var def = Quotes.find(match[1]);
      if (def.verify && !def.verify(match, findRe)) {
        // Next search starts after the opening quote (not the closing quote).
        findRe.lastIndex = match.index + 1;
        continue;
      }
      // The quotes splits the fragment into 5 fragments.
      var before = match.input.slice(0, match.index);
      var quoted = match[2];
      var after = match.input.slice(findRe.lastIndex);
      fragments.splice(fragmentIndex, 1,
        {text: before, done: false},
        {text: def.openTag, done: true},
        {text: quoted, done: false},
        {text: def.closeTag, done: true},
        {text: after, done: false}
      );
      // Move to 'quoted' fragment.
      fragmentIndex += 2;
      fragment = fragments[fragmentIndex];
      if (!def.spans) {
        fragment.text = Quotes.unescape(fragment.text);
        fragment.text = replaceSpecialChars(fragment.text);
        fragment.done = true;
        // Move to 'after' fragment.
        fragmentIndex += 2;
        fragment = fragments[fragmentIndex];
      }
      findRe.lastIndex = 0;
    }
    // Strip backlash from escaped quotes in non-done fragments.
    for (var i in fragments) {
      fragment = fragments[i];
      if (!fragment.done) {
        fragment.text = Quotes.unescape(fragment.text);
      }
    }
  }

  function fragReplacements(fragments: Fragment[]): void {
    for (var i in Replacements.defs) {
      fragReplacement(fragments, Replacements.defs[i]);
    }
  }

  function fragReplacement(fragments: Fragment[], def: Replacements.Definition): void {
    var findRe = def.match;
    var fragmentIndex = 0;
    var fragment = fragments[fragmentIndex];
    var nextFragment: bool;
    var match: RegExpExecArray;
    findRe.lastIndex = 0;
    while (true) {
      if (fragment.done) {
        nextFragment = true;
      }
      else {
        match = findRe.exec(fragment.text);
        nextFragment = !match;
      }
      if (nextFragment) {
        fragmentIndex++
        if (fragmentIndex >= fragments.length) {
          break;
        }
        fragment = fragments[fragmentIndex];
        if (match) {
           findRe.lastIndex = 0;
        }
        continue;
      }
      // Arrive here if we have a matched replacement.
      // The replacement splits the fragment into 3 fragments.
      var before = match.input.slice(0, match.index);
      var after = match.input.slice(findRe.lastIndex);
      fragments.splice(fragmentIndex, 1,
        {text: before, done: false},
        {text: '', done: true},
        {text: after, done: false}
      );
      // Advance to 'matched' fragment and fill in the replacement text.
      fragmentIndex++;
      fragment = fragments[fragmentIndex];
      if (match[0][0] === '\\') {
        // Remove leading backslash.
        fragment.text = match.input.slice(match.index + 1, findRe.lastIndex);
        fragment.text = replaceSpecialChars(fragment.text);
      }
      else {
        if (!def.filter) {
          fragment.text = replaceMatch(match, def.replacement, {spans: true});
        }
        else {
          fragment.text = def.filter(match);
        }
      }
      fragmentIndex++;
      fragment = fragments[fragmentIndex];
      findRe.lastIndex = 0;
    }
  }

  function fragSpecials(fragments: Fragment[]): void {
    // Replace special characters in all non-done fragments.
    var fragment: Fragment;
    for (var i in fragments) {
      fragment = fragments[i];
      if (!fragment.done) {
        fragment.text = replaceSpecialChars(fragment.text);
      }
    }
  }

  // CommonJS module exports.
  declare var exports: any;
  if (typeof exports !== 'undefined') {
    exports.Spans = Rimu.Spans;
  }

}
