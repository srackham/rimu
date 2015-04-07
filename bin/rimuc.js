#!/usr/bin/env node
/*
  Command-lne app to convert Rimu source to HTML.
  Run 'node rimu.js --help' for details.
*/

var path = require('path');
var fs = require('fs');
var Rimu = require('./rimu.js');

var MANPAGE = 'NAME\n' +
    '  rimuc - convert Rimu source to HTML\n' +
    '\n' +
    'SYNOPSIS\n' +
    '  rimuc [OPTIONS...] [FILES...]\n' +
    '\n' +
    'DESCRIPTION\n' +
    '  Reads Rimu source markup from stdin, converts them to HTML\n' +
    '  then writes the HTML to stdout. If FILES are specified\n' +
    '  the Rimu source is read from FILES.\n' +
    '\n' +
    '  If a file named .rimurc exists in the user\'s home directory\n' +
    '  then its contents is processed (with safe-mode 0) after\n' +
    '  --prepend sources but before any other inputs.\n' +
    '  This behavior can be disabled with the --no-rimurc option.\n' +
    '\n' +
    'OPTIONS\n' +
    '  -h, --help\n' +
    '    Display help message.\n' +
    '\n' +
    '  -o, --output OUTFILE\n' +
    '    Write output to file OUTFILE instead of stdout.\n' +
    '\n' +
    '  -p, --prepend SOURCE\n' +
    '    Process the SOURCE text before other inputs.\n' +
    '    Rendered with safe-mode 0.\n' +
    '\n' +
    '  --no-rimurc\n' +
    '    Do not process .rimurc from the user\'s home directory.\n' +
    '\n' +
    '  --safe-mode NUMBER\n' +
    '    Specifies how to process inline and block HTML elements.\n' +
    '    --safe-mode 0 renders raw HTML (default),\n' +
    '    --safe-mode 1 drops raw HTML,\n' +
    '    --safe-mode 2 replaces raw HTML with text \'replaced HTML\'.\n' +
    '    --safe-mode 3 renders raw HTML as text.\n' +
    '\n' +
    '  -s, --styled\n' +
    '    Include HTML header and footer and Bootstrap CSS styling in\n' +
    '    output. If one source file is specified the output is written to\n' +
    '    same-named file with .html extension.\n' +
    '\n' +
    'STYLING MACROS AND CLASSES\n' +
    '  The following macros and CSS classes are available when the\n' +
    '  --styled option is used:\n' +
    '\n' +
    '  Macro name         Description\n' +
    '  ______________________________________________________________\n' +
    '  --title            HTML document title (1).\n' +
    '  --highlightjs      Set to non-blank value to enable syntax\n' +
    '                     highlighting with Highlight.js.\n' +
    '  --mathjax          Set to a non-blank value to enable MathJax.\n' +
    '  --section-numbers  Apply h1 and h2 section numbering (1).\n' +
    '  ______________________________________________________________\n' +
    '  (1) Must be defined prior to header (--prepend or .rimurc).\n' +
    '\n' +
    '  CSS class        Description\n' +
    '  ______________________________________________________________\n' +
    '  verse            Verse format (paragraphs, division blocks).\n' +
    '  sidebar          Sidebar format (paragraphs, division blocks).\n' +
    '  dl-numbered      Number labeled list items .\n' +
    '  dl-counter       Prepend dl item counter to element content.\n' +
    '  ol-counter       Prepend ol item counter to element content.\n' +
    '  ul-counter       Prepend ul item counter to element content.\n' +
    '  ______________________________________________________________\n';

// Helpers.
function die(message) {
  console.error(message);
  process.exit(1);
}

var safeMode = 0;
var styled = false;
var no_rimurc = false;

// Skip executable and script paths.
process.argv.shift(); // Skip executable path.
process.argv.shift(); // Skip rimuc script path.

// Parse command-line options.
var source = '';
var outFile;
outer:
    while (!!(arg = process.argv.shift())) {
      switch (arg) {
        case '--help':
        case '-h':
          console.log('\n' + MANPAGE);
          process.exit();
          break;
        case '--output':
        case '-o':
          outFile = process.argv.shift();
          if (!outFile) {
            die('missing --output file name');
          }
          break;
        case '--prepend':
        case '-p':
          source += process.argv.shift() + '\n';
          break;
        case '--no-rimurc':
          no_rimurc = true;
          break;
        case '--safe-mode':
          safeMode = parseInt(process.argv.shift() || 99, 10);
          if (safeMode < 0 || safeMode > 3) {
            die('illegal --safe-mode option value');
          }
          break;
        case '--styled':
        case '-s':
          styled = true;
          break;
        default:
          if (arg[0] === '-') {
            die('illegal option: ' + arg);
          }
          process.argv.unshift(arg); // List of source files.
          break outer;
      }
    }

// process.argv contains the list of source files.
if (process.argv.length === 0) {
  process.argv.push('/dev/stdin');
}
else if (styled && !outFile && process.argv.length === 1) {
  // Use the source file name with .html extension for the output file.
  var inFile = process.argv[0];
  outFile = inFile.substr(0, inFile.lastIndexOf('.')) + '.html';
}

if (styled) {
  process.argv.unshift(path.resolve(__dirname, 'header.rmu'));
  process.argv.push(path.resolve(__dirname, 'footer.rmu'));
}

// Include $HOME/.rimurc file if it exists.
var homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var rimurc =  path.resolve(homeDir, '.rimurc');
if (!no_rimurc && fs.existsSync(rimurc)) {
  process.argv.unshift(rimurc);
}

// Convert Rimu source files to HTML.
var html = '';
if (source !== '') {
  html += Rimu.render(source) + '\n'; // --prepend option source.
}
while (!!(arg = process.argv.shift())) {
  if (!fs.existsSync(arg)) {
    die('source file does not exist: ' + arg);
  }
  try {
    source = fs.readFileSync(arg).toString();
  } catch (e) {
    die('source file permission denied: ' + arg);
  }
  html += Rimu.render(source, {safeMode: arg === rimurc ? 0 : safeMode}) + '\n';
}
html = html.trim() + '\n';
if (outFile) {
  fs.writeFileSync(outFile, html);
}
else {
  console.log(html);
}
