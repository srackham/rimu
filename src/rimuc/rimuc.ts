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
  then its contents is processed (with --safe-mode 0) after
  --prepend sources but before any other inputs.
  This behavior can be disabled with the --no-rimurc option.

OPTIONS
  -h, --help
    Display help message.

  -l, --lint
    Check the Rimu source for inconsistencies and errors.

  -o, --output OUTFILE
    Write output to file OUTFILE instead of stdout.
    If OUTFILE is a hyphen write to stdout.

  -p, --prepend SOURCE
    Process the SOURCE text before other inputs.
    Rendered with --safe-mode 0.

  --no-rimurc
    Do not process .rimurc from the user's home directory.

  -s, --styled
    Include HTML header and footer and Bootstrap CSS styling in
    output. If only one source file is specified and the --output option
    is not used then the output is written to a same-named file with
    an .html extension.

  --safe-mode NUMBER
    Non-zero safe modes ignore: Definition elements; API option elements;
    HTML attributes in Block Attributes elements.
    Also specifies how to process HTML elements:
    --safe-mode 0 renders HTML (default).
    --safe-mode 1 ignores HTML.
    --safe-mode 2 replaces HTML with --html-replacement option value.
    --safe-mode 3 renders HTML as text.
    Add 4 to --safe-mode to ignore Block Attribute elements.
    Add 8 to --safe-mode to allow Macro Definitions.

  --html-replacement TEXT
    Embedded HTML is replaced by TEXT when --safe-mode is set to 2.
    Defaults to '<mark>replaced HTML</mark>'.

  --theme THEME, --title TITLE, --highlightjs, --mathjax,
  --sidebar-toc, --dropdown-toc, --custom-toc, --section-numbers
    Shortcuts for the following prepended macro definitions:
    --prepend "{--theme}='THEME'"
    --prepend "{--title}='TITLE'"
    --prepend "{--bootstrap2}='true'"
    --prepend "{--highlightjs}='true'"
    --prepend "{--mathjax}='true'"
    --prepend "{--sidebar-toc}='true'"
    --prepend "{--dropdown-toc}='true'"
    --prepend "{--custom-toc}='true'"
    --prepend "{--section-numbers}='true'"

STYLING MACROS AND CLASSES
  The following macros and CSS classes are available when the
  --styled option is used:

  Macro name         Description
  _______________________________________________________________
  --                 Blank macro (empty string).                 
  --theme            Set styling themes.
                     Theme names: default, graystone.
  --title            HTML document title .
  --bootstrap2       Set to non-blank value to include Bootstrap2.
  --highlightjs      Set to non-blank value to enable syntax
                     highlighting with Highlight.js.
  --mathjax          Set to a non-blank value to enable MathJax.
  --sidebar-toc      Set to a non-blank value to generate a
                     table of contents sidebar.
  --dropdown-toc     Set to a non-blank value to generate a
                     table of contents dropdown menu.
  --custom-toc       Set to a non-blank value if a custom table
                     of contents is used.
  --section-numbers  Apply h2 and h3 section numbering.
  _______________________________________________________________
  These macros must be defined prior to processing (using rimuc
  options or in .rimurc).

  CSS class        Description
  ______________________________________________________________
  verse            Verse format (paragraphs, division blocks).
  sidebar          Sidebar format (paragraphs, division blocks).
  cite             Quote and verse attribution.
  bordered         Add borders to table.
  align-left       Text alignment left.
  align-center     Text alignment center.
  align-right      Text alignment right.
  no-print         Do not print.
  line-breaks      Honor line breaks in source text.
  page-break       Force page break before the element.
  no-page-break    Avoid page break inside the element.
  bold             Bold labelled list terms (default).
  italic           Italic labelled list terms.
  normal           Non-bold labelled list terms.
  dl-numbered      Number labeled list items.
  dl-horizontal    Format labeled lists horizontally.
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
        case '--safe-mode':
        case '--safeMode':  // Deprecated in Rimu 7.1.0.
          safeMode = parseInt(process.argv.shift() || '99', 10)
          if (safeMode < 0 || safeMode > 15) {
            die('illegal --safe-mode option value')
          }
          break
        case '--html-replacement':
        case '--htmlReplacement': // Deprecated in Rimu 7.1.0.
          htmlReplacement = process.argv.shift()
          break
        case '--styled':
        case '-s':
          styled = true
          break
        // Styling macro definitions shortcut options.
        case '--bootstrap2':
        case '--highlightjs':
        case '--mathjax':
        case '--section-numbers':
        case '--theme':
        case '--title':
        case '--toc': // DEPRECATED
        case '--sidebar-toc':
        case '--dropdown-toc':
        case '--custom-toc':
          let macroValue = ['--title', '--theme'].indexOf(arg) > -1 ? process.argv.shift() : 'true'
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
for (let infile of files) {
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
    html += source + '\n'
    continue
  }
  // rimurc processed with default safeMode.
  options.safeMode = infile === rimurc ? 0 : safeMode
  if (lint) {
    options.callback = function(message): void {
      let msg = message.type + ': ' + infile + ': ' + message.text
      if (msg.length > 120) {
        msg = msg.slice(0, 117) + '...'
      }
      console.error(msg)
      if (message.type === 'error') {
        errors += 1
      }
    }
  }
  html += Rimu.render(source, options) + '\n'
}
html = html.trim()
if (!outfile || outfile === '-') {
  process.stdout.write(html)
}
else {
  fs.writeFileSync(outfile, html)
}
if (errors) {
  process.exit(1)
}
