// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.

// This is a specialised implementation of a System module loader.

// @ts-nocheck
/* eslint-disable */
let System, __instantiateAsync, __instantiate;

(() => {
  const r = new Map();

  System = {
    register(id, d, f) {
      r.set(id, { d, f, exp: {} });
    },
  };

  async function dI(mid, src) {
    let id = mid.replace(/\.\w+$/i, "");
    if (id.includes("./")) {
      const [o, ...ia] = id.split("/").reverse(),
        [, ...sa] = src.split("/").reverse(),
        oa = [o];
      let s = 0,
        i;
      while ((i = ia.shift())) {
        if (i === "..") s++;
        else if (i === ".") break;
        else oa.push(i);
      }
      if (s < sa.length) oa.push(...sa.slice(s));
      id = oa.reverse().join("/");
    }
    return r.has(id) ? gExpA(id) : import(mid);
  }

  function gC(id, main) {
    return {
      id,
      import: (m) => dI(m, id),
      meta: { url: id, main },
    };
  }

  function gE(exp) {
    return (id, v) => {
      v = typeof id === "string" ? { [id]: v } : id;
      for (const [id, value] of Object.entries(v)) {
        Object.defineProperty(exp, id, {
          value,
          writable: true,
          enumerable: true,
        });
      }
    };
  }

  function rF(main) {
    for (const [id, m] of r.entries()) {
      const { f, exp } = m;
      const { execute: e, setters: s } = f(gE(exp), gC(id, id === main));
      delete m.f;
      m.e = e;
      m.s = s;
    }
  }

  async function gExpA(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](await gExpA(d[i]));
      const r = e();
      if (r) await r;
    }
    return m.exp;
  }

  function gExp(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](gExp(d[i]));
      e();
    }
    return m.exp;
  }

  __instantiateAsync = async (m) => {
    System = __instantiateAsync = __instantiate = undefined;
    rF(m);
    return gExpA(m);
  };

  __instantiate = (m) => {
    System = __instantiateAsync = __instantiate = undefined;
    rF(m);
    return gExp(m);
  };
})();

