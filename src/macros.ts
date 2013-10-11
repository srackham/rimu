module Rimu.Macros {

  // Matches macro invocation. $1 = name, $2 = params.
  var MACRO_RE = /\{([\w\-]+)([!=|?](?:|[\s\S]*?[^\\]))?\}/;
  // Matches all macro invocations. $1 = name, $2 = params.
  var MATCH_MACROS = RegExp('\\\\?' + MACRO_RE.source, 'g');
  // Matches lines starting with a macro invocation. $1 = name, $2 = params.
  var MATCH_MACRO_LINE = RegExp('^' + MACRO_RE.source);
  // Match start of macro definition.
  var MATCH_MACRO_DEF = /^\{[\w\-]+\}\s*=\s*'/;

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

  // Render all macro invocations in text.
  // If leaveBackslash is true then the leading backslash is not removed from escaped invocations.
  export function render(text: string, leaveBackslash = false): string {
    text = text.replace(MATCH_MACROS, function(match, name /* $1 */, params /* $2 */) {
     if (match[0] === '\\') {
        if (leaveBackslash) {
          return match;
        }
        else {
          return match.slice(1);
        }
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

  // If the reader cursor begins with a macro invocation
  // then render macro invocations in the cursor.
  export function renderCursor(reader: Reader): void {
    if (reader.eof()) {
      return;
    }
    var line = reader.lines[reader.pos];
    if (MATCH_MACRO_DEF.test(line)) {  // Skip macro definitions.
      return;
    }
    if (!MATCH_MACRO_LINE.test(line)) {
      return;
    }
    // Arrive here if the line at the cursor starts with a macro invocation.
    // Escaped invocations are left intact -- the leading backslash will be removed
    // by subsequent macro expansion.
    line = render(line, true);
    if (line == '') { // Skip line (deleted by Inclusion macro).
      reader.next();
    }
    else {  // Replace the line at cursor with expanded macro line.
      reader.replaceCursor(line.split('\n'));
    }
  }

  // CommonJS module exports.
  declare var exports: any;
  if (typeof exports !== 'undefined') {
    exports.Macros = Rimu.Macros;
  }

}
