# Rimu Markup CHANGELOG

See the [Git commit log](https://github.com/srackham/rimu/commits/)
for more detailed information.

## Version 6.0.0 (2015-07-27)
Misspelled macro invocations are insidious and easily overlooked.
The problem has finally been resolved with the introduction of an API callback
option that emits diagnostic messages (the misguided `macroMode` option introduced
in version 5.0.0 was mostly in response to this problem).

The rule for macro expansion is now very simple:
If a macro is not defined its invocation is rendered verbatim.
The `rimuc` command `--lint` option will emit an error if a macro is undefined
(to supress these warnings unescape the macro invocation).

- The examples in the Rimu Reference documentation are now live -- you can edit
  them by clicking the _Edit_ icon. The _live edit_ is implemented with the help
  of Rimu macros.

- Added `callback` API option. The `callback` function handles diagnostic events
  emitted by the `render` API as it parses the Rimu source. Diagnostic events
  include:
  * Undefined macro invocation.
  * Unterminated Delimited Block.
  * Illegal and invalid block options.
  * Illegal Delimited Block name.
  * Illegal API Option name.
  * Deprecated existential macro invocation.

- Added Existential macro definition syntax: `\{macro-name?} = 'macro-value'`
  Existential macro definitions are only processed if the macro has not been defined.
- `rimuc` passes the contents of files with an `.html` extension directly to the output.
  This allows `rimuc` to process HTML from other sources.
- The highlighting of broken fragments by `rimuc --styled` outputs has been removed
  -- it's in the wrong place, errors should be caught at compile-time and this feature
  will probably be added to a future version of the `rimuc` compiler.

Breaking changes:

- Existential macro invocations (`\{name?default}`) no longer supported. This is
  because it is now considered an error to invoke an undefined macro. Instead
  you should define default macro values using Existential macro definitions.
  Existential invocations are rendered verbatim and the `rimuc` `--lint`
  option emits a deprecation error.


## Version 5.4.0 (2015-06-28)
- Moved Rimu reference documentation from the _Rimu Playground_ into a
  separate updated _Reference_ manual.
- Restyled and simplified the _Playground_.
- Features added to the `rimuc` command `--styled` option (details in
  the new _Reference_ manual):
  * Now generates unique slug ids for top level `h1`, `h2` and `h3`
    headers irrespective of the `--toc` option (previously it was
    possible to generate non-unique slug ids).
  * It Highlights broken fragment URLs.


## Version 5.3.0 (2015-06-22)
Added `--title TITLE`, `--highlightjs`, `--mathjax`, `--toc`, `--section-numbers`
styling macro shortcut options to `rimuc`. The preceding example can now be
shortened to:

    rimuc --styled --toc README.md


## Version 5.2.0 (2015-06-20)
The `rimuc` command can now generate a table of contents: If the `--toc` macro is defined
and is not blank then the `rimuc` command `--styled` option generates a table of contents.
For example:

    rimuc --styled --prepend "{--toc}='yes'" README.md

Top-level `h1`, `h2` and `h3` HTML tags contribute to the table of contents.


## Version 5.1.0 (2015-06-13)
New features:

- You can append CSS class names to Delimited Block opening delimiter lines and they
  will be injected into the block's opening HTML tag (this is
  an alternative to using a _Block Attributes_ element and was
  added primarily for compatibility with Github Flavored Markdown's code block highlighting).
  For example:

        ``` javascript
        if (message) {
          console.error('Error: ' + message);
        }
        ```

- Underscores within words rendered verbatim and are not treated as
  underscore emphasis quotes (Github Flavored Markdown behaviour).
- Add `+` bulleted list ID (Markdown syntax).
- Lists can be terminated by two or more blank lines.
- Typographical nicities added to the
  [example .rimurc file](https://github.com/srackham/rimu/blob/master/examples/.rimurc).


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
  was not explicitly defined then `$\{text}` would silently render `$`.
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

