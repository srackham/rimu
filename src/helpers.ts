/// <reference path="references.ts" />

module Rimu {

  export interface ExpansionOptions {
    [key: string]: boolean;
    // Processing priority (highest to lowest): container, skip, spans and specials.
    // If spans is true then both spans and specials are processed.
    // They are assumed false if they are not explicitly defined.
    // If a custom filter is specified their use depends on the filter.
    macros?: boolean;
    container?: boolean;
    skip?: boolean;
    spans?: boolean;  // Span substitution also expands special characters.
    specials?: boolean;
  }

  declare var exports: any; // Global CommonJS exports object.
  // Add objects in hash to module exports so they can be imported by the nodejs require() function.
  // Hash key is the exported name; hash value is the exported object.
  export function exportCommonjs(objects: {[exportedName: string]: any}): void {
    if (typeof exports !== 'undefined') {
      for (var key in objects) {
        exports[key] = objects[key];
      }
    }
  }

  // Whitespace strippers.
  export function trimLeft(s: string): string { return s.replace(/^\s+/g, ''); }
  export function trimRight(s: string): string { return s.replace(/\s+$/g, ''); }
  export function trim(s: string): string { return s.replace(/^\s+|\s+$/g, ''); }

  // http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
  export function escapeRegExp(s: string): string {
    return s.replace(/[\-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');
  }

  export function replaceSpecialChars(s: string): string {
    return s.replace(/&/g, '&amp;')
            .replace(/>/g, '&gt;')
            .replace(/</g, '&lt;');
  }

  // Replace match groups, optionally substituting the replacement groups with
  // the inline elements specified in options.
  export function replaceMatch(
      match: RegExpExecArray,
      replacement: string,
      expansionOptions: ExpansionOptions): string
  {
    return replacement.replace(/\$\d/g, function (): string {
      // Replace $1, $2 ... with corresponding match groups.
      var i = parseInt(arguments[0][1]);  // match group number.
      var text = match[i];                // match group text.
      return replaceInline(text, expansionOptions);
    });
  }

  // Replace the inline elements specified in options in text and return the result.
  export function replaceInline(text: string, expansionOptions: ExpansionOptions): string {
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
  // Consume LineBlocks.htmlAttributes unless the 'tag' argument is blank.
  export function injectHtmlAttributes(tag: string): string {
    if (!tag) {
      return tag;
    }
    if (LineBlocks.htmlClasses) {
      if (/class="\S.*"/.test(tag)) {
        // Inject class names into existing class attribute.
        tag = tag.replace(/class="(\S.*?)"/, 'class="' + LineBlocks.htmlClasses + ' $1"');
      }
      else {
        // Prepend new class attribute to HTML attributes.
        LineBlocks.htmlAttributes = trim('class="' + LineBlocks.htmlClasses + '" ' + LineBlocks.htmlAttributes);
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
    LineBlocks.htmlClasses = '';
    LineBlocks.htmlAttributes = '';
    return tag;
  }

}
