module Rimu.Replacements {

  export interface Definition {
    filter?: (match: RegExpExecArray) => string;
    match: RegExp;
    replacement: string;
    specials: bool;
  }
    
  export var defs: Definition[] = [
    // Begin match with \\? to allow the replacement to be escaped.
    // Global flag must be set on match re's so that the RegExp lastIndex property is set.
    // Replacement order is important.
    // If 'specials' is true source text in replacement groups is escaped with
    // special character entities.

    // Pass through character entities.
    {
      match: /\\?(&[\w#][\w]+;)/g,
      replacement: '$1',
      specials: false,
    },

    // Line break (space followed by + at end of line).
    {
      match: /[\\ ]\+(\n|$)/g,
      replacement: '<br>$1',
      specials: false,
    },

    // Stand-alone \+ "safe plus" replaced by +.
    // A "safe plus" cannot become a line break if wrapped to end-of-line.
    {
      match: /(^|\s)\\\+(\s|$)/g,
      replacement: '$1+$2',
      specials: false,
    },

    // Anchor: <<#id>>
    {
      match: /\\?<<#([a-zA-Z][\w\-]*)>>/g,
      replacement: '<span id="$1"></span>',
      specials: true,
    },

    // Image: <image:src|alt>
    // src = $1, alt = $2
    {
      match: /\\?<image:([^\s\|]+)\|([\s\S]+?)>/g,
      replacement: '<img src="$1" alt="$2">',
      specials: true,
    },

    // Image: <image:src>
    // src = $1, alt = $1
    {
      match: /\\?<image:([^\s\|]+?)>/g,
      replacement: '<img src="$1" alt="$1">',
      specials: true,
    },

    // Email: <address|caption>
    // address = $1, caption = $2
    {
      match: /\\?<(\S+@[\w\.\-]+)\|([\s\S]+?)>/g,
      replacement: '<a href="mailto:$1">$2</a>',
      specials: true,
    },

    // Email: <address>
    // address = $1, caption = $1
    {
      match: /\\?<(\S+@[\w\.\-]+)>/g,
      replacement: '<a href="mailto:$1">$1</a>',
      specials: true,
    },

    // HTML tags.
    {
      filter: function (match) {
        var text = replaceMatch(match, this.replacement, this);
        return Options.safeModeFilter(text);
      },
      match: /\\?(<[!\/]?[a-zA-Z\-]+(:?\s+[^<>&]+)?>)/g,
      replacement: '$1',
      specials: false,
    },

    // Link: <url|caption>
    // url = $1, caption = $2
    {
      match: /\\?<(\S+?)\|([\s\S]+?)>/g,
      replacement: '<a href="$1">$2</a>',
      specials: true,
    },

    // Link: <url>
    // url = $1
    {
      match: /\\?<(\S+?)>/g,
      replacement: '<a href="$1">$1</a>',
      specials: true,
    },

  ];

  // Update existing or add new replacement definition.
  export function set(regexp: string, flags: string, replacement: string): void {
    if (!/g/.test(flags)) {
      flags += 'g';
    }
    for (var i in defs) {
      if (defs[i].match.source === regexp) {
        // Update existing definition.
        defs[i].match.ignoreCase = /i/.test(flags);
        defs[i].match.multiline = /m/.test(flags);
        defs[i].replacement = replacement;
        return;
      }
    }
    // Add new definition at start of defs list.
    defs.unshift({match: new RegExp(regexp, flags), replacement: replacement, specials: true});
  }

  // CommonJS module exports.
  declare var exports: any;
  if (typeof exports !== 'undefined') {
    exports.Replacements = Rimu.Replacements;
  }

}