System.register("io", [], function (exports_1, context_1) {
  "use strict";
  var Reader, Writer;
  var __moduleName = context_1 && context_1.id;
  return {
    setters: [],
    execute: function () {
      Reader = class Reader {
        constructor(text) {
          text = text.replace("\u0000", " "); // Used internally by spans package.
          text = text.replace("\u0001", " "); // Used internally by spans package.
          text = text.replace("\u0002", " "); // Used internally by macros package.
          // Split lines on newline boundaries.
          // http://stackoverflow.com/questions/1155678/javascript-string-newline-character
          // Split is broken on IE8 e.g. 'X\n\nX'.split(/\n/g).length) returns 2 but should return 3.
          this.lines = text.split(/\r\n|\r|\n/g);
          this.pos = 0;
        }
        get cursor() {
          console.assert(!this.eof());
          return this.lines[this.pos];
        }
        set cursor(value) {
          console.assert(!this.eof());
          this.lines[this.pos] = value;
        }
        // Return true if the cursor has advanced over all input lines.
        eof() {
          return this.pos >= this.lines.length;
        }
        // Move cursor to next input line.
        next() {
          if (!this.eof()) {
            this.pos++;
          }
        }
        // Read to the first line matching the re.
        // Return the array of lines preceding the match plus a line containing
        // the $1 match group (if it exists).
        // Return null if an EOF is encountered.
        // Exit with the reader pointing to the line following the match.
        readTo(find) {
          let result = [];
          let match = null;
          while (!this.eof()) {
            match = this.cursor.match(find);
            if (match) {
              if (match[1] !== undefined) {
                result.push(match[1]); // $1
              }
              this.next();
              break;
            }
            result.push(this.cursor);
            this.next();
          }
          // Blank line matches EOF.
          if (match || (find.toString() === "/^$/" && this.eof())) {
            return result;
          } else {
            return null;
          }
        }
        skipBlankLines() {
          while (!this.eof() && this.cursor.trim() === "") {
            this.next();
          }
        }
      };
      exports_1("Reader", Reader);
      Writer = class Writer {
        constructor() {
          this.buffer = [];
        }
        write(s) {
          this.buffer.push(s);
        }
        toString() {
          return this.buffer.join("");
        }
      };
      exports_1("Writer", Writer);
    },
  };
});
System.register("quotes", ["utils"], function (exports_2, context_2) {
  "use strict";
  var Utils, defs, DEFAULT_DEFS, quotesRe, unescapeRe;
  var __moduleName = context_2 && context_2.id;
  // Reset definitions to defaults.
  function init() {
    defs = DEFAULT_DEFS.map((def) => Utils.copy(def));
    initializeRegExps();
  }
  exports_2("init", init);
  // Synthesise re's to find and unescape quotes.
  function initializeRegExps() {
    let quotes = defs.map((def) => Utils.escapeRegExp(def.quote));
    // $1 is quote character(s), $2 is quoted text.
    // Quoted text cannot begin or end with whitespace.
    // Quoted can span multiple lines.
    // Quoted text cannot end with a backslash.
    exports_2(
      "quotesRe",
      quotesRe = RegExp(
        "\\\\?(" + quotes.join("|") +
          ")([^\\s\\\\]|\\S[\\s\\S]*?[^\\s\\\\])\\1",
        "g",
      ),
    );
    // $1 is quote character(s).
    unescapeRe = RegExp("\\\\(" + quotes.join("|") + ")", "g");
  }
  exports_2("initializeRegExps", initializeRegExps);
  // Return the quote definition corresponding to 'quote' character, return undefined if not found.
  function getDefinition(quote) {
    return defs.filter((def) => def.quote === quote)[0];
  }
  exports_2("getDefinition", getDefinition);
  // Strip backslashes from quote characters.
  function unescape(s) {
    return s.replace(unescapeRe, "$1");
  }
  exports_2("unescape", unescape);
  // Update existing or add new quote definition.
  function setDefinition(def) {
    for (let d of defs) {
      if (d.quote === def.quote) {
        // Update existing definition.
        d.openTag = def.openTag;
        d.closeTag = def.closeTag;
        d.spans = def.spans;
        return;
      }
    }
    // Double-quote definitions are prepended to the array so they are matched
    // before single-quote definitions (which are appended to the array).
    if (def.quote.length === 2) {
      defs.unshift(def);
    } else {
      defs.push(def);
    }
    initializeRegExps();
  }
  exports_2("setDefinition", setDefinition);
  return {
    setters: [
      function (Utils_1) {
        Utils = Utils_1;
      },
    ],
    execute: function () {
      DEFAULT_DEFS = [
        {
          quote: "**",
          openTag: "<strong>",
          closeTag: "</strong>",
          spans: true,
        },
        {
          quote: "*",
          openTag: "<em>",
          closeTag: "</em>",
          spans: true,
        },
        {
          quote: "__",
          openTag: "<strong>",
          closeTag: "</strong>",
          spans: true,
        },
        {
          quote: "_",
          openTag: "<em>",
          closeTag: "</em>",
          spans: true,
        },
        {
          quote: "``",
          openTag: "<code>",
          closeTag: "</code>",
          spans: false,
        },
        {
          quote: "`",
          openTag: "<code>",
          closeTag: "</code>",
          spans: false,
        },
        {
          quote: "~~",
          openTag: "<del>",
          closeTag: "</del>",
          spans: true,
        },
      ];
    },
  };
});
System.register(
  "replacements",
  ["options", "utils"],
  function (exports_3, context_3) {
    "use strict";
    var Options, Utils, defs, DEFAULT_DEFS;
    var __moduleName = context_3 && context_3.id;
    // Reset definitions to defaults.
    function init() {
      exports_3("defs", defs = DEFAULT_DEFS.map((def) => Utils.copy(def)));
    }
    exports_3("init", init);
    // Update existing or add new replacement definition.
    function setDefinition(regexp, flags, replacement) {
      if (!/g/.test(flags)) {
        flags += "g";
      }
      for (let def of defs) {
        if (def.match.source === regexp) {
          // Update existing definition.
          // Flag properties are read-only so have to create new RegExp.
          def.match = new RegExp(regexp, flags);
          def.replacement = replacement;
          return;
        }
      }
      // Append new definition to end of defs list (custom definitons have lower precedence).
      defs.push({ match: new RegExp(regexp, flags), replacement: replacement });
    }
    exports_3("setDefinition", setDefinition);
    return {
      setters: [
        function (Options_1) {
          Options = Options_1;
        },
        function (Utils_2) {
          Utils = Utils_2;
        },
      ],
      execute: function () {
        DEFAULT_DEFS = [
          // Begin match with \\? to allow the replacement to be escaped.
          // Global flag must be set on match re's so that the RegExp lastIndex property is set.
          // Replacements and special characters are expanded in replacement groups ($1..).
          // Replacement order is important.
          // DEPRECATED as of 3.4.0.
          // Anchor: <<#id>>
          {
            match: /\\?<<#([a-zA-Z][\w\-]*)>>/g,
            replacement: '<span id="$1"></span>',
            filter: function (match) {
              if (Options.skipBlockAttributes()) {
                return "";
              }
              // Default (non-filter) replacement processing.
              return Utils.replaceMatch(match, this.replacement);
            },
          },
          // Image: <image:src|alt>
          // src = $1, alt = $2
          {
            match: /\\?<image:([^\s|]+)\|([^]*?)>/g,
            replacement: '<img src="$1" alt="$2">',
          },
          // Image: <image:src>
          // src = $1, alt = $1
          {
            match: /\\?<image:([^\s|]+?)>/g,
            replacement: '<img src="$1" alt="$1">',
          },
          // Image: ![alt](url)
          // alt = $1, url = $2
          {
            match: /\\?!\[([^[]*?)]\((\S+?)\)/g,
            replacement: '<img src="$2" alt="$1">',
          },
          // Email: <address|caption>
          // address = $1, caption = $2
          {
            match: /\\?<(\S+@[\w.\-]+)\|([^]+?)>/g,
            replacement: '<a href="mailto:$1">$$2</a>',
          },
          // Email: <address>
          // address = $1, caption = $1
          {
            match: /\\?<(\S+@[\w.\-]+)>/g,
            replacement: '<a href="mailto:$1">$1</a>',
          },
          // Link: [caption](url)
          // caption = $1, url = $2
          {
            match: /\\?\[([^[]*?)]\((\S+?)\)/g,
            replacement: '<a href="$2">$$1</a>',
          },
          // Link: <url|caption>
          // url = $1, caption = $2
          {
            match: /\\?<(\S+?)\|([^]*?)>/g,
            replacement: '<a href="$1">$$2</a>',
          },
          // HTML inline tags.
          // Match HTML comment or HTML tag.
          // $1 = tag, $2 = tag name
          {
            match:
              /\\?(<!--(?:[^<>&]*)?-->|<\/?([a-z][a-z0-9]*)(?:\s+[^<>&]+)?>)/ig,
            replacement: "",
            filter: function (match) {
              return Options.htmlSafeModeFilter(match[1]); // Matched HTML comment or inline tag.
            },
          },
          // Link: <url>
          // url = $1
          {
            match: /\\?<([^|\s]+?)>/g,
            replacement: '<a href="$1">$1</a>',
          },
          // Auto-encode (most) raw HTTP URLs as links.
          {
            match: /\\?((?:http|https):\/\/[^\s"']*[A-Za-z0-9/#])/g,
            replacement: '<a href="$1">$1</a>',
          },
          // Character entity.
          {
            match: /\\?(&[\w#][\w]+;)/g,
            replacement: "",
            filter: function (match) {
              return match[1]; // Pass the entity through verbatim.
            },
          },
          // Line-break (space followed by \ at end of line).
          {
            match: /[\\ ]\\(\n|$)/g,
            replacement: "<br>$1",
          },
          // This hack ensures backslashes immediately preceding closing code quotes are rendered
          // verbatim (Markdown behaviour).
          // Works by finding escaped closing code quotes and replacing the backslash and the character
          // preceding the closing quote with itself.
          {
            match: /(\S\\)(?=`)/g,
            replacement: "$1",
          },
          // This hack ensures underscores within words rendered verbatim and are not treated as
          // underscore emphasis quotes (GFM behaviour).
          {
            match: /([a-zA-Z0-9]_)(?=[a-zA-Z0-9])/g,
            replacement: "$1",
          },
        ];
      },
    };
  },
);
/*
 This module renders inline text containing Quote and Replacement elements.

 Quote and replacement processing involves splitting the source text into
 fragments where at the points where quotes and replacements occur then splicing fragments
 containing output markup into the breaks. A fragment is flagged as 'done' to
 exclude it from further processing.

 Once all quotes and replacements are processed fragments not yet flagged as
 'done' have special characters (&, <, >) replaced with corresponding special
 character entities. The fragments are then reassembled (defraged) into a
 resultant HTML string.
 */
System.register(
  "spans",
  ["quotes", "replacements", "utils"],
  function (exports_4, context_4) {
    "use strict";
    var Quotes, Replacements, Utils, savedReplacements;
    var __moduleName = context_4 && context_4.id;
    function render(source) {
      let result;
      result = preReplacements(source);
      let fragments = [{ text: result, done: false }];
      fragments = fragQuotes(fragments);
      fragSpecials(fragments);
      result = defrag(fragments);
      return postReplacements(result);
    }
    exports_4("render", render);
    // Converts fragments to a string.
    function defrag(fragments) {
      return fragments.reduce((result, fragment) => result + fragment.text, "");
    }
    // Fragment quotes in all fragments and return resulting fragments array.
    function fragQuotes(fragments) {
      let result;
      result = [];
      fragments.forEach((fragment) => {
        result.push.apply(result, fragQuote(fragment));
      });
      // Strip backlash from escaped quotes in non-done fragments.
      result
        .filter((fragment) => !fragment.done)
        .forEach((fragment) => fragment.text = Quotes.unescape(fragment.text));
      return result;
    }
    // Fragment quotes in a single fragment and return resulting fragments array.
    function fragQuote(fragment) {
      if (fragment.done) {
        return [fragment];
      }
      let quotesRe = Quotes.quotesRe;
      let match;
      quotesRe.lastIndex = 0;
      while (true) {
        match = quotesRe.exec(fragment.text);
        if (!match) {
          return [fragment];
        }
        // Check if quote is escaped.
        if (match[0][0] === "\\") {
          // Restart search after escaped opening quote.
          quotesRe.lastIndex = match.index + match[1].length + 1;
          continue;
        }
        break;
      }
      let result = [];
      // Arrive here if we have a matched quote.
      // The quote splits the input fragment into 5 or more output fragments:
      // Text before the quote, left quote tag, quoted text, right quote tag and text after the quote.
      let def = Quotes.getDefinition(match[1]);
      // Check for same closing quote one character further to the right.
      while (fragment.text[quotesRe.lastIndex] === match[1][0]) {
        // Move to closing quote one character to right.
        match[2] += match[1][0];
        quotesRe.lastIndex += 1;
      }
      let before = match.input.slice(0, match.index);
      let quoted = match[2];
      let after = match.input.slice(quotesRe.lastIndex);
      result.push({ text: before, done: false });
      result.push({ text: def.openTag, done: true });
      if (!def.spans) {
        // Spans are disabled so render the quoted text verbatim.
        quoted = Utils.replaceSpecialChars(quoted);
        quoted = quoted.replace(/\u0000/g, "\u0001"); // Flag replacements as verbatim.
        result.push({ text: quoted, done: true });
      } else {
        // Recursively process the quoted text.
        result.push.apply(result, fragQuote({ text: quoted, done: false }));
      }
      result.push({ text: def.closeTag, done: true });
      // Recursively process the following text.
      result.push.apply(result, fragQuote({ text: after, done: false }));
      return result;
    }
    // Return text with replacements replaced with a placeholder character (see `postReplacements()`):
    // '\u0000' is placeholder for expanded replacement text.
    // '\u0001' is placeholder for unexpanded replacement text (replacements that occur within quotes are rendered verbatim).
    function preReplacements(text) {
      savedReplacements = [];
      let fragments = fragReplacements([{ text: text, done: false }]);
      // Reassemble text with replacement placeholders.
      return fragments.reduce((result, fragment) => {
        if (fragment.done) {
          savedReplacements.push(fragment); // Save replaced text.
          return result + "\u0000"; // Placeholder for replaced text.
        } else {
          return result + fragment.text;
        }
      }, "");
    }
    // Replace replacements placeholders with replacements text from savedReplacements[].
    function postReplacements(text) {
      return text.replace(/[\u0000\u0001]/g, function (match) {
        let fragment = savedReplacements.shift();
        return (match === "\u0000")
          ? fragment.text
          : Utils.replaceSpecialChars(fragment.verbatim);
      });
    }
    // Fragment replacements in all fragments and return resulting fragments array.
    function fragReplacements(fragments) {
      let result;
      Replacements.defs.forEach((def) => {
        result = [];
        fragments.forEach((fragment) => {
          result.push.apply(result, fragReplacement(fragment, def));
        });
        fragments = result;
      });
      return fragments;
    }
    // Fragment replacements in a single fragment for a single replacement definition.
    // Return resulting fragments array.
    function fragReplacement(fragment, def) {
      if (fragment.done) {
        return [fragment];
      }
      let replacementRe = def.match;
      let match;
      replacementRe.lastIndex = 0;
      match = replacementRe.exec(fragment.text);
      if (!match) {
        return [fragment];
      }
      let result = [];
      // Arrive here if we have a matched replacement.
      // The replacement splits the input fragment into 3 output fragments:
      // Text before the replacement, replaced text and text after the replacement.
      // NOTE: Because this function is called recursively must ensure mutable index and
      //       lastIndex properties are read before the recursive call.
      let before = match.input.slice(0, match.index);
      let after = match.input.slice(replacementRe.lastIndex);
      result.push({ text: before, done: false });
      let replacement;
      if (match[0][0] === "\\") {
        // Remove leading backslash.
        replacement = Utils.replaceSpecialChars(match[0].slice(1));
      } else {
        if (!def.filter) {
          replacement = Utils.replaceMatch(match, def.replacement);
        } else {
          replacement = def.filter(match);
        }
      }
      result.push({ text: replacement, done: true, verbatim: match[0] });
      // Recursively process the remaining text.
      result.push.apply(
        result,
        fragReplacement({ text: after, done: false }, def),
      );
      return result;
    }
    function fragSpecials(fragments) {
      // Replace special characters in all non-done fragments.
      fragments
        .filter((fragment) => !fragment.done)
        .forEach((fragment) =>
          fragment.text = Utils.replaceSpecialChars(fragment.text)
        );
    }
    return {
      setters: [
        function (Quotes_1) {
          Quotes = Quotes_1;
        },
        function (Replacements_1) {
          Replacements = Replacements_1;
        },
        function (Utils_3) {
          Utils = Utils_3;
        },
      ],
      execute: function () {
      },
    };
  },
);
System.register(
  "utils",
  ["delimitedblocks", "macros", "options", "spans"],
  function (exports_5, context_5) {
    "use strict";
    var DelimitedBlocks, Macros, Options, Spans, BlockAttributes;
    var __moduleName = context_5 && context_5.id;
    // http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function escapeRegExp(s) {
      return s.replace(/[\-\/\\^$*+?.()|\[\]{}]/g, "\\$&");
    }
    exports_5("escapeRegExp", escapeRegExp);
    function replaceSpecialChars(s) {
      return s.replace(/&/g, "&amp;")
        .replace(/>/g, "&gt;")
        .replace(/</g, "&lt;");
    }
    exports_5("replaceSpecialChars", replaceSpecialChars);
    // Replace pattern '$1' or '$$1', '$2' or '$$2'... in `replacement` with corresponding match groups
    // from `match`. If pattern starts with one '$' character add specials to `expansionOptions`,
    // if it starts with two '$' characters add spans to `expansionOptions`.
    function replaceMatch(match, replacement, expansionOptions = {}) {
      return replacement.replace(/(\${1,2})(\d)/g, function () {
        // Replace $1, $2 ... with corresponding match groups.
        if (arguments[1] === "$$") {
          expansionOptions.spans = true;
        } else {
          expansionOptions.specials = true;
        }
        let i = Number(arguments[2]); // match group number.
        let result = match[i]; // match group text.
        if (result === undefined) {
          Options.errorCallback("undefined replacement group: " + arguments[0]);
          return "";
        }
        return replaceInline(result, expansionOptions);
      });
    }
    exports_5("replaceMatch", replaceMatch);
    // Shallow object clone.
    function copy(source) {
      let result = {};
      for (let key in source) {
        if (source.hasOwnProperty(key)) {
          result[key] = source[key];
        }
      }
      return result;
    }
    exports_5("copy", copy);
    // Copy properties in source object to target object.
    function merge(target, source) {
      for (let key in source) {
        target[key] = source[key];
      }
    }
    exports_5("merge", merge);
    // Replace the inline elements specified in options in text and return the result.
    function replaceInline(text, expansionOptions) {
      if (expansionOptions.macros) {
        text = Macros.render(text);
      }
      // Spans also expand special characters.
      if (expansionOptions.spans) {
        text = Spans.render(text);
      } else if (expansionOptions.specials) {
        text = replaceSpecialChars(text);
      }
      return text;
    }
    exports_5("replaceInline", replaceInline);
    return {
      setters: [
        function (DelimitedBlocks_1) {
          DelimitedBlocks = DelimitedBlocks_1;
        },
        function (Macros_1) {
          Macros = Macros_1;
        },
        function (Options_2) {
          Options = Options_2;
        },
        function (Spans_1) {
          Spans = Spans_1;
        },
      ],
      execute: function () {
        // Global Block Attributes state (namespace "singleton", see http://stackoverflow.com/a/30174360).
        (function (BlockAttributes) {
          let ids // List of allocated HTML ids.
          ;
          function init() {
            BlockAttributes.classes = "";
            BlockAttributes.id = "";
            BlockAttributes.css = "";
            BlockAttributes.attributes = "";
            BlockAttributes.options = {};
            ids = [];
          }
          BlockAttributes.init = init;
          function parse(match) {
            // Parse Block Attributes.
            // class names = $1, id = $2, css-properties = $3, html-attributes = $4, block-options = $5
            let text = match[0];
            text = replaceInline(text, { macros: true });
            let m =
              /^\\?\.((?:\s*[a-zA-Z][\w\-]*)+)*(?:\s*)?(#[a-zA-Z][\w\-]*\s*)?(?:\s*)?(?:"(.+?)")?(?:\s*)?(\[.+])?(?:\s*)?([+-][ \w+-]+)?$/
                .exec(text);
            if (!m) {
              return false;
            }
            if (!Options.skipBlockAttributes()) {
              if (m[1]) { // HTML element class names.
                BlockAttributes.classes += " " + m[1].trim();
                BlockAttributes.classes = BlockAttributes.classes.trim();
              }
              if (m[2]) { // HTML element id.
                BlockAttributes.id = m[2].trim().slice(1);
              }
              if (m[3]) { // CSS properties.
                if (
                  BlockAttributes.css && BlockAttributes.css.substr(-1) !== ";"
                ) {
                  BlockAttributes.css += ";";
                }
                BlockAttributes.css += " " + m[3].trim();
                BlockAttributes.css = BlockAttributes.css.trim();
              }
              if (m[4] && !Options.isSafeModeNz()) { // HTML attributes.
                BlockAttributes.attributes += " " +
                  m[4].slice(1, m[4].length - 1).trim();
                BlockAttributes.attributes = BlockAttributes.attributes.trim();
              }
              DelimitedBlocks.setBlockOptions(BlockAttributes.options, m[5]);
            }
            return true;
          }
          BlockAttributes.parse = parse;
          // Inject HTML attributes from attrs into the opening tag.
          // Consume HTML attributes unless the 'tag' argument is blank.
          function inject(tag, consume = true) {
            if (!tag) {
              return tag;
            }
            let attrs = "";
            if (BlockAttributes.classes) {
              let re = /^(<[^>]*class=")(.*?)"/i;
              if (re.test(tag)) {
                // Inject class names into first existing class attribute in first tag.
                tag = tag.replace(re, `$1${BlockAttributes.classes} $2"`);
              } else {
                attrs = `class="${BlockAttributes.classes}"`;
              }
            }
            if (BlockAttributes.id) {
              BlockAttributes.id = BlockAttributes.id.toLowerCase();
              let has_id = /^<[^<]*id=".*?"/i.test(tag);
              if (has_id || ids.indexOf(BlockAttributes.id) > -1) {
                Options.errorCallback(
                  `duplicate 'id' attribute: ${BlockAttributes.id}`,
                );
              } else {
                ids.push(BlockAttributes.id);
              }
              if (!has_id) {
                attrs += ` id="${BlockAttributes.id}"`;
              }
            }
            if (BlockAttributes.css) {
              let re = /^(<[^>]*style=")(.*?)"/i;
              if (re.test(tag)) {
                // Inject CSS styles into first existing style attribute in first tag.
                tag = tag.replace(re, function (match, p1, p2) {
                  p2 = p2.trim();
                  if (p2 && p2.substr(-1) !== ";") {
                    p2 += ";";
                  }
                  return `${p1}${p2} ${BlockAttributes.css}"`;
                });
              } else {
                attrs += ` style="${BlockAttributes.css}"`;
              }
            }
            if (BlockAttributes.attributes) {
              attrs += " " + BlockAttributes.attributes;
            }
            attrs = attrs.trim();
            if (attrs) {
              let match = tag.match(/^<([a-zA-Z]+|h[1-6])(?=[ >])/);
              if (match) {
                let before = tag.slice(0, match[0].length);
                let after = tag.slice(match[0].length);
                tag = before + " " + attrs + after;
              }
            }
            // Consume the attributes.
            if (consume) {
              BlockAttributes.classes = "";
              BlockAttributes.id = "";
              BlockAttributes.css = "";
              BlockAttributes.attributes = "";
            }
            return tag;
          }
          BlockAttributes.inject = inject;
          function slugify(text) {
            let slug = text.replace(/\W+/g, "-") // Replace non-alphanumeric characters with dashes.
              .replace(/-+/g, "-") // Replace multiple dashes with single dash.
              .replace(/(^-)|(-$)/g, "") // Trim leading and trailing dashes.
              .toLowerCase();
            if (!slug) {
              slug = "x";
            }
            if (ids.indexOf(slug) > -1) { // Another element already has that id.
              let i = 2;
              while (ids.indexOf(slug + "-" + i) > -1) {
                i++;
              }
              slug += "-" + i;
            }
            return slug;
          }
          BlockAttributes.slugify = slugify;
        })(BlockAttributes || (BlockAttributes = {}));
        exports_5("BlockAttributes", BlockAttributes);
      },
    };
  },
);
System.register("options", ["api", "utils"], function (exports_6, context_6) {
  "use strict";
  var Api, Utils, safeMode, htmlReplacement, callback;
  var __moduleName = context_6 && context_6.id;
  // Reset options to default values.
  function init() {
    safeMode = 0;
    htmlReplacement = "<mark>replaced HTML</mark>";
    callback = undefined;
  }
  exports_6("init", init);
  // Return true if safeMode is non-zero.
  function isSafeModeNz() {
    return safeMode !== 0;
  }
  exports_6("isSafeModeNz", isSafeModeNz);
  function getSafeMode() {
    return safeMode;
  }
  exports_6("getSafeMode", getSafeMode);
  // Return true if Macro Definitions are ignored.
  function skipMacroDefs() {
    /* tslint:disable:no-bitwise */
    return safeMode !== 0 && (safeMode & 0x8) === 0;
    /* tslint:enable:no-bitwise */
  }
  exports_6("skipMacroDefs", skipMacroDefs);
  // Return true if Block Attribute elements are ignored.
  function skipBlockAttributes() {
    /* tslint:disable:no-bitwise */
    return (safeMode & 0x4) !== 0;
    /* tslint:enable:no-bitwise */
  }
  exports_6("skipBlockAttributes", skipBlockAttributes);
  function setSafeMode(value) {
    let n = Number(value);
    if (isNaN(n) || n < 0 || n > 15) {
      errorCallback("illegal safeMode API option value: " + value);
      return;
    }
    safeMode = n;
  }
  function setHtmlReplacement(value) {
    if (value === undefined) {
      return;
    }
    htmlReplacement = value;
  }
  function setReset(value) {
    if (value === false || value === "false") {
      return;
    } else if (value === true || value === "true") {
      Api.init();
    } else {
      errorCallback("illegal reset API option value: " + value);
    }
  }
  function updateOptions(options) {
    for (let key in options) {
      switch (key) {
        case "reset":
        case "safeMode":
        case "htmlReplacement":
        case "callback":
          break;
        default:
          errorCallback("illegal API option name: " + key);
          return;
      }
    }
    if ("callback" in options) {
      callback = options.callback; // Install callback first to ensure option errors are logged.
    }
    if ("reset" in options) {
      setReset(options.reset); // Reset takes priority.
    }
    if ("callback" in options) {
      callback = options.callback; // Install callback again in case it has been reset.
    }
    if ("safeMode" in options) {
      setSafeMode(options.safeMode);
    }
    if ("htmlReplacement" in options) {
      setHtmlReplacement(options.htmlReplacement);
    }
  }
  exports_6("updateOptions", updateOptions);
  // Set named option value.
  function setOption(name, value) {
    let option = {};
    option[name] = value;
    updateOptions(option);
  }
  exports_6("setOption", setOption);
  // Filter HTML based on current safeMode.
  function htmlSafeModeFilter(html) {
    /* tslint:disable:no-bitwise */
    switch (safeMode & 0x3) {
      /* tslint:enable:no-bitwise */
      case 0: // Raw HTML (default behavior).
        return html;
      case 1: // Drop HTML.
        return "";
      case 2: // Replace HTML with 'htmlReplacement' option string.
        return htmlReplacement;
      case 3: // Render HTML as text.
        return Utils.replaceSpecialChars(html);
      default:
        return "";
    }
  }
  exports_6("htmlSafeModeFilter", htmlSafeModeFilter);
  function errorCallback(message) {
    if (callback) {
      callback({ type: "error", text: message });
    }
  }
  exports_6("errorCallback", errorCallback);
  // Called when an unexpected program error occurs.
  function panic(message) {
    let msg = "panic: " + message;
    console.error(msg);
    errorCallback(msg);
  }
  exports_6("panic", panic);
  return {
    setters: [
      function (Api_1) {
        Api = Api_1;
      },
      function (Utils_4) {
        Utils = Utils_4;
      },
    ],
    execute: function () {
    },
  };
});
System.register(
  "macros",
  ["options", "spans"],
  function (exports_7, context_7) {
    "use strict";
    var Options,
      Spans,
      MATCH_LINE,
      LINE_DEF,
      LITERAL_DEF_OPEN,
      LITERAL_DEF_CLOSE,
      EXPRESSION_DEF_OPEN,
      EXPRESSION_DEF_CLOSE,
      defs;
    var __moduleName = context_7 && context_7.id;
    // Reset definitions to defaults.
    function init() {
      // Initialize predefined macros.
      exports_7(
        "defs",
        defs = [
          { name: "--", value: "" },
          { name: "--header-ids", value: "" },
        ],
      );
    }
    exports_7("init", init);
    // Return named macro value or null if it doesn't exist.
    function getValue(name) {
      for (let def of defs) {
        if (def.name === name) {
          return def.value;
        }
      }
      return null;
    }
    exports_7("getValue", getValue);
    // Set named macro value or add it if it doesn't exist.
    // If the name ends with '?' then don't set the macro if it already exists.
    // `quote` is a single character: ' if a literal value, ` if an expression value.
    function setValue(name, value, quote) {
      if (Options.skipMacroDefs()) {
        return; // Skip if a safe mode is set.
      }
      let existential = false;
      if (name.slice(-1) === "?") {
        name = name.slice(0, -1);
        existential = true;
      }
      if (name === "--" && value !== "") {
        Options.errorCallback(
          "the predefined blank '--' macro cannot be redefined",
        );
        return;
      }
      if (quote === "`") {
        try {
          value = eval(value); // tslint:disable-line no-eval
        } catch (e) {
          Options.errorCallback(
            `illegal macro expression: ${e.message}: ${value}`,
          );
        }
      }
      for (let def of defs) {
        if (def.name === name) {
          if (!existential) {
            def.value = value;
          }
          return;
        }
      }
      defs.push({ name: name, value: value });
    }
    exports_7("setValue", setValue);
    // Render macro invocations in text string.
    // Render Simple invocations first, followed by Parametized, Inclusion and Exclusion invocations.
    function render(text, silent = false) {
      const MATCH_COMPLEX = /\\?{([\w\-]+)([!=|?](?:|[^]*?[^\\]))}/g; // Parametrized, Inclusion and Exclusion invocations.
      const MATCH_SIMPLE = /\\?{([\w\-]+)()}/g; // Simple macro invocation.
      let result = text;
      [MATCH_SIMPLE, MATCH_COMPLEX].forEach((find) => {
        result = result.replace(find, function (match, ...submatches) {
          if (match[0] === "\\") {
            return match.slice(1);
          }
          let name = submatches[0];
          let params = submatches[1] || "";
          if (params[0] === "?") { // DEPRECATED: Existential macro invocation.
            if (!silent) {
              Options.errorCallback(
                "existential macro invocations are deprecated: " + match,
              );
            }
            return match;
          }
          let value = getValue(name); // Macro value is null if macro is undefined.
          if (value === null) {
            if (!silent) {
              Options.errorCallback("undefined macro: " + match + ": " + text);
            }
            return match;
          }
          if (find === MATCH_SIMPLE) {
            return value;
          }
          params = params.replace(/\\}/g, "}"); // Unescape escaped } characters.
          switch (params[0]) {
            case "|": // Parametrized macro.
              let paramsList = params.slice(1).split("|");
              // Substitute macro parameters.
              // Matches macro definition formal parameters [$]$<param-number>[[\]:<default-param-value>$]
              // [$]$ = 1st match group; <param-number> (1, 2..) = 2nd match group;
              // :[\]<default-param-value>$ = 3rd match group; <default-param-value> = 4th match group.
              const PARAM_RE = /\\?(\$\$?)(\d+)(\\?:(|[^]*?[^\\])\$)?/g;
              value = (value || "").replace(
                PARAM_RE,
                function (match, p1, p2, p3, p4) {
                  if (match[0] === "\\") { // Unescape escaped macro parameters.
                    return match.slice(1);
                  }
                  if (Number(p2) === 0) {
                    return match; // $0 is not a valid parameter name.
                  }
                  let param = paramsList[Number(p2) - 1];
                  param = param === undefined ? "" : param; // Unassigned parameters are replaced with a blank string.
                  if (p3 !== undefined) {
                    if (p3[0] === "\\") { // Unescape escaped default parameter.
                      param += p3.slice(1);
                    } else {
                      if (param === "") {
                        param = p4; // Assign default parameter value.
                        param = param.replace(/\\\$/g, "$"); // Unescape escaped $ characters in the default value.
                      }
                    }
                  }
                  if (p1 === "$$") {
                    param = Spans.render(param);
                  }
                  return param;
                },
              );
              return value;
            case "!": // Exclusion macro.
            case "=": // Inclusion macro.
              let pattern = params.slice(1);
              let skip = false;
              try {
                skip = !RegExp("^" + pattern + "$").test(value || "");
              } catch {
                if (!silent) {
                  Options.errorCallback(
                    "illegal macro regular expression: " + pattern + ": " +
                      text,
                  );
                }
                return match;
              }
              if (params[0] === "!") {
                skip = !skip;
              }
              return skip ? "\u0002" : ""; // Flag line for deletion.
            default:
              Options.errorCallback("illegal macro syntax: " + match[0]);
              return "";
          }
        });
      });
      // Delete lines flagged by Inclusion/Exclusion macros.
      if (result.indexOf("\u0002") !== -1) {
        result = result.split("\n")
          .filter((line) => line.indexOf("\u0002") === -1)
          .join("\n");
      }
      return result;
    }
    exports_7("render", render);
    return {
      setters: [
        function (Options_3) {
          Options = Options_3;
        },
        function (Spans_2) {
          Spans = Spans_2;
        },
      ],
      execute: function () {
        // Matches a line starting with a macro invocation. $1 = macro invocation.
        exports_7(
          "MATCH_LINE",
          MATCH_LINE = /^({(?:[\w\-]+)(?:[!=|?](?:|.*?[^\\]))?}).*$/,
        );
        // Match single-line macro definition. $1 = name, $2 = delimiter, $3 = value.
        exports_7(
          "LINE_DEF",
          LINE_DEF = /^\\?{([\w\-]+\??)}\s*=\s*(['`])(.*)\2$/,
        );
        // Match multi-line macro definition literal value open delimiter. $1 is first line of macro.
        exports_7(
          "LITERAL_DEF_OPEN",
          LITERAL_DEF_OPEN = /^\\?{[\w\-]+\??}\s*=\s*'(.*)$/,
        );
        exports_7("LITERAL_DEF_CLOSE", LITERAL_DEF_CLOSE = /^(.*)'$/);
        // Match multi-line macro definition expression value open delimiter. $1 is first line of macro.
        exports_7(
          "EXPRESSION_DEF_OPEN",
          EXPRESSION_DEF_OPEN = /^\\?{[\w\-]+\??}\s*=\s*`(.*)$/,
        );
        exports_7("EXPRESSION_DEF_CLOSE", EXPRESSION_DEF_CLOSE = /^(.*)`$/);
        exports_7("defs", defs = []);
      },
    };
  },
);
System.register(
  "delimitedblocks",
  ["api", "macros", "options", "utils"],
  function (exports_8, context_8) {
    "use strict";
    var Api,
      Macros,
      Options,
      Utils,
      utils_ts_1,
      MATCH_INLINE_TAG,
      defs,
      DEFAULT_DEFS;
    var __moduleName = context_8 && context_8.id;
    // Reset definitions to defaults.
    function init() {
      exports_8("defs", defs = DEFAULT_DEFS.map((def) => Utils.copy(def)));
      // Copy definition object fields.
      defs.forEach((def, i) =>
        def.expansionOptions = Utils.copy(DEFAULT_DEFS[i].expansionOptions)
      );
    }
    exports_8("init", init);
    // If the next element in the reader is a valid delimited block render it
    // and return true, else return false.
    function render(reader, writer, allowed = []) {
      if (reader.eof()) {
        Options.panic("premature eof");
      }
      for (let def of defs) {
        if (
          allowed.length > 0 &&
          allowed.indexOf(def.name ? def.name : "") === -1
        ) {
          continue;
        }
        let match = reader.cursor.match(def.openMatch);
        if (match) {
          // Escape non-paragraphs.
          if (match[0][0] === "\\" && def.name !== "paragraph") {
            // Drop backslash escape and continue.
            reader.cursor = reader.cursor.slice(1);
            continue;
          }
          if (def.verify && !def.verify(match)) {
            continue;
          }
          // Process opening delimiter.
          let delimiterText = def.delimiterFilter ? def.delimiterFilter(match)
          : "";
          // Read block content into lines.
          let lines = [];
          if (delimiterText) {
            lines.push(delimiterText);
          }
          // Read content up to the closing delimiter.
          reader.next();
          let content = reader.readTo(def.closeMatch);
          if (content === null) {
            Options.errorCallback("unterminated delimited block: " + match[0]);
          }
          if (content) {
            lines = [...lines, ...content];
          }
          // Calculate block expansion options.
          let expansionOptions = {
            macros: false,
            spans: false,
            specials: false,
            container: false,
            skip: false,
          };
          Utils.merge(expansionOptions, def.expansionOptions);
          Utils.merge(expansionOptions, utils_ts_1.BlockAttributes.options);
          // Translate block.
          if (!expansionOptions.skip) {
            let text = lines.join("\n");
            if (def.contentFilter) {
              text = def.contentFilter(text, match, expansionOptions);
            }
            let opentag = def.openTag;
            if (def.name === "html") {
              text = utils_ts_1.BlockAttributes.inject(text);
            } else {
              opentag = utils_ts_1.BlockAttributes.inject(opentag);
            }
            if (expansionOptions.container) {
              delete utils_ts_1.BlockAttributes.options.container; // Consume before recursion.
              text = Api.render(text);
            } else {
              text = Utils.replaceInline(text, expansionOptions);
            }
            let closetag = def.closeTag;
            if (def.name === "division" && opentag === "<div>") {
              // Drop div tags if the opening div has no attributes.
              opentag = "";
              closetag = "";
            }
            writer.write(opentag);
            writer.write(text);
            writer.write(closetag);
            if ((opentag || text || closetag) && !reader.eof()) {
              // Add a trailing '\n' if we've written a non-blank line and there are more source lines left.
              writer.write("\n");
            }
          }
          // Reset consumed Block Attributes expansion options.
          utils_ts_1.BlockAttributes.options = {};
          return true;
        }
      }
      return false; // No matching delimited block found.
    }
    exports_8("render", render);
    // Return block definition or undefined if not found.
    function getDefinition(name) {
      return defs.filter((def) => def.name === name)[0];
    }
    exports_8("getDefinition", getDefinition);
    // Parse block-options string into blockOptions.
    function setBlockOptions(blockOptions, optionsString) {
      if (optionsString) {
        let opts = optionsString.trim().split(/\s+/);
        for (let opt of opts) {
          if (Options.isSafeModeNz() && opt === "-specials") {
            Options.errorCallback(
              "-specials block option not valid in safeMode",
            );
            continue;
          }
          if (/^[+-](macros|spans|specials|container|skip)$/.test(opt)) {
            blockOptions[opt.slice(1)] = opt[0] === "+";
          } else {
            Options.errorCallback("illegal block option: " + opt);
          }
        }
      }
    }
    exports_8("setBlockOptions", setBlockOptions);
    // Update existing named definition.
    // Value syntax: <open-tag>|<close-tag> block-options
    function setDefinition(name, value) {
      let def = getDefinition(name);
      if (!def) {
        Options.errorCallback(
          "illegal delimited block name: " + name + ": |" + name + "|='" +
            value +
            "'",
        );
        return;
      }
      let match = value.trim().match(
        /^(?:(<[a-zA-Z].*>)\|(<[a-zA-Z/].*>))?(?:\s*)?([+-][ \w+-]+)?$/,
      );
      if (match === null) {
        Options.errorCallback(
          "illegal delimited block definition: |" + name + "|='" + value + "'",
        );
        return;
      }
      if (match[1]) {
        def.openTag = match[1];
        def.closeTag = match[2];
      }
      if (match[3]) {
        setBlockOptions(def.expansionOptions, match[3]);
      }
    }
    exports_8("setDefinition", setDefinition);
    // delimiterFilter that returns opening delimiter line text from match group $1.
    function delimiterTextFilter(match) {
      return match[1];
    }
    // delimiterFilter for code, division and quote blocks.
    // Inject $2 into block class attribute, set close delimiter to $1.
    function classInjectionFilter(match) {
      if (match[2]) {
        let p1;
        if ((p1 = match[2].trim())) {
          utils_ts_1.BlockAttributes.classes = p1;
        }
      }
      this.closeMatch = RegExp("^" + Utils.escapeRegExp(match[1]) + "$");
      return "";
    }
    // contentFilter for multi-line macro definitions.
    function macroDefContentFilter(text, match, expansionOptions) {
      let quote = match[0][match[0].length - match[1].length - 1]; // The leading macro value quote character.
      let name = match[0].match(/^{([\w\-]+\??)}/)[1]; // Extract macro name from opening delimiter.
      text = text.replace(RegExp("(" + quote + ") *\\\\\\n", "g"), "$1\n"); // Unescape line-continuations.
      text = text.replace(
        RegExp("(" + quote + " *[\\\\]+)\\\\\\n", "g"),
        "$1\n",
      ); // Unescape escaped line-continuations.
      text = Utils.replaceInline(text, expansionOptions); // Expand macro invocations.
      Macros.setValue(name, text, quote);
      return "";
    }
    return {
      setters: [
        function (Api_2) {
          Api = Api_2;
        },
        function (Macros_2) {
          Macros = Macros_2;
        },
        function (Options_4) {
          Options = Options_4;
        },
        function (Utils_5) {
          Utils = Utils_5;
          utils_ts_1 = Utils_5;
        },
      ],
      execute: function () {
        /* tslint:disable:max-line-length */
        MATCH_INLINE_TAG =
          /^(a|abbr|acronym|address|b|bdi|bdo|big|blockquote|br|cite|code|del|dfn|em|i|img|ins|kbd|mark|q|s|samp|small|span|strike|strong|sub|sup|time|tt|u|var|wbr)$/i;
        DEFAULT_DEFS = [
          // Delimited blocks cannot be escaped with a backslash.
          // Multi-line macro literal value definition.
          {
            openMatch: Macros.LITERAL_DEF_OPEN,
            closeMatch: Macros.LITERAL_DEF_CLOSE,
            openTag: "",
            closeTag: "",
            expansionOptions: {
              macros: true,
            },
            delimiterFilter: delimiterTextFilter,
            contentFilter: macroDefContentFilter,
          },
          // Multi-line macro expression value definition.
          // DEPRECATED as of 11.0.0.
          {
            openMatch: Macros.EXPRESSION_DEF_OPEN,
            closeMatch: Macros.EXPRESSION_DEF_CLOSE,
            openTag: "",
            closeTag: "",
            expansionOptions: {
              macros: true,
            },
            delimiterFilter: delimiterTextFilter,
            contentFilter: macroDefContentFilter,
          },
          // Comment block.
          {
            name: "comment",
            openMatch: /^\\?\/\*+$/,
            closeMatch: /^\*+\/$/,
            openTag: "",
            closeTag: "",
            expansionOptions: {
              skip: true,
              specials: true,
            },
          },
          // Division block.
          {
            name: "division",
            openMatch: /^\\?(\.{2,})([\w\s-]*)$/,
            openTag: "<div>",
            closeTag: "</div>",
            expansionOptions: {
              container: true,
              specials: true,
            },
            delimiterFilter: classInjectionFilter,
          },
          // Quote block.
          {
            name: "quote",
            openMatch: /^\\?("{2,})([\w\s-]*)$/,
            openTag: "<blockquote>",
            closeTag: "</blockquote>",
            expansionOptions: {
              container: true,
              specials: true,
            },
            delimiterFilter: classInjectionFilter,
          },
          // Code block.
          {
            name: "code",
            openMatch: /^\\?(-{2,}|`{2,})([\w\s-]*)$/,
            openTag: "<pre><code>",
            closeTag: "</code></pre>",
            expansionOptions: {
              macros: false,
              specials: true,
            },
            verify: function (match) {
              // The deprecated '-' delimiter does not support appended class names.
              return !(match[1][0] === "-" && match[2].trim() !== "");
            },
            delimiterFilter: classInjectionFilter,
          },
          // HTML block.
          {
            name: "html",
            // Block starts with HTML comment, DOCTYPE directive or block-level HTML start or end tag.
            // $1 is first line of block.
            // $2 is the alphanumeric tag name.
            openMatch:
              /^(<!--.*|<!DOCTYPE(?:\s.*)?|<\/?([a-z][a-z0-9]*)(?:[\s>].*)?)$/i,
            closeMatch: /^$/,
            openTag: "",
            closeTag: "",
            expansionOptions: {
              macros: true,
            },
            verify: function (match) {
              // Return false if the HTML tag is an inline (non-block) HTML tag.
              if (match[2]) { // Matched alphanumeric tag name.
                return !MATCH_INLINE_TAG.test(match[2]);
              } else {
                return true; // Matched HTML comment or doctype tag.
              }
            },
            delimiterFilter: delimiterTextFilter,
            contentFilter: Options.htmlSafeModeFilter,
          },
          // Indented paragraph.
          {
            name: "indented",
            openMatch: /^\\?(\s+\S.*)$/,
            closeMatch: /^$/,
            openTag: "<pre><code>",
            closeTag: "</code></pre>",
            expansionOptions: {
              macros: false,
              specials: true,
            },
            delimiterFilter: delimiterTextFilter,
            contentFilter: function (text) {
              // Strip indent from start of each line.
              let first_indent = text.search(/\S/);
              return text.split("\n")
                .map((line) => {
                  // Strip first line indent width or up to first non-space character.
                  let indent = line.search(/\S|$/);
                  if (indent > first_indent) {
                    indent = first_indent;
                  }
                  return line.slice(indent);
                })
                .join("\n");
            },
          },
          // Quote paragraph.
          {
            name: "quote-paragraph",
            openMatch: /^\\?(>.*)$/,
            closeMatch: /^$/,
            openTag: "<blockquote><p>",
            closeTag: "</p></blockquote>",
            expansionOptions: {
              macros: true,
              spans: true,
              specials: true,
            },
            delimiterFilter: delimiterTextFilter,
            contentFilter: function (text) {
              // Strip leading > from start of each line and unescape escaped leading >.
              return text.split("\n")
                .map((line) =>
                  line
                    .replace(/^>/, "")
                    .replace(/^\\>/, ">")
                )
                .join("\n");
            },
          },
          // Paragraph (lowest priority, cannot be escaped).
          {
            name: "paragraph",
            openMatch: /(.*)/,
            closeMatch: /^$/,
            openTag: "<p>",
            closeTag: "</p>",
            expansionOptions: {
              macros: true,
              spans: true,
              specials: true,
            },
            delimiterFilter: delimiterTextFilter,
          },
        ];
      },
    };
  },
);
System.register(
  "lineblocks",
  ["delimitedblocks", "macros", "options", "quotes", "replacements", "utils"],
  function (exports_9, context_9) {
    "use strict";
    var DelimitedBlocks,
      Macros,
      Options,
      Quotes,
      Replacements,
      Utils,
      utils_ts_2,
      defs;
    var __moduleName = context_9 && context_9.id;
    // If the next element in the reader is a valid line block render it
    // and return true, else return false.
    function render(reader, writer, allowed = []) {
      if (reader.eof()) {
        Options.panic("premature eof");
      }
      for (let def of defs) {
        if (
          allowed.length > 0 && allowed.indexOf(
              def.name
                ? def.name
                : "",
            ) === -1
        ) {
          continue;
        }
        let match = def.match.exec(reader.cursor);
        if (match) {
          if (match[0][0] === "\\") {
            // Drop backslash escape and continue.
            reader.cursor = reader.cursor.slice(1);
            continue;
          }
          if (def.verify && !def.verify(match, reader)) {
            continue;
          }
          let text;
          if (!def.filter) {
            text = def.replacement
              ? Utils.replaceMatch(match, def.replacement, { macros: true })
              : "";
          } else {
            text = def.filter(match, reader);
          }
          if (text) {
            text = utils_ts_2.BlockAttributes.inject(text);
            writer.write(text);
            reader.next();
            if (!reader.eof()) {
              writer.write("\n"); // Add a trailing '\n' if there are more lines.
            }
          } else {
            reader.next();
          }
          return true;
        }
      }
      return false;
    }
    exports_9("render", render);
    return {
      setters: [
        function (DelimitedBlocks_2) {
          DelimitedBlocks = DelimitedBlocks_2;
        },
        function (Macros_3) {
          Macros = Macros_3;
        },
        function (Options_5) {
          Options = Options_5;
        },
        function (Quotes_2) {
          Quotes = Quotes_2;
        },
        function (Replacements_2) {
          Replacements = Replacements_2;
        },
        function (Utils_6) {
          Utils = Utils_6;
          utils_ts_2 = Utils_6;
        },
      ],
      execute: function () {
        defs = [
          // Prefix match with backslash to allow escaping.
          // Comment line.
          {
            match: /^\\?\/{2}(.*)$/,
          },
          // Expand lines prefixed with a macro invocation prior to all other processing.
          // macro name = $1, macro value = $2
          {
            match: Macros.MATCH_LINE,
            verify: function (match, reader) {
              if (
                Macros.LITERAL_DEF_OPEN.test(match[0]) ||
                Macros.EXPRESSION_DEF_OPEN.test(match[0])
              ) {
                // Do not process macro definitions.
                return false;
              }
              // Silent because any macro expansion errors will be subsequently addressed downstream.
              let value = Macros.render(match[0], true);
              if (
                value.substr(0, match[0].length) === match[0] ||
                value.indexOf("\n" + match[0]) >= 0
              ) {
                // The leading macro invocation expansion failed or contains itself.
                // This stops infinite recursion.
                return false;
              }
              // Insert the macro value into the reader just ahead of the cursor.
              let spliceArgs = [
                reader.pos + 1,
                0,
                ...value.split("\n"),
              ];
              Array.prototype.splice.apply(reader.lines, spliceArgs);
              return true;
            },
            filter: function (match, reader) {
              return ""; // Already processed in the `verify` function.
            },
          },
          // Delimited Block definition.
          // name = $1, definition = $2
          {
            match: /^\\?\|([\w\-]+)\|\s*=\s*'(.*)'$/,
            filter: function (match) {
              if (Options.isSafeModeNz()) {
                return ""; // Skip if a safe mode is set.
              }
              match[2] = Utils.replaceInline(match[2], { macros: true });
              DelimitedBlocks.setDefinition(match[1], match[2]);
              return "";
            },
          },
          // Quote definition.
          // quote = $1, openTag = $2, separator = $3, closeTag = $4
          {
            match: /^(\S{1,2})\s*=\s*'([^|]*)(\|{1,2})(.*)'$/,
            filter: function (match) {
              if (Options.isSafeModeNz()) {
                return ""; // Skip if a safe mode is set.
              }
              Quotes.setDefinition({
                quote: match[1],
                openTag: Utils.replaceInline(match[2], { macros: true }),
                closeTag: Utils.replaceInline(match[4], { macros: true }),
                spans: match[3] === "|",
              });
              return "";
            },
          },
          // Replacement definition.
          // pattern = $1, flags = $2, replacement = $3
          {
            match: /^\\?\/(.+)\/([igm]*)\s*=\s*'(.*)'$/,
            filter: function (match) {
              if (Options.isSafeModeNz()) {
                return ""; // Skip if a safe mode is set.
              }
              let pattern = match[1];
              let flags = match[2];
              let replacement = match[3];
              replacement = Utils.replaceInline(replacement, { macros: true });
              Replacements.setDefinition(pattern, flags, replacement);
              return "";
            },
          },
          // Macro definition.
          // name = $1, value = $2
          {
            match: Macros.LINE_DEF,
            filter: function (match) {
              let name = match[1];
              let quote = match[2];
              let value = match[3];
              value = Utils.replaceInline(value, { macros: true });
              Macros.setValue(name, value, quote);
              return "";
            },
          },
          // Headers.
          // $1 is ID, $2 is header text.
          {
            match: /^\\?([#=]{1,6})\s+(.+?)(?:\s+\1)?$/,
            replacement: "<h$1>$$2</h$1>",
            filter: function (match) {
              match[1] = match[1].length.toString(); // Replace $1 with header number.
              if (
                Macros.getValue("--header-ids") &&
                utils_ts_2.BlockAttributes.id === ""
              ) {
                utils_ts_2.BlockAttributes.id = utils_ts_2.BlockAttributes
                  .slugify(match[2]);
              }
              return Utils.replaceMatch(
                match,
                this.replacement,
                { macros: true },
              );
            },
          },
          // Block image: <image:src|alt>
          // src = $1, alt = $2
          {
            match: /^\\?<image:([^\s|]+)\|([^]+?)>$/,
            replacement: '<img src="$1" alt="$2">',
          },
          // Block image: <image:src>
          // src = $1, alt = $1
          {
            match: /^\\?<image:([^\s|]+?)>$/,
            replacement: '<img src="$1" alt="$1">',
          },
          // DEPRECATED as of 3.4.0.
          // Block anchor: <<#id>>
          // id = $1
          {
            match: /^\\?<<#([a-zA-Z][\w\-]*)>>$/,
            replacement: '<div id="$1"></div>',
            filter: function (match, reader) {
              if (Options.skipBlockAttributes()) {
                return "";
              } else {
                // Default (non-filter) replacement processing.
                return Utils.replaceMatch(
                  match,
                  this.replacement,
                  { macros: true },
                );
              }
            },
          },
          // Block Attributes.
          // Syntax: .class-names #id [html-attributes] block-options
          {
            name: "attributes",
            match: /^\\?\.[a-zA-Z#"\[+-].*$/,
            verify: function (match) {
              return utils_ts_2.BlockAttributes.parse(match);
            },
          },
          // API Option.
          // name = $1, value = $2
          {
            match: /^\\?\.(\w+)\s*=\s*'(.*)'$/,
            filter: function (match) {
              if (!Options.isSafeModeNz()) {
                let value = Utils.replaceInline(match[2], { macros: true });
                Options.setOption(match[1], value);
              }
              return "";
            },
          },
        ];
      },
    };
  },
);
System.register(
  "lists",
  ["delimitedblocks", "io", "lineblocks", "options", "utils"],
  function (exports_10, context_10) {
    "use strict";
    var DelimitedBlocks, Io, LineBlocks, Options, Utils, utils_ts_3, defs, ids;
    var __moduleName = context_10 && context_10.id;
    function render(reader, writer) {
      if (reader.eof()) {
        Options.panic("premature eof");
      }
      let start_item;
      if (!(start_item = matchItem(reader))) {
        return false;
      }
      ids = [];
      renderList(start_item, reader, writer);
      // ids should now be empty.
      if (ids.length !== 0) {
        Options.panic("list stack failure");
      }
      return true;
    }
    exports_10("render", render);
    function renderList(item, reader, writer) {
      ids.push(item.id);
      writer.write(utils_ts_3.BlockAttributes.inject(item.def.listOpenTag));
      let next_item;
      while (true) {
        next_item = renderListItem(item, reader, writer);
        if (!next_item || next_item.id !== item.id) {
          // End of list or next item belongs to parent list.
          writer.write(item.def.listCloseTag);
          ids.pop();
          return next_item;
        }
        item = next_item;
      }
    }
    // Render the current list item, return the next list item or null if there are no more items.
    function renderListItem(item, reader, writer) {
      let def = item.def;
      let match = item.match;
      let text;
      if (match.length === 4) { // 3 match groups => definition list.
        writer.write(utils_ts_3.BlockAttributes.inject(def.termOpenTag, false));
        utils_ts_3.BlockAttributes.id = ""; // Only applied to term tag.
        text = Utils.replaceInline(match[1], { macros: true, spans: true });
        writer.write(text);
        writer.write(def.termCloseTag);
      }
      writer.write(utils_ts_3.BlockAttributes.inject(def.itemOpenTag));
      // Process item text from first line.
      let item_lines = new Io.Writer();
      text = match[match.length - 1];
      item_lines.write(text + "\n");
      // Process remainder of list item i.e. item text, optional attached block, optional child list.
      reader.next();
      let attached_lines = new Io.Writer();
      let blank_lines;
      let attached_done = false;
      let next_item;
      while (true) {
        blank_lines = consumeBlockAttributes(reader, attached_lines);
        if (blank_lines >= 2 || blank_lines === -1) {
          // EOF or two or more blank lines terminates list.
          next_item = null;
          break;
        }
        next_item = matchItem(reader);
        if (next_item) {
          if (ids.indexOf(next_item.id) !== -1) {
            // Next item belongs to current list or a parent list.
          } else {
            // Render child list.
            next_item = renderList(next_item, reader, attached_lines);
          }
          break;
        }
        if (attached_done) {
          break; // Multiple attached blocks are not permitted.
        }
        if (blank_lines === 0) {
          let savedIds = ids;
          ids = [];
          if (
            DelimitedBlocks.render(
              reader,
              attached_lines,
              ["comment", "code", "division", "html", "quote"],
            )
          ) {
            attached_done = true;
          } else {
            // Item body line.
            item_lines.write(reader.cursor + "\n");
            reader.next();
          }
          ids = savedIds;
        } else if (blank_lines === 1) {
          if (
            DelimitedBlocks.render(
              reader,
              attached_lines,
              ["indented", "quote-paragraph"],
            )
          ) {
            attached_done = true;
          } else {
            break;
          }
        }
      }
      // Write item text.
      text = item_lines.toString().trim();
      text = Utils.replaceInline(text, { macros: true, spans: true });
      writer.write(text);
      // Write attachment and child list.
      writer.buffer = [...writer.buffer, ...attached_lines.buffer];
      // Close list item.
      writer.write(def.itemCloseTag);
      return next_item;
    }
    // Consume blank lines and Block Attributes.
    // Return number of blank lines read or -1 if EOF.
    function consumeBlockAttributes(reader, writer) {
      let blanks = 0;
      while (true) {
        if (reader.eof()) {
          return -1;
        }
        if (LineBlocks.render(reader, writer, ["attributes"])) {
          continue;
        }
        if (reader.cursor !== "") {
          return blanks;
        }
        blanks++;
        reader.next();
      }
    }
    // Check if the line at the reader cursor matches a list related element.
    // Unescape escaped list items in reader.
    // If it does not match a list related element return null.
    function matchItem(reader) {
      // Check if the line matches a List definition.
      if (reader.eof()) {
        return null;
      }
      let item = {}; // ItemInfo factory.
      // Check if the line matches a list item.
      for (let def of defs) {
        let match = def.match.exec(reader.cursor);
        if (match) {
          if (match[0][0] === "\\") {
            reader.cursor = reader.cursor.slice(1); // Drop backslash.
            return null;
          }
          item.match = match;
          item.def = def;
          item.id = match[match.length - 2]; // The second to last match group is the list ID.
          return item;
        }
      }
      return null;
    }
    return {
      setters: [
        function (DelimitedBlocks_3) {
          DelimitedBlocks = DelimitedBlocks_3;
        },
        function (Io_1) {
          Io = Io_1;
        },
        function (LineBlocks_1) {
          LineBlocks = LineBlocks_1;
        },
        function (Options_6) {
          Options = Options_6;
        },
        function (Utils_7) {
          Utils = Utils_7;
          utils_ts_3 = Utils_7;
        },
      ],
      execute: function () {
        defs = [
          // Prefix match with backslash to allow escaping.
          // Unordered lists.
          // $1 is list ID $2 is item text.
          {
            match: /^\\?\s*(-|\+|\*{1,4})\s+(.*)$/,
            listOpenTag: "<ul>",
            listCloseTag: "</ul>",
            itemOpenTag: "<li>",
            itemCloseTag: "</li>",
          },
          // Ordered lists.
          // $1 is list ID $2 is item text.
          {
            match: /^\\?\s*(?:\d*)(\.{1,4})\s+(.*)$/,
            listOpenTag: "<ol>",
            listCloseTag: "</ol>",
            itemOpenTag: "<li>",
            itemCloseTag: "</li>",
          },
          // Definition lists.
          // $1 is term, $2 is list ID, $3 is definition.
          {
            match: /^\\?\s*(.*[^:])(:{2,4})(|\s+.*)$/,
            listOpenTag: "<dl>",
            listCloseTag: "</dl>",
            itemOpenTag: "<dd>",
            itemCloseTag: "</dd>",
            termOpenTag: "<dt>",
            termCloseTag: "</dt>",
          },
        ];
      },
    };
  },
);
System.register(
  "api",
  [
    "delimitedblocks",
    "io",
    "lineblocks",
    "lists",
    "macros",
    "options",
    "quotes",
    "replacements",
    "utils",
  ],
  function (exports_11, context_11) {
    "use strict";
    var DelimitedBlocks,
      Io,
      LineBlocks,
      Lists,
      Macros,
      Options,
      Quotes,
      Replacements,
      utils_ts_4;
    var __moduleName = context_11 && context_11.id;
    function render(source) {
      let reader = new Io.Reader(source);
      let writer = new Io.Writer();
      while (!reader.eof()) {
        reader.skipBlankLines();
        if (reader.eof()) {
          break;
        }
        if (LineBlocks.render(reader, writer)) {
          continue;
        }
        if (Lists.render(reader, writer)) {
          continue;
        }
        if (DelimitedBlocks.render(reader, writer)) {
          continue;
        }
        // This code should never be executed (normal paragraphs should match anything).
        Options.panic("no matching delimited block found");
      }
      return writer.toString();
    }
    exports_11("render", render);
    // Set API to default state.
    function init() {
      utils_ts_4.BlockAttributes.init();
      Options.init();
      DelimitedBlocks.init();
      Macros.init();
      Quotes.init();
      Replacements.init();
    }
    exports_11("init", init);
    return {
      setters: [
        function (DelimitedBlocks_4) {
          DelimitedBlocks = DelimitedBlocks_4;
        },
        function (Io_2) {
          Io = Io_2;
        },
        function (LineBlocks_2) {
          LineBlocks = LineBlocks_2;
        },
        function (Lists_1) {
          Lists = Lists_1;
        },
        function (Macros_4) {
          Macros = Macros_4;
        },
        function (Options_7) {
          Options = Options_7;
        },
        function (Quotes_3) {
          Quotes = Quotes_3;
        },
        function (Replacements_3) {
          Replacements = Replacements_3;
        },
        function (utils_ts_4_1) {
          utils_ts_4 = utils_ts_4_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
/*
 This is the main module, it exports the 'render' API.

 The compiled modules are bundled by Webpack into 'var' (script tag) and 'commonjs' (npm)
 formatted libraries.
 */
System.register("rimu", ["api", "options"], function (exports_12, context_12) {
  "use strict";
  var Api, Options;
  var __moduleName = context_12 && context_12.id;
  /*
      The single public API which translates Rimu Markup to HTML:
    
        render(source [, options])
     */
  function render(source, opts = {}) {
    Options.updateOptions(opts);
    return Api.render(source);
  }
  exports_12("render", render);
  return {
    setters: [
      function (Api_3) {
        Api = Api_3;
      },
      function (Options_8) {
        Options = Options_8;
      },
    ],
    execute: function () {
      // Load-time initialization.
      Api.init();
    },
  };
});

const __exp = __instantiate("rimu");
export const render = __exp["render"];
export const CallbackFunction = __exp["CallbackFunction"];
export const CallbackMessage = __exp["CallbackMessage"];
export const Options = __exp["Options"];
