import * as options from './options'
import * as utils from './utils'

/* tslint:disable:max-line-length */
export const MATCH_INLINE_TAG = /^(a|abbr|acronym|address|b|bdi|bdo|big|blockquote|br|cite|code|del|dfn|em|i|img|ins|kbd|mark|q|s|samp|small|span|strike|strong|sub|sup|time|tt|u|var|wbr)$/i
/* tslint:enable:max-line-length */

export interface Definition {
  match: RegExp
  replacement: string
  filter?: (match: RegExpExecArray) => string
}

export let defs: Definition[]  // Mutable definitions initialized by DEFAULT_DEFS.

const DEFAULT_DEFS: Definition[] = [
  // Begin match with \\? to allow the replacement to be escaped.
  // Global flag must be set on match re's so that the RegExp lastIndex property is set.
  // Replacements and special characters are expanded in replacement groups ($1..).
  // Replacement order is important.

  // DEPRECATED as of 3.4.0.
  // Anchor: <<#id>>
  {
    match: /\\?<<#([a-zA-Z][\w\-]*)>>/g,
    replacement: '<span id="$1"></span>',
    filter: function (match: RegExpExecArray): string {
      if (options.skipBlockAttributes()) {
        return ''
      }
      // Default (non-filter) replacement processing.
      return utils.replaceMatch(match, this.replacement)
    }
  },

  // Image: <image:src|alt>
  // src = $1, alt = $2
  {
    match: /\\?<image:([^\s\|]+)\|([\s\S]*?)>/g,
    replacement: '<img src="$1" alt="$2">'
  },

  // Image: <image:src>
  // src = $1, alt = $1
  {
    match: /\\?<image:([^\s\|]+?)>/g,
    replacement: '<img src="$1" alt="$1">'
  },

  // Image: ![alt](url)
  // alt = $1, url = $2
  {
    match: /\\?!\[([\s\S]*?)\]\s*\((\S+?)\)/g,
    replacement: '<img src="$2" alt="$1">'
  },

  // Email: <address|caption>
  // address = $1, caption = $2
  {
    match: /\\?<(\S+@[\w\.\-]+)\|([\s\S]+?)>/g,
    replacement: '<a href="mailto:$1">$$2</a>'
  },

  // Email: <address>
  // address = $1, caption = $1
  {
    match: /\\?<(\S+@[\w\.\-]+)>/g,
    replacement: '<a href="mailto:$1">$1</a>'
  },

  // Link: [caption](url)
  // caption = $1, url = $2
  {
    match: /\\?\[([\s\S]*?)\]\s*\((\S+?)\)/g,
    replacement: '<a href="$2">$$1</a>'
  },

  // HTML inline tags.
  // Match HTML comment or HTML tag.
  // $1 = tag, $2 = tag name
  {
    match: /\\?(<!--(?:[^<>&]*)?-->|<\/?([a-z][a-z0-9]*)(?:\s+[^<>&]+)?>)/ig,
    replacement: '',
    filter: function (match: RegExpExecArray): string {
      if (match[2] && !MATCH_INLINE_TAG.test(match[2])) { // Matched non-inline tag name.
        return utils.replaceSpecialChars(match[1])        // Escape block tag.
      }
      else {
        return options.htmlSafeModeFilter(match[1]) // Matched HTML comment or inline tag.
      }
    }
  },

  // Link: <url>
  // url = $1
  {
    match: /\\?<([^|\s]+?)>/g,
    replacement: '<a href="$1">$1</a>'
  },

  // Link: <url|caption>
  // url = $1, caption = $2
  {
    match: /\\?<(\S+?)\|([\s\S]*?)>/g,
    replacement: '<a href="$1">$$2</a>'
  },

  // Auto-encode (most) raw HTTP URLs as links.
  {
    match: /\\?((?:http|https):\/\/[^\s"']*[A-Za-z0-9/#])/g,
    replacement: '<a href="$1">$1</a>'
  },

  // Character entity.
  {
    match: /\\?(&[\w#][\w]+;)/g,
    replacement: '',
    filter: function (match: RegExpExecArray): string {
      return match[1]   // Pass the entity through verbatim.
    }
  },

  // Line-break (space followed by \ at end of line).
  {
    match: /[\\ ]\\(\n|$)/g,
    replacement: '<br>$1'
  },

  // This hack ensures backslashes immediately preceding closing code quotes are rendered
  // verbatim (Markdown behaviour).
  // Works by finding escaped closing code quotes and replacing the backslash and the character
  // preceding the closing quote with itself.
  {
    match: /(\S\\)(?=`)/g,
    replacement: '$1'
  },

  // This hack ensures underscores within words rendered verbatim and are not treated as
  // underscore emphasis quotes (GFM behaviour).
  {
    match: /([a-zA-Z0-9]_)(?=[a-zA-Z0-9])/g,
    replacement: '$1'
  },
]

// Reset definitions to defaults.
export function reset(): void {
  defs = DEFAULT_DEFS.map(def => utils.copy(def))
}

// Update existing or add new replacement definition.
export function setDefinition(regexp: string, flags: string, replacement: string): void {
  if (!/g/.test(flags)) {
    flags += 'g'
  }
  for (let def of defs) {
    if (def.match.source === regexp) {
      // Update existing definition.
      // Flag properties are read-only so have to create new RegExp.
      def.match = new RegExp(regexp, flags)
      def.replacement = replacement
      return
    }
  }
  // Append new definition to end of defs list (custom definitons have lower precedence).
  defs.push({match: new RegExp(regexp, flags), replacement: replacement})
}

