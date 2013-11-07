# Rimu Markup

Rimu is a readable-text to HTML markup language inspired by AsciiDoc
and Markdown.


## Scope

At its core Rimu is a simple readable-text markup similar in scope to
Markdown, but with two additional areas of functionality:

- Markup generation can be customized and extended.
- It includes a simple, flexible macro language.

Both these features are built into the Rimu markup syntax.


## Implementation

- Single lightweight JavaScript file (less than 23KB minified) that
  can be dropped onto a Web page or used as a Node module.
- No dependencies.
- Simple one-function API.
- Features include raw HTML (a la Markdown), HTML attribute injection
  and parametrized macros.
- Element syntax and behavior can be modified and extended.
- Written in TypeScript.
- Available from Github and as an npm module or a Meteor smart package.
- Includes command-line compiler, JavaScript library, TypeScript
  library declaration file, playground GUI,
  Vim syntax highlighter and a unit test suite.
- MIT license.


## Learn More

Read the documentation and experiment with Rimu in the _Rimu
Playground_.

Play with it here <http://rimumarkup.org/rimuplayground.html> or
open `rimuplayground.html` locally in in your browser.

See also the _Release Notes_ topic in the _Rimu Playground_.


## Installing Rimu

- Install Rimu as a Node.js module (includes the `rimuc` command-line
  tool, run `rimuc --help`):

        sudo npm install -g rimu

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

The generated HTML is compatible with all browsers. The Rimu
JavaScript library works with the latest versions of IE, Firefox and
Chrome, seems OK on Android 4 and iOS. Does not run on IE8.
