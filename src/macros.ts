/* tslint:disable */
import * as options from './options'
/* tslint:enable */

// Matches macro invocation. $1 = name, $2 = params.
var MATCH_MACRO = /\{([\w\-]+)([!=|?](?:|[\s\S]*?[^\\]))?\}/
// Matches all macro invocations. $1 = name, $2 = params.
var MATCH_MACROS = RegExp('\\\\?' + MATCH_MACRO.source, 'g')
// Matches a line starting with a macro invocation.
export var MACRO_LINE = RegExp('^' + MATCH_MACRO.source + '.*$')
// Match multi-line macro definition open delimiter. $1 is first line of macro.
export var MACRO_DEF_OPEN = /^\\?\{[\w\-]+\}\s*=\s*'(.*)$/
// Match multi-line macro definition open delimiter. $1 is last line of macro.
export var MACRO_DEF_CLOSE = /^(.*)'$/
// Match single-line macro definition. $1 = name, $2 = value.
export var MACRO_DEF = /^\\?\{([\w\-]+)\}\s*=\s*'(.*)'$/

export interface Macro {
  name: string
  value: string
}

export var defs: Macro[] = []

// Return named macro value or null if it doesn't exist.
export function getValue(name: string): string {
  for (var i in defs) {
    if (defs[i].name === name) {
      return defs[i].value
    }
  }
  return null
}

// Set named macro value or add it if it doesn't exist.
export function setValue(name: string, value: string): void {
  for (var i in defs) {
    if (defs[i].name === name) {
      defs[i].value = value
      return
    }
  }
  defs.push({name: name, value: value})
}

// Render all macro invocations in text string.
export function render(text: string): string {
  text = text.replace(MATCH_MACROS, function (match: string, ...args: string[]): string {
    if (match[0] === '\\') {
      return match.slice(1)
    }
    var name = args[0]
    /* $1 */
    var params = args[1] || ''
    /* $2 */
    var value = getValue(name)  // Macro value is null if macro is undefined.
    switch (options.macroMode) {
      case 0: // No macros.
        return match
      case 1: // All macros.
        break
      case 2: // Only defined macros.
        if (value === null) {
          return match
        }
        break
      case 3: // Only reserved macros.
        if (!/^--/.test(name)) {
          return match
        }
        break
      case 4: // Defined or reserved macros.
        if (value === null && !/^--/.test(name)) {
          return match
        }
        break
    }
    params = params.replace(/\\\}/g, '}')   // Unescape escaped } characters.
    switch (params[0]) {
      case '?': // Existential macro.
        return value === null ? params.slice(1) : value

      case '|': // Parametrized macro.
                // Substitute macro parameters.
        var paramsList = params.slice(1).split('|')
        value = (value || '').replace(/\\?\$\d+/g, function (match: string): string {
          if (match[0] === '\\') {  // Unescape escaped $ characters.
            return match.slice(1)
          }
          var param = paramsList[parseInt(match.slice(1)) - 1]
          return param === undefined ? '' : param   // Unassigned parameters are replaced with a blank string.
        })
        return value

      case '!': // Inclusion macro.
      case '=':
        var pattern = params.slice(1)
        var skip = !RegExp('^' + pattern + '$').test(value || '')
        if (params[0] === '!') {
          skip = !skip
        }
        return skip ? '\0' : ''   // '\0' flags line for deletion.

      default:  // Plain macro.
        return value || ''       // Undefined macro replaced by empty string.

    }
  })
  // Delete lines marked for deletion by inclusion macros.
  if (text.indexOf('\0') !== -1) {
    var lines = text.split('\n')
    for (var i = lines.length - 1; i >= 0; --i) {
      if (lines[i].indexOf('\0') !== -1) {
        lines.splice(i, 1)  // Delete line[i].
      }
    }
    text = lines.join('\n')
  }
  return text
}

