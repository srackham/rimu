module Rimu.Macros {

  export interface Macro {
    name: string;
    value: string;
  }
    
  export var defs: Macro[] = [];

  // Return named macro value or null if it doesn't exist.
  export function get(name: string): string {
    for (var i in defs) {
      if (defs[i].name === name) {
        return defs[i].value;
      }
    }
    return null;
  }

  // Set named macro value or add it if it doesn't exist.
  export function set(name: string, value: string): void {
    for (var i in defs) {
      if (defs[i].name === name) {
        defs[i].value = value;
        return;
      }
    }
    defs.push({name: name, value: value});
  }

  export function render(text: string): string {
    var re = /\\?\{([\w\-]+)([|?!][\s\S]*?)?\}/g;  // $1 = name, $2 = params.
    text = text.replace(re, function(match, name, params) {
      if (match[0] === '\\') {
        return match.slice(1);
      }
      var value = get(name);  // value is null if macro is undefined.
      if (!params) {
        return (value === null) ? '' : value.replace(/\$\d+/g, '');
      }
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
      else if (params[0] === '!') {
        if (value === null || value === '') {
          return '\0';  // Flag line for deletion.
        }
        else {
//          return params.slice(1);
          return '';
        }
      }
      else if (value === null) {
        return '';
      }
      else {
        return value;
      }
    });
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
