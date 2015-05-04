# Rimu Markup CHANGELOG

See the [Git commit log](https://github.com/srackham/rimu/commits/)
for more detailed information.

## Version 4.0.0 (2015-05-05)
- Switched codebase from TypeScript internal modules to external (ES6) modules.
- Modules are bundled into JavaScript libraries using Webpack.
- The single `rimu.js` library has been replaced by two separate libraries:

    1. `rimu-var.js` for use in HTML _script_ tags.
    2. `rimu-commonjs2.js` in CommonJS (npm) format.

## Version 3.3 (2015-01-12)
More Markdown compatible syntaxes added to Rimu core
(these syntaxes were previously added using custom definitions):

- Links: `[caption](url)`.
- Images: `![alt](url)`.
- Bold text: `**bold**`.
- Strikethrough text: `~~strikethrough~~` (GitHub Flavored Markdown).

## Version 3.2 (2015-01-07)
- Auto-encode (most) raw HTTP URLs as links.
- Added Markdown compatible Quote Paragraphs (paragraphs starting with `>`
  rendered inside a `<blockquote>` HTML element).
- Added back-tick delimiter for code blocks - - back-tick is now the normative
  code block delimiter (the older dash delimiter is deprecated but will never
  be dropped). Back-tick rationale:

    1. Consistency: aligned with use of back-tick to quote inline code.
    2. Familarity: looks like a Github Flavored Markdown fenced code block.

## Version 3.0 (2013-10-28)
- Added _Delimited Block_ definitions.
- Enhanced and refined Macros.
- Many other enhancements, additions and documentation updates.
- _Indented Paragraphs_ and _Code Blocks_ no longer expand macro
  invocations by default. To reinstate old behavior use this delimited
  block definitions:

          |code| = '+macros'
          |indented| = '+macros'

- _Indented Paragraph_ emits same code as _Code Block_. To reinstate
  old behavior use this delimited block definition:

          |indented| = '<pre>|</pre>'

- Dropped the deprecated _+_ line-break, use the newer backslash
  line-break. To reinstate the old _+_ line-break use this replacement
  definition:

          /[\\ ]\+(\n|$)/g = '<br>$1'

## Version 2 (2013-07-26)
- Added Quote and Replacements definitions.
- A number of other enhancements, additions and documentation updates.

