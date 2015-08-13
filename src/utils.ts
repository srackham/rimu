import * as macros from './macros'
import * as spans from './spans'
import * as lineBlocks from './lineblocks'

export interface ExpansionOptions {
  [key: string]: boolean
  // Processing priority (highest to lowest): container, skip, spans and specials.
  // If spans is true then both spans and specials are processed.
  // They are assumed false if they are not explicitly defined.
  // If a custom filter is specified their use depends on the filter.
  macros?: boolean
  container?: boolean
  skip?: boolean
  spans?: boolean   // Span substitution also expands special characters.
  specials?: boolean
}

// Whitespace strippers.
export function trimLeft(s: string): string {
  return s.replace(/^\s+/g, '')
}
export function trimRight(s: string): string {
  return s.replace(/\s+$/g, '')
}
export function trim(s: string): string {
  return s.replace(/^\s+|\s+$/g, '')
}

// http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
export function escapeRegExp(s: string): string {
  return s.replace(/[\-\/\\\^$*+?.()|\[\]{}]/g, '\\$&')
}

export function replaceSpecialChars(s: string): string {
  return s.replace(/&/g, '&amp;')
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
}

// Replace pattern '$1' or '$$1', '$2' or '$$2'... in `replacement` with corresponding match groups
// from `match`. If pattern starts with one '$' substitute specials in matched group, if it starts
// with two substitute spans and speicals.
export function replaceMatch(match: RegExpExecArray, replacement: string): string {
  return replacement.replace(/(\${1,2})(\d)/g, function (): string {
    // Replace $1, $2 ... with corresponding match groups.
    let expansionOptions: ExpansionOptions = arguments[1] === '$$' ? {spans: true} : {specials: true}
    let i = Number(arguments[2])  // match group number.
    let text = match[i]           // match group text.
    return replaceInline(text, expansionOptions)
  })
}

// Shallow object clone.
export function copy(source: any): any {
  let result: any = {}
  for (let key in source) {
    if (source.hasOwnProperty(key)) {
      result[key] = source[key]
    }
  }
  return result
}

// Copy properties in source object to target object.
export function merge(target: any, source: any): void {
  for (let key in source) {
    target[key] = source[key]
  }
}

// Replace the inline elements specified in options in text and return the result.
export function replaceInline(text: string, expansionOptions: ExpansionOptions): string {
  if (expansionOptions.macros) {
    text = macros.render(text)
    text = text === null ? '' : text
  }
  // Spans also expand special characters.
  if (expansionOptions.spans) {
    return spans.render(text)
  }
  else if (expansionOptions.specials) {
    text = replaceSpecialChars(text)
  }
  return text
}

// Inject HTML attributes from LineBlocks.htmlAttributes into the opening tag.
// Consume LineBlocks.htmlAttributes unless the 'tag' argument is blank.
export function injectHtmlAttributes(tag: string): string {
  if (!tag) {
    return tag
  }
  if (lineBlocks.htmlClasses) {
    if (/class="\S.*"/.test(tag)) {
      // Inject class names into existing class attribute.
      tag = tag.replace(/class="(\S.*?)"/, 'class="' + lineBlocks.htmlClasses + ' $1"')
    }
    else {
      // Prepend new class attribute to HTML attributes.
      lineBlocks.htmlAttributes = trim('class="' + lineBlocks.htmlClasses + '" ' + lineBlocks.htmlAttributes)
    }
  }
  if (lineBlocks.htmlAttributes) {
    let match = tag.match(/^<([a-zA-Z]+|h[1-6])(?=[ >])/)
    if (match) {
      let before = tag.slice(0, match[0].length)
      let after = tag.slice(match[0].length)
      tag = before + ' ' + lineBlocks.htmlAttributes + after
    }
  }
  // Consume the attributes.
  lineBlocks.htmlClasses = ''
  lineBlocks.htmlAttributes = ''
  return tag
}

