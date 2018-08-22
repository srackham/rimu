/*
  Command-lne app to convert Rimu source to HTML.
  Run 'node rimu.js --help' for details.
*/

import * as fs from 'fs'
import * as path from 'path'
import * as rimu from 'rimu'

const MANPAGE = `NAME
  rimuc - convert Rimu source to HTML

SYNOPSIS
  rimuc [OPTIONS...] [FILES...]

DESCRIPTION
  Reads Rimu source markup from stdin, converts them to HTML
  then writes the HTML to stdout. If FILES are specified
  the Rimu source is read from FILES. The contents of files
  with an .html extension are passed directly to the output.
  An input file named '-' is read from stdin.

  If a file named .rimurc exists in the user's home directory
  then its contents is processed (with --safe-mode 0).
  This behavior can be disabled with the --no-rimurc option.

  Inputs are processed in the following order: .rimurc file,
  --prepend-file options, --prepend options, FILES...

OPTIONS
  -h, --help
    Display help message.

  --html-replacement TEXT
    Embedded HTML is replaced by TEXT when --safe-mode is set to 2.
    Defaults to '<mark>replaced HTML</mark>'.

  --layout LAYOUT
    Generate a styled HTML document. rimuc includes the
    following built-in document layouts:

    'classic': Desktop-centric layout.
    'flex':    Flexbox mobile layout (experimental).
    'plain':   Unstyled HTML layout.
    'sequel':  Responsive cross-device layout.

    If only one source file is specified and the --output
    option is not specified then the output is written to a
    same-named file with an .html extension.
    This option enables --header-ids.

  -o, --output OUTFILE
    Write output to file OUTFILE instead of stdout.
    If OUTFILE is a hyphen '-' write to stdout.

  --pass
    Pass the stdin input verbatim to the output.

  -p, --prepend SOURCE
    Process the SOURCE text before all other inputs.
    Rendered with --safe-mode 0.

  --prepend-file PREPEND_FILE
    Process the PREPEND_FILE contents immediately after --prepend
    and .rimurc processing.
    Rendered with --safe-mode 0.

  --no-rimurc
    Do not process .rimurc from the user's home directory.

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

  --theme THEME, --lang LANG, --title TITLE, --highlightjs, --mathjax,
  --no-toc, --custom-toc, --section-numbers, --header-ids, --header-links
    Shortcuts for the following prepended macro definitions:

    --prepend "{--custom-toc}='true'"
    --prepend "{--header-ids}='true'"
    --prepend "{--header-links}='true'"
    --prepend "{--highlightjs}='true'"
    --prepend "{--lang}='LANG'"
    --prepend "{--mathjax}='true'"
    --prepend "{--no-toc}='true'"
    --prepend "{--section-numbers}='true'"
    --prepend "{--theme}='THEME'"
    --prepend "{--title}='TITLE'"

LAYOUT OPTIONS
  The following options are available when the --layout option
  specifies a built-in layout:

  Option             Description
  _______________________________________________________________
  --custom-toc       Set to a non-blank value if a custom table
                     of contents is used.
  --header-links     Set to a non-blank value to generate h2 and
                     h3 header header links.
  --highlightjs      Set to non-blank value to enable syntax
                     highlighting with Highlight.js.
  --lang             HTML document language attribute value.
  --mathjax          Set to a non-blank value to enable MathJax.
  --no-toc           Set to a non-blank value to suppress table of
                     contents generation.
  --section-numbers  Apply h2 and h3 section numbering.
  --theme            Styling theme. Theme names:
                     'legend', 'graystone', 'vintage'.
  --title            HTML document title.
  _______________________________________________________________
  These options are translated by rimuc to corresponding layout
  macro definitions using the --prepend option.

LAYOUT CLASSES
  The following CSS classes are available for use in Rimu Block
  Attributes elements when the --layout option specifies a
  built-in layout:

  CSS class        Description
  ______________________________________________________________
  align-center     Text alignment center.
  align-left       Text alignment left.
  align-right      Text alignment right.
  bordered         Adds table borders.
  cite             Quote and verse attribution.
  dl-horizontal    Format labeled lists horizontally.
  dl-numbered      Number labeled list items.
  dl-counter       Prepend dl item counter to element content.
  ol-counter       Prepend ol item counter to element content.
  ul-counter       Prepend ul item counter to element content.
  no-auto-toc      Exclude heading from table of contents.
  no-page-break    Avoid page break inside the element.
  no-print         Do not print.
  page-break       Force page break before the element.
  preserve-breaks  Honor line breaks in source text.
  sidebar          Sidebar format (paragraphs, division blocks).
  verse            Verse format (paragraphs, division blocks).
  ______________________________________________________________

PREDEFINED MACROS
  Macro name         Description
  _______________________________________________________________
  --                 Blank macro (empty string).
                     The Blank macro cannot be redefined.
  --header-ids       Set to a non-blank value to generate h1, h2
                     and h3 header id attributes.
  _______________________________________________________________
`
const STDIN = '/dev/stdin'
const HOME_DIR = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']
const RIMURC = path.resolve(HOME_DIR || '', '.rimurc')

