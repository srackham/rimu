import * as Macros from './macros'
import * as Spans from './spans'

export interface ExpansionOptions {
  [key: string]: boolean | undefined

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
// from `match`. If pattern starts with one '$' character add specials to `expansionOptions`,
// if it starts with two '$' characters add spans to `expansionOptions`.
export function replaceMatch(match: RegExpExecArray,
                             replacement: string,
                             expansionOptions: ExpansionOptions = {}): string {
  return replacement.replace(/(\${1,2})(\d)/g, function (): string {
    // Replace $1, $2 ... with corresponding match groups.
    if (arguments[1] === '$$') {
      expansionOptions.spans = true
    }
    else {
      expansionOptions.specials = true
    }
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
    text = Macros.render(text)
    text = text === null ? '' : text
  }
  // Spans also expand special characters.
  if (expansionOptions.spans) {
    text = Spans.render(text)
  }
  else if (expansionOptions.specials) {
    text = replaceSpecialChars(text)
  }
  return text
}

// Global Block Attributes state (namespace "singleton", see http://stackoverflow.com/a/30174360).
export namespace BlockAttributes {
  export let classes: string     // Space separated HTML class names.
  export let attributes: string  // HTML element attributes (incorporates 'style' and 'id' attributes).
  export let options: ExpansionOptions

  export function init(): void {
    classes = ''
    attributes = ''
    options = {}
  }
}

// Inject HTML attributes from attrs into the opening tag.
// Consume HTML attributes unless the 'tag' argument is blank.
export function injectHtmlAttributes(tag: string): string {
  if (!tag) {
    return tag
  }
  if (BlockAttributes.classes) {
    if (/class="\S.*"/.test(tag)) {
      // Inject class names into existing class attribute.
      tag = tag.replace(/class="(\S.*?)"/, 'class="' + BlockAttributes.classes + ' $1"')
    }
    else {
      // Prepend new class attribute to HTML attributes.
      BlockAttributes.attributes = trim('class="' + BlockAttributes.classes + '" ' + BlockAttributes.attributes)
    }
  }
  if (BlockAttributes.attributes) {
    let match = tag.match(/^<([a-zA-Z]+|h[1-6])(?=[ >])/)
    if (match) {
      let before = tag.slice(0, match[0].length)
      let after = tag.slice(match[0].length)
      tag = before + ' ' + BlockAttributes.attributes + after
    }
  }
  // Consume the attributes.
  BlockAttributes.classes = ''
  BlockAttributes.attributes = ''
  return tag
}
