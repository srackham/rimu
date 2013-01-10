module Rimu.Variables {

  export interface Variable {
    name: string;
    value: string;
  }
    
  export var list: Variable[] = [];

  export function reset(): void {
    list = [];
  }

  // Return named variable value or null if it doesn't exist.
  export function get(name: string): string {
    for (var i in list) {
      if (list[i].name === name) {
        return list[i].value;
      }
    }
    return null;
  }

  // Set named variable value or add it if it doesn't exist.
  export function set(name: string, value: string): void {
    for (var i in list) {
      if (list[i].name === name) {
        list[i].value = value;
        return;
      }
    }
    list.push({name: name, value: value});
  }

  export function render(text: string): string {
    var re = /\\?\{([\w\-]+)([|?][\s\S]*?)?\}/g;  // $1 = name, $2 = params.
    text = text.replace(re, function(match, name, params) {
      if (match[0] === '\\') {
        return match.slice(1);
      }
      var value = get(name);
      if (value === null) {
        // Variable is undefined.
        if (params && params[0] === '?') {
          return params.slice(1);
        }
        else {
          return '';
        }
      }
      if (!params) {
        return value.replace(/\$\d+/g, '');
      }
      if (params[0] === '|') {
        // Substitute variable parameters.
        var result = value;
        var paramsList = params.slice(1).split('|');
        for (var i in paramsList) {
          result = result.replace('$'+(parseInt(i)+1), paramsList[i]);
        }
        result = result.replace(/\$\d+/g, '');
        return result;
      }
      return value;
    });
    return text;
  }

  // CommonJS module exports.
  declare var exports: any;
  if (typeof exports !== 'undefined') {
    exports.Variables = Rimu.Variables;
  }

}
