module Rimu.Macros {

  // Matches macro invocation. $1 = name, $2 = params.
  var MATCH_MACRO = /\{([\w\-]+)([!=|?](?:|[\s\S]*?[^\\]))?\}/;
  // Matches all macro invocations. $1 = name, $2 = params.
  var MATCH_MACROS = RegExp('\\\\?' + MATCH_MACRO.source, 'g');
  // Matches a line containing a single macro invocation.
  export var MACRO_LINE = RegExp('^' + MATCH_MACRO.source + '.*$');
  // Match multi-line macro definition open delimiter. $1 is first line of macro.
  export var MACRO_DEF_OPEN = /^\\?\{[\w\-]+\}\s*=\s*'(.*)$/;
  // Match multi-line macro definition open delimiter. $1 is last line of macro.
  export var MACRO_DEF_CLOSE = /^(.*)'$/;
  // Match single-line macro definition. $1 = name, $2 = value.
  export var MACRO_DEF = /^\\?\{([\w\-]+)\}\s*=\s*'(.*)'$/;

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

  // Render all macro invocations in text string.
  export function render(text: string): string {
    text = text.replace(MATCH_MACROS, function(match, name /* $1 */, params /* $2 */) {
     if (match[0] === '\\') {
          return match.slice(1);
      }
      var value = getValue(name);  // value is null if macro is undefined.
      if (!params) {
        return (value === null) ? '' : value.replace(/\$\d+/g, '');
      }
      params = params.replace(/\\\}/g, '}');  // Unescape escaped } characters.
      if (params[0] === '|') {
        if (value === null) {
          return '';
        }
        // Substitute macro parameters.
        var result = value;
        var paramsList = params.slice(1).split('|');
        for (var i in paramsList) {
          result = result.replace(RegExp('\\$' + (parseInt(i)+1) + '(?!\\d)', 'g'), paramsList[i]);
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

  // CommonJS module exports.
  declare var exports: any;
  if (typeof exports !== 'undefined') {
    exports.Macros = Rimu.Macros;
  }

}
