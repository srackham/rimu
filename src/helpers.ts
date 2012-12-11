module Rimu {

  // Whitespace strippers.
  export function trimLeft(s: string): string { return s.replace(/^\s+/g,''); }
  export function trimRight(s: string): string { return s.replace(/\s+$/g,''); }
  export function trim(s: string): string { return s.replace(/^\s+|\s+$/g,''); }

  // http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
  export function escapeRegExp(s: string): string {
    return s.replace(/[\-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');
  };

  export function replaceSpecialChars(s: string): string {
    return s.replace(/&/g, "&amp;")
            .replace(/>/g, "&gt;")
            .replace(/</g, "&lt;");
  }

  // Replace match groups, optionally substituting the replacement groups with
  // variables, spans or special characters.
  export function replaceMatch(
      match: RegExpExecArray,
      replacement: string,
      options = {})
  {
    return replacement.replace(/\$\d/g, function () {
      // Replace $1, $2 ... with corresponding match groups.
      var i = parseInt(arguments[0][1]);  // match group number.
      var text = match[i];                // match group text.
      return replaceOptions(text, options);
    });
  }

  // Replace the entities specified in options in text and return the result.
  export function replaceOptions(text: string,
      options: {variables?: bool; spans?: bool; specials?: bool;}): string
  {
    if (options.variables) {
      text = Variables.render(text);
    }
    if (options.spans) {
      return Spans.render(text);
    }
    else if (options.specials) {
      return replaceSpecialChars(text);
    }
    else {
      return text;
    }
  }

  // Inject HTML attributes from LineBlocks.htmlAttributes into the opening tag.
  // Reset LineBlocks.htmlAttributes if the injection is successful.
  export function injectAttributes(tag: string): string {
    if (!tag || !LineBlocks.htmlAttributes) {
      return tag;
    }
    var match = tag.match(/^<[a-zA-Z]+(?=[ >])/);
    if (!match) {
      return tag;
    }
    var before = tag.slice(0, match[0].length);
    var after = tag.slice(match[0].length);
    var result = before + ' ' + LineBlocks.htmlAttributes + after;
    LineBlocks.htmlAttributes = '';   // Consume the attributes.
    return result;
  }

}
