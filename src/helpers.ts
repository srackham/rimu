module Rimu {

  export interface ExpansionOptions {
      macros?: boolean;
      spans?: boolean;
      specials?: boolean;
      container?: boolean;
      skip?: boolean;
  };

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
  // the inline elements specified in options.
  export function replaceMatch(
      match: RegExpExecArray,
      replacement: string,
      expansionOptions: ExpansionOptions)
  {
    return replacement.replace(/\$\d/g, function () {
      // Replace $1, $2 ... with corresponding match groups.
      var i = parseInt(arguments[0][1]);  // match group number.
      var text = match[i];                // match group text.
      return replaceInline(text, expansionOptions);
    });
  }

  // Replace the inline elements specified in options in text and return the result.
  export function replaceInline(text: string,
      expansionOptions: ExpansionOptions): string
  {
    if (expansionOptions.macros) {
      text = Macros.render(text);
      text = text === null ? '' : text;
    }
    // Spans also expand special characters.
    if (expansionOptions.spans) {
      return Spans.render(text);
    }
    else if (expansionOptions.specials) {
      return replaceSpecialChars(text);
    }
    else {
      return text;
    }
  }

  // Inject HTML attributes from LineBlocks.htmlAttributes into the opening tag.
  // Reset LineBlocks.htmlAttributes if the injection is successful.
  export function injectHtmlAttributes(tag: string): string {
    if (!tag) {
      return tag;
    }
    if (LineBlocks.classAttributes) {
      if (/class="\S.*"/.test(tag)) {
        // Inject class names into existing class attribute.
        tag.replace(/class="(\S.*)"/, '$`class="' + LineBlocks.classAttributes + ' $1"$\'');
      }
      else {
        // Prepend new class attribute to HTML attributes.
        LineBlocks.htmlAttributes = trim('class="' + LineBlocks.classAttributes + '" ' + LineBlocks.htmlAttributes);
      }
    }
    if (LineBlocks.htmlAttributes) {
      var match = tag.match(/^<([a-zA-Z]+|h[1-6])(?=[ >])/);
      if (match) {
        var before = tag.slice(0, match[0].length);
        var after = tag.slice(match[0].length);
        tag = before + ' ' + LineBlocks.htmlAttributes + after;
      }
    }
    // Consume the attributes.
    LineBlocks.classAttributes = '';
    LineBlocks.htmlAttributes = '';
    return tag
  }

}
