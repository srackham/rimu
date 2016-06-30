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

- A subset of Rimu syntax is [Markdown
  compatible](http://srackham.github.io/rimu/tips.html#markdown-compatible).
- Rimu is fast (same speed as _marked 0.3.2_ compiling Rimu `README.md`).


## Features summary

- Single lightweight JavaScript file (less than 20KB minified) that
  can be dropped onto a Web page or used as a Node module.
- No dependencies.
- One-function API.
- Features include raw HTML (a la Markdown), HTML attribute injection
  and parametrized macros.
- Element syntax and behavior can be modified and extended.
- Written in TypeScript.
- Includes command-line compiler, JavaScript library, TypeScript
  library declaration file, playground GUI,
  Vim syntax highlighter and a unit test suite.
- MIT license.


## Learn more

Read the documentation and experiment with Rimu in the [Rimu
Playground](http://srackham.github.io/rimu/rimuplayground.html) or open the
`rimuplayground.html` file locally in your browser.

See the Rimu [Change Log](http://srackham.github.io/rimu/changelog.html) for
the latest changes.


## Installing Rimu

Install Rimu as a Node.js module (includes the `rimu` library and the
`rimuc` command-line tool):

        sudo npm install -g rimu


## Building Rimu

To build Rimu and the Rimu documentation from source:

1. Install the Git repository from [Github](https://github.com/srackham/rimu).

        git clone git@github.com:srackham/rimu.git

2. Install gh-pages sub-repository:

        cd rimu
        git clone git@github.com:srackham/rimu.git -b gh-pages gh-pages

3. Install dependencies:

        npm install

4. Build Rimu:

        jake build


## Using the Rimu library

- First read the [Rimu
  API](http://srackham.github.io/rimu/reference.html#api)
  documentation.
- A minimal TypeScript example
  [minimal-example.ts](https://github.com/srackham/rimu/blob/master/src/examples/minimal-example.ts).
- Rimu includes the
  [rimuc](https://github.com/srackham/rimu/blob/master/src/rimuc/rimuc.ts)
  command-line tool  and the [Rimu
  Playground](http://srackham.github.io/rimu/rimuplayground.html) --
  examples of using Rimu in Node.js and in the browser respectively.
- A simple [Chrome browser
  extension](https://github.com/srackham/rimu-chrome-extension.git)
  for rendering Rimu Markup files directly in the browser.


## Browser compatibility

The generated HTML is compatible with all modern browsers. The Rimu
JavaScript library works with the latest versions of IE, Firefox and
Chrome, seems OK on Android and iOS. Does not run on IE8.
