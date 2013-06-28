# Rimu Markup

Rimu is a readable text to HTML markup language inspired by AsciiDoc
and Markdown.


## Implementation

- Single lightweight JavaScript file (less than 20KB minified) that
  can be dropped onto a Web page or used as a Node module.
- No dependencies.
- Simple one-function API.
- Features include raw HTML (a la Markdown), HTML attribute injection
  and parameterized macros.
- Written in TypeScript.
- Available from Github and as an npm module or a Meteor smart package.
- Includes command-line compiler, playground GUI, Vim syntax
  highlighter and a unit test suite.
- MIT license.


## Rimu Playground

Read the documentation and experiment with Rimu in the _Rimu
Playground_.

Play with it here <http://rimumarkup.org/rimuplayground.html> or
open `rimuplayground.html` locally in in your browser.


## Installing Rimu

- Install Rimu as a Node.js module (includes the `rimuc` command-line
  tool, run `rimuc --help`):

        npm install rimu

- Get the source from Github: <https://github.com/srackham/rimu>


## Using Rimu

- See the _API_ documentation topic in the _Rimu Playground_.
- Take a look at `./bin/rimuc.js` and `./bin/rimuplayground.html` for
  examples of using Rimu with Node.js and in the browser respectively.
- The `meteor-example` directory contains a simple Meteor application
  that uses the _rimumarkup_ smart package
  (<https://atmosphere.meteor.com/package/rimumarkup>). Use
  _Meteorite_ (<https://github.com/oortcloud/meteorite>) to install
  and run the example:

        cd meteor-example
        mrt


## Browser compatibility

There hasn't been a huge amount of browser testing. Works with the
latest versions of IE, Firefox and Chrome, seems OK on Android 4 and
iOS.  Does not work on IE8.
