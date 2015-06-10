# Rimu Markup CHANGELOG

See the [Git commit log](https://github.com/srackham/rimu/commits/)
for more detailed information.

## Version 5.1.0 (2015-06-??)
New features:

- You can append CSS class names to Delimited Block opening delimiter lines and they
  will be injected into the block's opening HTML tag (this is
  an alternative to using a _Block Attributes_ element and was
  added for compatibility with Github Flavored Markdown's code block highlighting).
  For example:

        ``` javascript
        if (message) {
          console.error('Error: ' + message);
        }
        ```
- Underscores within words rendered verbatim and are not treated as
  underscore emphasis quotes (Github Flavored Markdown behaviour).


## Version 5.0.0 (2015-06-07)
This version adds new API options, an _API Options_ element and more Markdown
compatibility. It also includes some breaking changes.

- Added `macroMode` API option to specify which macro invocations are processed.
- Added `reset` API option to reset the API to its default state.
- Added Markdown compatible double back-tick ````code quotes```` and double
  underline `__strong quotes__`.
- Added _API Option_ element to allow API options to be set in Rimu source.
- Bug fixes.
- Add `--macroMode` and `--htmlReplacement` options to `rimuc` command.
  The `--safe-mode` is renamed to `--safeMode` (`--safe-mode` still works but
  is deprecated).

Breaking changes:

- Changed default behavior of single-asterisk quote from strong to emphasis to align
  with Markdown. To reinstate old behavior use this quote definition: `* = '<strong>|</strong>'`.

- By default only defined and reserved macro invocations are expanded. Previously all macros
  were expanded which to often generated surprising results e.g. if the `text` macro
  was not explicitly defined then `${text}` would silently render `$`.
  To revert to the previous behaviour set the `macroMode` API option to `1`.

- Replacements are processed before quotes (previously they were processed after quotes).
  This is ensures quotes are not expanded inside URLs (notably underscores) and aligns
  with Markdown behaviour.
  If there are escaped quotes in URLs they will no longer be unescaped and you will need
  to remove them.

- The `render()` API only changes `options` that are explicitly specified.
  Previously, unspecified `options` were set to their default values which was
  surprising and potentially dangerous because it reset the `safeMode` to the default
  unsafe value of zero unless `safeMode` was explicitly specified otherwise.

- A backslash immediately preceding a closing _code_ quote is now rendered verbatim
  and does not escape the quote.


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
- Added backtick delimiter for code blocks - - backtick is now the normative
  code block delimiter (the older dash delimiter is deprecated but will never
  be dropped). backtick rationale:

    1. Consistency: aligned with use of backtick to quote inline code.
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

