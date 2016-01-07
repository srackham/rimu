/*
  Command-lne app to convert Rimu source to HTML.
  Run 'node rimu.js --help' for details.
*/

import path = require('path')
import fs = require('fs')
import Rimu = require('./rimu')

const MANPAGE = `NAME
  rimuc - convert Rimu source to HTML

SYNOPSIS
  rimuc [OPTIONS...] [FILES...]

DESCRIPTION
  Reads Rimu source markup from stdin, converts them to HTML
  then writes the HTML to stdout. If FILES are specified
  the Rimu source is read from FILES. The contents of files
  with an .html extension are passed directly to the output.

  If a file named .rimurc exists in the user's home directory
  then its contents is processed (with safeMode 0) after
  --prepend sources but before any other inputs.
  This behavior can be disabled with the --no-rimurc option.

OPTIONS
  -h, --help
    Display help message.

  -l, --lint
    Check the Rimu source for inconsistencies and errors.

  -o, --output OUTFILE
    Write output to file OUTFILE instead of stdout.

  -p, --prepend SOURCE
    Process the SOURCE text before other inputs.
    Rendered with safeMode 0.

  --no-rimurc
    Do not process .rimurc from the user's home directory.

  -s, --styled
    Include HTML header and footer and Bootstrap CSS styling in
    output. If only one source file is specified and the --output option
    is not used then the output is written to a same-named file with
    an .html extension.

  --safeMode NUMBER
    Specifies how to process inline and block HTML elements.
    --safeMode 0 renders raw HTML (default).
    --safeMode 1 drops raw HTML.
    --safeMode 2 replaces raw HTML with htmlReplacement option text.
    --safeMode 3 renders raw HTML as text.

  --htmlReplacement
    A string that replaces embedded HTML when safeMode is set to 2.
    Defaults to '<mark>replaced HTML</mark>'.

  --title TITLE, --highlightjs, --mathjax, --toc, --section-numbers
    Shortcuts for prepended styling macro definitions:
    --prepend "{--title}='TITLE'"
    --prepend "{--highlightjs}='true'"
    --prepend "{--mathjax}='true'"
    --prepend "{--toc}='true'"
    --prepend "{--section-numbers}='true'"

STYLING MACROS AND CLASSES
  The following macros and CSS classes are available when the
  --styled option is used:

  Macro name         Description
  ______________________________________________________________
  --title            HTML document title (1).
  --highlightjs      Set to non-blank value to enable syntax
                     highlighting with Highlight.js.
  --mathjax          Set to a non-blank value to enable MathJax.
  --toc              Set to a non-blank value to generate a
                     table of contents (1).
  --section-numbers  Apply h2 and h3 section numbering (1).
  ______________________________________________________________
  (1) Must be defined prior to header (--prepend or .rimurc).

  CSS class        Description
  ______________________________________________________________
  verse            Verse format (paragraphs, division blocks).
  sidebar          Sidebar format (paragraphs, division blocks).
  no-print         Do not print.
  dl-numbered      Number labeled list items.
  dl-counter       Prepend dl item counter to element content.
  ol-counter       Prepend ol item counter to element content.
  ul-counter       Prepend ul item counter to element content.
  ______________________________________________________________
`


// Helpers.
function die(message: string): void {
  console.error(message)
  process.exit(1)
}

let safeMode = 0
let htmlReplacement: string = null
let styled = false
let no_rimurc = false
let lint = false

// Skip executable and script paths.
process.argv.shift(); // Skip executable path.
process.argv.shift(); // Skip rimuc script path.

// Parse command-line options.
let source = ''
let outfile: string
let arg: string
outer:
    while (!!(arg = process.argv.shift())) {
      switch (arg) {
        case '--help':
        case '-h':
          console.log('\n' + MANPAGE)
          process.exit()
          break
        case '--lint':
        case '-l':
          lint = true
          break
        case '--output':
        case '-o':
          outfile = process.argv.shift()
          if (!outfile) {
            die('missing --output file name')
          }
          break
        case '--prepend':
        case '-p':
          source += process.argv.shift() + '\n'
          break
        case '--no-rimurc':
          no_rimurc = true
          break
        case '--safeMode':
        case '--safe-mode': // Deprecated in Rimu 5.0.0.
          safeMode = parseInt(process.argv.shift() || '99', 10)
          if (safeMode < 0 || safeMode > 3) {
            die('illegal --safeMode option value')
          }
          break
        case '--htmlReplacement':
          htmlReplacement = process.argv.shift()
          break
        case '--styled':
        case '-s':
          styled = true
          break
        // Styling macro definitions shortcut options.
        case '--highlightjs':
        case '--mathjax':
        case '--section-numbers':
        case '--title':
        case '--toc':
          let macroValue = arg === '--title' ? process.argv.shift() : 'true'
          source += '{' + arg + '}=\'' + macroValue + '\'\n'
          break
        default:
          if (arg[0] === '-') {
            die('illegal option: ' + arg)
          }
          process.argv.unshift(arg); // List of source files.
          break outer
      }
    }

// process.argv contains the list of source files.
let files = process.argv
if (files.length === 0) {
  files.push('/dev/stdin')
}
else if (styled && !outfile && files.length === 1) {
  // Use the source file name with .html extension for the output file.
  outfile = files[0].substr(0, files[0].lastIndexOf('.')) + '.html'
}

if (styled) {
  // Envelope source files with header and footer.
  files.unshift(path.resolve(__dirname, 'header.rmu'))
  files.push(path.resolve(__dirname, 'footer.rmu'))
}

// Prepend $HOME/.rimurc file if it exists.
let homeDir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']
let rimurc =  path.resolve(homeDir, '.rimurc')
if (!no_rimurc && fs.existsSync(rimurc)) {
  files.unshift(rimurc)
}

// Convert Rimu source files to HTML.
let html = ''
let errors = 0
if (source !== '') {
  html += Rimu.render(source) + '\n'; // --prepend options source.
}
let options: Rimu.Options = {}
if (htmlReplacement !== null) {
  options.htmlReplacement = htmlReplacement
}
files.forEach(function (infile): void {
  if (!fs.existsSync(infile)) {
    die('source file does not exist: ' + infile)
  }
  try {
    source = fs.readFileSync(infile).toString()
  } catch (e) {
    die('source file permission denied: ' + infile)
  }
  let ext = infile.split('.').pop()
  if (ext === 'html') {
    html += source
    return
  }
  // rimurc processed with default safeMode.
  options.safeMode = infile === rimurc ? 0 : safeMode
  if (lint) {
    options.callback = function(message): void {
      let msg = message.type + ': ' + infile + ': ' + message.text
      if (msg.length > 120) {
        msg = msg.slice(0, 117) + '...'
      }
      console.log(msg)
      errors += 1
    }
  }
  html += Rimu.render(source, options) + '\n'
})
if (errors) {
  process.exit(1)
}
html = html.trim()
if (outfile) {
  fs.writeFileSync(outfile, html)
}
else {
  process.stdout.write(html)
}
