import * as options from './options'

// Matches macro invocation. $1 = name, $2 = params.
const MATCH_MACRO = /\{([\w\-]+)([!=|?](?:|[\s\S]*?[^\\]))?\}/
// Matches all macro invocations. $1 = name, $2 = params.
const MATCH_MACROS = RegExp('\\\\?' + MATCH_MACRO.source, 'g')
// Matches a line starting with a macro invocation.
export const MACRO_LINE = RegExp('^' + MATCH_MACRO.source + '.*$')
// Match multi-line macro definition open delimiter. $1 is first line of macro.
export const MACRO_DEF_OPEN = /^\\?\{[\w\-]+\??\}\s*=\s*'(.*)$/
// Match multi-line macro definition open delimiter. $1 is last line of macro.
export const MACRO_DEF_CLOSE = /^(.*)'$/
// Match single-line macro definition. $1 = name, $2 = value.
export const MACRO_DEF = /^\\?\{([\w\-]+\??)\}\s*=\s*'(.*)'$/

export interface Macro {
  name: string
  value: string
}

export let defs: Macro[] = []

// Reset definitions to defaults.
export function reset(): void {
  defs = []
}

// Return named macro value or null if it doesn't exist.
export function getValue(name: string): string {
  for (let def of defs) {
    if (def.name === name) {
      return def.value
    }
  }
  return null
}

// Set named macro value or add it if it doesn't exist.
// If the name ends with '?' then don't set the macro if it already exists.
export function setValue(name: string, value: string): void {
  let existential = false;
  if (name.slice(-1) === '?') {
    name = name.slice(0, -1)
    existential = true
  }
  for (let def of defs) {
    if (def.name === name) {
      if (!existential) {
        def.value = value
      }
      return
    }
  }
  defs.push({name: name, value: value})
}

// Render all macro invocations in text string.
export function render(text: string, inline = true): string {
  text = text.replace(MATCH_MACROS, function (match: string, ...submatches: string[]): string {
    if (match[0] === '\\') {
      return match.slice(1)
    }
    let name = submatches[0]
    let params = submatches[1] || ''
    let value = getValue(name)  // Macro value is null if macro is undefined.
    switch (options.macroMode) {
      case 0: // No macros.
        return match
      case 1: // All macros.
        break
      case 2: // Only defined macros.
        if (value === null) {
          if (inline) options.errorCallback('undefined macro: ' + name + ': ' + text)
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
          if (inline) options.errorCallback('undefined macro: ' + name + ': ' + text)
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
        let paramsList = params.slice(1).split('|')
        value = (value || '').replace(/\\?\$\d+/g, function (match: string): string {
          if (match[0] === '\\') {  // Unescape escaped $ characters.
            return match.slice(1)
          }
          let param = paramsList[Number(match.slice(1)) - 1]
          return param === undefined ? '' : param   // Unassigned parameters are replaced with a blank string.
        })
        return value

      case '!': // Inclusion macro.
      case '=':
        let pattern = params.slice(1)
        let skip = !RegExp('^' + pattern + '$').test(value || '')
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
    let lines = text.split('\n')
    for (let i = lines.length - 1; i >= 0; --i) {
      if (lines[i].indexOf('\0') !== -1) {
        lines.splice(i, 1)  // Delete line[i].
      }
    }
    text = lines.join('\n')
  }
  return text
}

