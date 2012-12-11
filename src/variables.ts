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
      var re = RegExp('\\\\?\\{' + escapeRegExp(variable.name) + '\\}', 'g');
      text = text.replace(re, function(match) {
        if (match[0] === '\\') {
          return match.slice(1);
        }
        else {
          return variable.value;
        }
      });
    } 
    return text;
  }

  // CommonJS module exports.
  declare var exports: any;
  if (typeof exports !== 'undefined') {
    exports.Variables = Rimu.Variables;
  }

}
