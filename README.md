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

**NOTE**: The remainder of this document is specific to the
[TypeScript implementation](https://github.com/srackham/rimu) for
Node.js, Deno and browser platforms.


## Quick start
To try the Rimu library in your browser:

1. Open the [Rimu NPM Runkit page](https://npm.runkit.com/rimu) in your browser.
2. Paste in this code then press the _Run_ button.
``` javascript
const rimu = require("rimu")
const html = rimu.render('Hello *Rimu*!')
```
This will output `"<p>Hello <em>Rimu</em>!</p>"`.

## Installing Rimu
**Node.js**

Use `npm` to install the Node.js Rimu library module and the `rimuc`
CLI:

    npm install -g rimu

Run a test from the command prompt to check the `rimuc` CLI command is
working:

    echo "Hello *Rimu*!" | rimuc

This should print:

    <p>Hello <em>Rimu</em>!</p>

**Deno**

Deno modules don't need explicit installation just import the module
URL, for example:

``` javascript
import * as rimu from "https://deno.land/x/rimu/mod.ts";

console.log(rimu.render("Hello *Rimu*!"));
```

Use the Deno `install` command to install the Rimu CLI executable. For
example, the following example creates the CLI executable named
`rimudeno` in `$HOME/.deno/bin/rimudeno`:

    deno install -A --name rimudeno https://deno.land/x/rimu/src/deno/rimuc.ts

**Browser**

To use Rimu in an HTML Web page include the bundled and minimized
`rimu.min.js` file from the `./lib` directory in your Web page, for
example:

``` html
<script src="rimu.min.js"></script>
<script>
    alert(Rimu.render("Hello *Rimu*!"));
</script>
```


## Building Rimu and the Rimu documentation
To build Rimu you need to have [Deno](https://deno.land/) and
[Node.js](https://nodejs.org/) installed.

1. Install the Git repository from [Github](https://github.com/srackham/rimu).

        git clone https://github.com/srackham/rimu.git

2. Install dependencies:

        cd rimu
        npm install

3. Use the [Drake](https://github.com/srackham/drake) task runner
   module to build Rimu library modules and CLIs for Deno and Node.js
   platforms:

        deno run -A Drakefile.ts build
