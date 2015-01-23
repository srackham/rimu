/// <reference path="references.ts" />

module Rimu.Replacements {

  export interface Definition {
    match: RegExp;
    replacement: string;
    filter?: (match: RegExpExecArray) => string;
  }

  export var defs: Definition[] = [
    // Begin match with \\? to allow the replacement to be escaped.
    // Global flag must be set on match re's so that the RegExp lastIndex property is set.
    // Replacements and special characters are expanded in replacement groups ($1..).
    // Replacement order is important.

    // Character entity.
    {
      match: /\\?(&[\w#][\w]+;)/g,
      replacement: '',
      filter: function (match: RegExpExecArray): string {
        return match[1];  // Pass the entity through verbatim.
      }
    },

    // Line-break (space followed by \ at end of line).
    {
      match: /[\\ ]\\(\n|$)/g,
      replacement: '<br>$1'
    },

    // DEPRECATED as of 3.4.0.
    // Anchor: <<#id>>
    {
      match: /\\?<<#([a-zA-Z][\w\-]*)>>/g,
      replacement: '<span id="$1"></span>'
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
      replacement: '<a href="mailto:$1">$2</a>'
    },

    // Email: <address>
    // address = $1, caption = $1
    {
      match: /\\?<(\S+@[\w\.\-]+)>/g,
      replacement: '<a href="mailto:$1">$1</a>'
    },

    // HTML tags.
    {
      match: /\\?(<[!\/]?[a-zA-Z\-]+(:?\s+[^<>&]+)?>)/g,
      replacement: '',
      filter: function (match: RegExpExecArray): string {
        return Options.safeModeFilter(match[1]);
      }
    },

    // Link: <url|caption>
    // url = $1, caption = $2
    {
      match: /\\?<(\S+?)\|([\s\S]*?)>/g,
      replacement: '<a href="$1">$2</a>'
    },

    // Link: <url>
    // url = $1
    {
      match: /\\?<(\S+?)>/g,
      replacement: '<a href="$1">$1</a>'
    },

    // Link: [caption](url)
    // caption = $1, url = $2
    {
      match: /\\?\[([\s\S]*?)\]\s*\((\S+?)\)/g,
      replacement: '<a href="$2">$1</a>'
    },

    // Auto-encode (most) raw HTTP URLs as links.
    {
      match: /(^|[^<])\b((?:http|https):\/\/[^\s"']*[^\s"',.;?)])/g,
      replacement: '$1<a href="$2">$2</a>'
    },

  ];

  // Update existing or add new replacement definition.
  export function setDefinition(regexp: string, flags: string, replacement: string): void {
    if (!/g/.test(flags)) {
      flags += 'g';
    }
    for (var i in defs) {
      if (defs[i].match.source === regexp) {
        // Update existing definition.
        // Flag properties are read-only so have to create new RegExp.
        defs[i].match = new RegExp(regexp, flags);
        defs[i].replacement = replacement;
        return;
      }
    }
    // Add new definition at start of defs list.
    defs.unshift({match: new RegExp(regexp, flags), replacement: replacement});
  }

}

