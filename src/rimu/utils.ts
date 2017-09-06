import * as DelimitedBlocks from './delimitedblocks'
import * as Macros from './macros'
import * as Options from './options'
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
  return s.replace(/[\-\/\\^$*+?.()|\[\]{}]/g, '\\$&')
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
  export let id: string          // HTML element id.
  export let css: string         // HTML CSS styles.
  export let attributes: string  // Other HTML element attributes.
  export let options: ExpansionOptions

  let ids: string[] // List of allocated HTML ids.

  export function init(): void {
    classes = ''
    id = ''
    css = ''
    attributes = ''
    options = {}
    ids = []
  }

  export function parse(match: RegExpExecArray): boolean {
    // Parse Block Attributes.
    // class names = $1, id = $2, css-properties = $3, html-attributes = $4, block-options = $5
    let text = match[0]
    text = replaceInline(text, {macros: true})
    let m = /^\\?\.((?:\s*[a-zA-Z][\w\-]*)+)*(?:\s*)?(#[a-zA-Z][\w\-]*\s*)?(?:\s*)?(".+?")?(?:\s*)?(\[.+])?(?:\s*)?([+-][ \w+-]+)?$/.exec(text)
    if (!m) {
      return false
    }
    if (!Options.skipBlockAttributes()) {
      if (m[1]) { // HTML element class names.
        classes += ' ' + trim(m[1])
        classes = trim(classes)
      }
      if (m[2]) { // HTML element id.
        id = trim(m[2]).slice(1)
      }
      if (m[3]) { // CSS properties.
        css = m[3]
      }
      if (m[4] && !Options.isSafeModeNz()) { // HTML attributes.
        attributes += ' ' + trim(m[4].slice(1, m[4].length - 1))
        attributes = trim(attributes)
      }
      DelimitedBlocks.setBlockOptions(options, m[5])
    }
    return true
  }

  // Inject HTML attributes from attrs into the opening tag.
  // Consume HTML attributes unless the 'tag' argument is blank.
  export function inject(tag: string): string {
    if (!tag) {
      return tag
    }
    let attrs = ''
    if (classes) {
      if (/class="\S.*"/.test(tag)) {
        // Inject class names into existing class attribute.
        tag = tag.replace(/class="(\S.*?)"/, 'class="' + classes + ' $1"')
      }
      else {
        attrs = 'class="' + classes + '"'
      }
    }
    if (id) {
      attrs += ' id="' + id + '"'
    }
    if (css) {
      attrs += ' style=' + css
    }
    if (attributes) {
      attrs += ' ' + attributes
    }
    attrs = trim(attrs)
    if (attrs) {
      let match = tag.match(/^<([a-zA-Z]+|h[1-6])(?=[ >])/)
      if (match) {
        let before = tag.slice(0, match[0].length)
        let after = tag.slice(match[0].length)
        tag = before + ' ' + attrs + after
      }
    }
    // Consume the attributes.
    classes = ''
    id = ''
    css = ''
    attributes = ''
    return tag
  }

}


