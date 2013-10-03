module Rimu.Macros {

  // Matches all macro invocations. $1 = name, $2 = params.
  var MATCH_MACROS = /\\?\{([\w\-]+)([!=|?](?:|[\s\S]*?[^\\]))?\}/g;
  // Matches start-of-line Inclusion macro invocation. $1 = name, $2 = params.
  var MATCH_LEADING_INCLUSION = /^\{([\w\-]+)([!=](?:|[\s\S]*?[^\\]))\}/;

  export interface Macro {
    name: string;
    value: string;
  }
    
  export var defs: Macro[] = [];

  // Return named macro value or null if it doesn't exist.
  export function getValue(name: string): string {
    for (var i in defs) {
      if (defs[i].name === name) {
        return defs[i].value;
      }
    }
    return null;
  }

  // Set named macro value or add it if it doesn't exist.
  export function setValue(name: string, value: string): void {
    for (var i in defs) {
      if (defs[i].name === name) {
        defs[i].value = value;
        return;
      }
    }
    defs.push({name: name, value: value});
  }

  export function render(text: string, regexp = MATCH_MACROS): string {
    text = text.replace(regexp, function(match, name /* $1 */, params /* $2 */) {
      if (match[0] === '\\') {
        return match.slice(1);
      }
      var value = getValue(name);  // value is null if macro is undefined.
      if (!params) {
        return (value === null) ? '' : value.replace(/\$\d+/g, '');
      }
      params = params.replace(/\\\}/g, '}');  // Unescape escaped } characters.
      if (params[0] === '|') {
        // Substitute macro parameters.
        var result = value;
        var paramsList = params.slice(1).split('|');
        for (var i in paramsList) {
          result = result.replace('$'+(parseInt(i)+1), paramsList[i]);
        }
        result = result.replace(/\$\d+/g, '');
        return result;
      }
      else if (params[0] === '?') {
        if (value === null) {
          return params.slice(1);
        }
      }
      else if (params[0] === '!' || params[0] === '=') {
        if (value === null ) {
          value = '';   // null matches an empty string.
        }
        var pattern = params.slice(1);
        var skip = !RegExp('^' + pattern + '$').test(value);
        if (params[0] === '!') {
          skip = !skip;
        }
        if (skip) {
          return '\0';    // Flag line for deletion.
        }
        else {
          return '';
        }
      }
      else if (value === null) {
        return '';      // Undefined macro replaced by empty string.
      }
      else {
        return value;
      }
    });
    // Delete lines marked for deletion by inclusion macros.
    if (text.indexOf('\0') !== -1) {
      var lines = text.split('\n');
      for (var i = lines.length - 1; i >= 0; --i) {
        if (lines[i].indexOf('\0') !== -1) {
          lines.splice(i, 1);
        }
      }
      text = lines.join('\n');
    }
    return text;
  }

  // If the current line on the reader begins with an inclusion macro invocation
  // then render the leading inclusion. If the inclusion skips the line then
  // move the reader cursor to the next line and return true, else return false.
  export function renderLeadingInclusion(reader: Reader): boolean {
    var line = reader.cursor();
    if (!line) {
      return false;
    }
    if (!MATCH_LEADING_INCLUSION.test(line)) {
      return false;
    }
    // Arrive here if the line at the cursor starts with an inclusion macro invocation.
    line = render(line, MATCH_LEADING_INCLUSION);
    if (line == '') {
      reader.next();  // Skip the line at the cursor.
      return true;
    }
    else {
      reader.cursor(line);  // Retain the line at the cursor.
      return false;
    }
  }

  // CommonJS module exports.
  declare var exports: any;
  if (typeof exports !== 'undefined') {
    exports.Macros = Rimu.Macros;
  }

}
