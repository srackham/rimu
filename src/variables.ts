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
    for (var i in list) {
      var variable = list[i];
      var re = RegExp('\\\\?\\{' + escapeRegExp(variable.name) + '(\\|[\\s\\S]*?)?\\}', 'g');
      text = text.replace(re, function(match, params) {
        if (match[0] === '\\') {
          return match.slice(1);
        }
        if (!params) {
          return variable.value.replace(/\$\d+/g, '');
        }
        // Substitute variable parameters.
        var result = variable.value;
        var paramsList = params.slice(1).split('|');
        for (var i in paramsList) {
          result = result.replace('$'+(parseInt(i)+1), paramsList[i]);
        }
        result = result.replace(/\$\d+/g, '');
        return result;
      });
    } 
    // Unescape undefined variables.
    text = text.replace(/\\(\{[\w\-]+(?:\|.*)?\})/, '$1');
    return text;
  }

  // CommonJS module exports.
  declare var exports: any;
  if (typeof exports !== 'undefined') {
    exports.Variables = Rimu.Variables;
  }

}
