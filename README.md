# Rimu Markup

Rimu is a readable-text to HTML markup language inspired by AsciiDoc
and Markdown.

At its core Rimu is a simple readable-text markup similar in scope to
Markdown, but with two additional areas of functionality (both built
into the Rimu markup syntax):

- Markup generation can be customized and extended.
- Rimu includes a simple, flexible macro language.
- A subset of Rimu syntax is [Markdown
  compatible](http://srackham.github.io/rimu/tips.html#markdown-compatible).
- The generated HTML is compatible with all modern browsers.
- A number of [Rimu
  implementations](http://srackham.github.io/rimu/reference.html#rimu-implementations)
  are available for various languages and runtime environments.


## Learn more
Read the documentation and experiment with Rimu in the [Rimu
Playground](http://srackham.github.io/rimu/rimuplayground.html) or open the
`rimuplayground.html` file locally in your browser.

See the Rimu [Change Log](http://srackham.github.io/rimu/changelog.html) for
the latest changes.

**NOTE**: The remainder of this document is specific to the JavaScript port.


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
`rimuc` command-line tool).

### Linux, macOS
        sudo npm install -g rimu

Run a test from the command prompt to check the `rimuc` CLI command is
working:

        $ echo 'Hello *Rimu*!' | rimuc
        <p>Hello <em>Rimu</em>!</p>

### Windows
        npm install -g rimu
        npm link

Run a test from the command prompt to check the `rimuc` CLI command is
working:

        > echo "Hello *Rimu*!" | rimuc.cmd
        <p>Hello <em>Rimu</em>!</p>


## Building Rimu
### Linux, macOS
To build Rimu and the Rimu documentation from source:

1. Install the Git repository from [Github](https://github.com/srackham/rimu).

        git clone https://github.com/srackham/rimu.git

2. Install dependencies:

        cd rimu
        npm install

3. Build Rimu:

        jake build