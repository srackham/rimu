import * as Options from './options'
import * as Spans from './spans'

// Matches macro invocation. $1 = name, $2 = params.
// DEPRECATED: Matches existential macro invocations.
const MATCH_MACRO = /{([\w\-]+)([!=|?](?:|[^]*?[^\\]))?}/
// Matches all macro invocations. $1 = name, $2 = params.
const MATCH_MACROS = RegExp('\\\\?' + MATCH_MACRO.source, 'g')
// Matches a line starting with a macro invocation.
export const MACRO_LINE = RegExp('^' + MATCH_MACRO.source + '.*$')
// Match multi-line macro definition open delimiter. $1 is first line of macro.
export const MACRO_DEF_OPEN = /^\\?{[\w\-]+\??}\s*=\s*'(.*)$/
// Match multi-line macro definition open delimiter. $1 is last line of macro.
export const MACRO_DEF_CLOSE = /^(.*)'$/
// Match single-line macro definition. $1 = name, $2 = value.
export const MACRO_DEF = /^\\?{([\w\-]+\??)}\s*=\s*'(.*)'$/

export interface Macro {
  name: string
  value: string
}

export let defs: Macro[] = []

// Reset definitions to defaults.
export function init(): void {
  defs = []
  // Initialize predefined macros.
  setValue('--', '')
  setValue('--header-ids', '')
}

// Return named macro value or null if it doesn't exist.
export function getValue(name: string): string | null {
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
// The `inline` argument is used to ensure macro errors are not reported
// multiple times from block and inline contexts.
export function render(text: string, inline = true): string {
  text = text.replace(MATCH_MACROS, function (match: string, ...submatches: string[]): string {
    if (match[0] === '\\') {
      return match.slice(1)
    }
    let name = submatches[0]
    let params = submatches[1] || ''
    if (params[0] === '?') { // DEPRECATED: Existential macro invocation.
      if (inline) Options.errorCallback('existential macro invocations are deprecated: ' + match)
      return match
    }
    let value = getValue(name)  // Macro value is null if macro is undefined.
    if (value === null) {
      if (inline) {
        Options.errorCallback('undefined macro: ' + match + ': ' + text)
      }
      return match
    }
    params = params.replace(/\\}/g, '}')   // Unescape escaped } characters.
    switch (params[0]) {
      case '|': // Parametrized macro.
        let paramsList = params.slice(1).split('|')
        // Substitute macro parameters.
        // Matches macro definition formal parameters [$]$<param-number>[[\]:<default-param-value>$]
        // [$]$ = 1st match group; <param-number> (1, 2..) = 2nd match group;
        // :[\]<default-param-value>$ = 3rd match group; <default-param-value> = 4th match group.
        const PARAM_RE = /\\?(\$\$?)(\d+)(\\?:(|[^]*?[^\\])\$)?/g
        value = (value || '').replace(PARAM_RE, function (match: string, p1: string, p2: string, p3: string | undefined, p4: string): string {
          if (match[0] === '\\') {  // Unescape escaped macro parameters.
            return match.slice(1)
          }
          let param: string | undefined = paramsList[Number(p2) - 1]
          param = param === undefined ? '' : param  // Unassigned parameters are replaced with a blank string.
          if (p3 !== undefined) {
            if (p3[0] === '\\') { // Unescape escaped default parameter.
              param += p3.slice(1)
            }
            else {
              if (param === '') {
                param = p4                              // Assign default parameter value.
                param = param.replace(/\\\$/g, '$')     // Unescape escaped $ characters in the default value.
              }
            }
          }
          if (p1 === '$$') {
            param = Spans.render(param)
          }
          return param
        })
        return value

      case '!': // Inclusion macro.
      case '=':
        let pattern = params.slice(1)
        let skip = false
        try {
          skip = !RegExp('^' + pattern + '$').test(value || '')
        }
        catch {
          if (inline) {
            Options.errorCallback('illegal macro regular expression: ' + pattern + ': ' + text)
          }
          return match
        }
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