// Helpers.
function die(message: string): void {
  console.error(message)
  process.exit(1)
}

declare const require: (filename: string) => any

function readResourceFile(name: string): string {
  return require(`./resources/${name}`)
}

function importLayoutFile(name: string): string {
  // Attempt to read header or footer file from external module `rimu-<layout-name>-layout`.
  // Extract layout name and header/footer from the file `name`.
  let match = name.match(/^(.+?)-(header|footer).rmu$/)!
  let result = ''
  try {
    // Kludge to force Webpack to ignore the dynamic require().
    result = eval(`require('rimu-${match[1]}-layout')['${match[2]}']`) // tslint:disable-line no-eval
  }
  catch {
    die(`missing --layout: ${match[1]}`)
  }
  if (result === undefined) {
    die(`--layout ${match[1]}: missing ${match[2]}`)
  }
  return result
}

let safe_mode = 0
let html_replacement: string | undefined
let layout = ''
let no_rimurc = false
let prepend_files: string[] = []
let pass = false

// Skip executable and script paths.
process.argv.shift(); // Skip executable path.
process.argv.shift(); // Skip rimuc script path.

// Parse command-line options.
let prepend = ''
let outfile: string | undefined
let arg: string | undefined
outer:
  while (!!(arg = process.argv.shift())) {
    switch (arg) {
      case '--help':
      case '-h':
        console.log('\n' + MANPAGE)
        process.exit()
        break
      case '--lint': // Deprecated in Rimu 10.0.0
      case '-l':
        break
      case '--output':
      case '-o':
        outfile = process.argv.shift()
        if (!outfile) {
          die('missing --output file name')
        }
        break
      case '--pass':
        pass = true
        break
      case '--prepend':
      case '-p':
        prepend += process.argv.shift() + '\n'
        break
      case '--prepend-file':
        let prepend_file = process.argv.shift()
        if (!prepend_file) {
          die('missing --prepend-file file name')
        }
        prepend_files.push(prepend_file!)
        break
      case '--no-rimurc':
        no_rimurc = true
        break
      case '--safe-mode':
      case '--safeMode':  // Deprecated in Rimu 7.1.0.
        safe_mode = parseInt(process.argv.shift() || '99', 10)
        if (safe_mode < 0 || safe_mode > 15) {
          die('illegal --safe-mode option value')
        }
        break
      case '--html-replacement':
      case '--htmlReplacement': // Deprecated in Rimu 7.1.0.
        html_replacement = process.argv.shift()
        break
      case '--styled': // Deprecated in Rimu 10.0.0
      case '-s':
        prepend += '{--header-ids}=\'true\'\n'
        if (layout === '') {
          layout = 'classic'
        }
        break
      // Styling macro definitions shortcut options.
      case '--highlightjs':
      case '--mathjax':
      case '--section-numbers':
      case '--theme':
      case '--title':
      case '--lang':
      case '--toc': // Deprecated in Rimu 8.0.0
      case '--no-toc':
      case '--sidebar-toc': // Deprecated in Rimu 10.0.0
      case '--dropdown-toc': // Deprecated in Rimu 10.0.0
      case '--custom-toc':
      case '--header-ids':
      case '--header-links':
        let macro_value = ['--lang', '--title', '--theme'].indexOf(arg) > -1 ? process.argv.shift() : 'true'
        prepend += '{' + arg + '}=\'' + macro_value + '\'\n'
        break
      case '--layout':
      case '--styled-name': // Deprecated in Rimu 10.0.0
        layout = process.argv.shift() || ''
        if (!layout) {
          die('missing --layout')
        }
        prepend += '{--header-ids}=\'true\'\n'
        break
      default:
        process.argv.unshift(arg); // argv contains source file names.
        break outer
    }
  }
