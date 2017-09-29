# Rimu Markup

Rimu is a readable-text to HTML markup language inspired by AsciiDoc
and Markdown.


## Features summary

- Markup generation can be customized and extended.
- Includes a simple, flexible macro language.
- HTML attribute injection and parametrized macros.
- Accepts raw HTML (a la Markdown).
- A subset of the Rimu syntax is [Markdown
  compatible](http://srackham.github.io/rimu/tips.html#markdown-compatible).
- Single JavaScript file (less than 22KB minified) that can be dropped
  onto a Web page or used as a Node module.
- No dependencies.
- One-function API.
- Written in TypeScript.
- Includes command-line compiler, JavaScript library, TypeScript
  library declaration file, playground GUI, Vim syntax highlighter and
  a unit test suite.
- MIT license.
- There is also a [Kotlin port of
  Rimu](https://github.com/srackham/rimu-kt/) for the JVM platform.


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

Run a simple test from the command prompt to check `rimuc` is working:

        echo 'Hello *Rimu*!' | rimuc

This should output:

        <p>Hello <em>Rimu</em>!</p>


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
  [rimuc](http://srackham.github.io/rimu/reference.html#rimuc-command)
  command-line tool  and the [Rimu
  Playground](http://srackham.github.io/rimu/rimuplayground.html) --
  examples of using Rimu in Node.js and in the browser respectively.
- A simple [Chrome browser
  extension](https://github.com/srackham/rimu-chrome-extension.git)
  for rendering Rimu Markup files directly in the browser.


## Browser compatibility

The generated HTML is compatible with all Web browsers. The Rimu
JavaScript library works with IE11, Edge, Firefox, Chrome and Android.
