# Rimu Markup CHANGELOG

See the [Git commit log](https://github.com/srackham/rimu/commits/)
for more detailed information.

## Version 4.0.1 (2015-05-06)
Documentation updates (no functional changes).

- Use Markdown links and headers syntax in documentation.
  Most users will already know and use Markdown so this makes Rimu
  example source more familar and easier to assimilate.

## Version 4.0.0 (2015-05-05)
- Switched codebase from Internal to External (ES6 compatible) module
  syntax.
- Modules are bundled into deployable JavaScript libraries using Webpack.
- The single `rimu.js` compiled library file has been replaced by two separate
  library files:

    1. `rimu-var.js` for use in HTML _script_ tags.
    2. `rimu-commonjs2.js` for use with CommonJS (Node.js) applications.

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
  invocations by default. To reinstate old behavior use these delimited
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