// process.argv contains the list of source files.
let files = process.argv
if (files.length === 0) {
  files.push(STDIN)
}
else if (files.length === 1 && layout !== '' && files[0] !== '-' && !outfile) {
  // Use the source file name with .html extension for the output file.
  outfile = files[0].substr(0, files[0].lastIndexOf('.')) + '.html'
}
const RESOURCE_TAG = 'resource:' // Tag for resource files.
const PREPEND = '--prepend options'
if (layout !== '') {
  // Envelope source files with header and footer.
  files.unshift(`${RESOURCE_TAG}${layout}-header.rmu`)
  files.push(`${RESOURCE_TAG}${layout}-footer.rmu`)
}
// Prepend $HOME/.rimurc file if it exists.
if (!no_rimurc && fs.existsSync(RIMURC)) {
  prepend_files.unshift(RIMURC)
}
if (prepend !== '') {
  prepend_files.push(PREPEND)
}
files = prepend_files.concat(files)
// Convert Rimu source files to HTML.
let output = ''
let errors = 0
let options: rimu.Options = {}
if (html_replacement !== undefined) {
  options.htmlReplacement = html_replacement
}
for (let infile of files) {
  if (infile === '-') {
    infile = STDIN
  }
  let source = ''
  if (infile.startsWith(RESOURCE_TAG)) {
    infile = infile.substr(RESOURCE_TAG.length)
    if (['classic', 'flex', 'sequel', 'plain', 'v8'].indexOf(layout) >= 0) {
      source = readResourceFile(infile)
    }
    else {
      source = importLayoutFile(infile)
    }
    options.safeMode = 0  // Resources are trusted.
  }
  else if (infile === PREPEND) {
    source = prepend
    options.safeMode = 0  // --prepend options are trusted.
  }
  else {
    if (!fs.existsSync(infile)) {
      die('source file does not exist: ' + infile)
    }
    try {
      source = fs.readFileSync(infile).toString()
    } catch (e) {
      die('source file permission denied: ' + infile)
    }
    // Prepended and ~/.rimurc files are trusted.
    options.safeMode = (prepend_files.indexOf(infile) > -1) ? 0 : safe_mode
  }
  let ext = infile.split('.').pop()
  // Skip .html and pass-through inputs.
  if (!(ext === 'html' || (pass && infile === STDIN))) {
    options.callback = function (message): void {
      let msg = message.type + ': ' + infile + ': ' + message.text
      if (msg.length > 120) {
        msg = msg.slice(0, 117) + '...'
      }
      console.error(msg)
      if (message.type === 'error') {
        errors += 1
      }
    }
    source = rimu.render(source, options)
  }
  source = source.trim()
  if (source !== '') {
    output += source + '\n'
  }
}
output = output.trim()
if (!outfile || outfile === '-') {
  process.stdout.write(output)
}
else {
  fs.writeFileSync(outfile, output)
}
if (errors) {
  process.exit(1)
}
