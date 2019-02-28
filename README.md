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
- One-function API.
- Playground GUI, Vim syntax highlighter and a unit test suite.
- MIT license.
- Ported to three language platforms:
  * The canonical [JavaScript version](https://github.com/srackham/rimu)
    written in TypeScript with no dependencies.
    Single JavaScript file (less than 22KB minified) that can be dropped
    onto a Web page or used as a Node module.
  * A [Kotlin port](https://github.com/srackham/rimu-kt/) for the JVM platform.
  * A [Go port](https://github.com/srackham/go-rimu/).


## Quick start
To try the Rimu library in your browser:

1. Open the [Rimu NPM Runkit page](https://npm.runkit.com/rimu) in your browser.
2. Paste in this code then press the _Run_ button.
``` javascript
var rimu = require("rimu")
var html = rimu.render('Hello *Rimu*!')
```
This will output `"<p>Hello <em>Rimu</em>!</p>"`.

## Installing Rimu
Install Rimu as a Node.js module (includes the `rimu` library and the
`rimuc` command-line tool):

        sudo npm install -g rimu

Run a simple test from the command prompt to check the `rimuc` CLI command is
working:

        echo 'Hello *Rimu*!' | rimuc

This should output:

        <p>Hello <em>Rimu</em>!</p>


## Building Rimu
To build Rimu and the Rimu documentation from source:

1. Install the Git repository from [Github](https://github.com/srackham/rimu).

        git clone git@github.com:srackham/rimu.git

2. Install dependencies:

        cd rimu
        npm install

3. Build Rimu:

        jake build


## Learn more
Read the documentation and experiment with Rimu in the [Rimu
Playground](http://srackham.github.io/rimu/rimuplayground.html) or open the
`rimuplayground.html` file locally in your browser.

See the Rimu [Change Log](http://srackham.github.io/rimu/changelog.html) for
the latest changes.


## Browser compatibility
The generated HTML is compatible with all Web browsers. The Rimu
JavaScript library works with IE11, Edge, Firefox, Chrome and Android.
