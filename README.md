# Rimu Markup

Rimu is a readable-text to HTML markup language inspired by AsciiDoc
and Markdown.


## Scope

At its core Rimu is a simple readable-text markup similar in scope to
Markdown, but with two additional areas of functionality (both built
into the Rimu markup syntax):

- Markup generation can be customized and extended.
- Rimu includes a simple, flexible macro language.

Plus:

- A large subset of Rimu syntax is [Markdown
  compatible](http://srackham.github.io/rimu/tips.html#markdown-compatible).
- Rimu is fast (same speed as _marked 0.3.2_ compiling Rimu `README.md`).


## Implementation

- Single lightweight JavaScript file (less than 27KB minified) that
  can be dropped onto a Web page or used as a Node module.
- No dependencies.
- Simple one-function API.
- Features include raw HTML (a la Markdown), HTML attribute injection
  and parametrized macros.
- Element syntax and behavior can be modified and extended.
- Written in TypeScript.
- Available from Github and as an npm module.
- Includes command-line compiler, JavaScript library, TypeScript
  library declaration file, playground GUI,
  Vim syntax highlighter and a unit test suite.
- MIT license.


## Learn More

Read the documentation and experiment with Rimu in the [Rimu
Playground](http://srackham.github.io/rimu/rimuplayground.html) or open the
`rimuplayground.html` file locally in your browser.

See the Rimu [CHANGELOG](http://srackham.github.io/rimu/CHANGELOG.html) for
the latest changes.


## Installing Rimu

- Install Rimu as a Node.js module (includes the `rimuc` command-line
  tool, run `rimuc --help`):

        sudo npm install -g rimu

- Get the source from [Github](https://github.com/srackham/rimu).


## Example Apps

See the _API_ documentation topic in the [Rimu
Playground](http://srackham.github.io/rimu/rimuplayground.html).

- Rimu includes the _rimuc_ command-line tool (`./bin/rimuc.js`) and
  the _Rimu Playground_ (`./bin/rimuplayground.html`) -- examples of
  using Rimu in Node.js and in the browser respectively.
- A [Chrome browser
  extension](https://github.com/srackham/rimu-chrome-extension.git)
  for rendering Rimu Markup files directly in the browser.


## Browser compatibility

The generated HTML is compatible with all browsers. The Rimu
JavaScript library works with the latest versions of IE, Firefox and
Chrome, seems OK on Android 4 and iOS. Does not run on IE8.
