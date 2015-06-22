#!/usr/bin/env node
/*
  Command-lne app to convert Rimu source to HTML.
  Run 'node rimu.js --help' for details.
*/

var path = require('path');
var fs = require('fs');
var Rimu = require('./rimu-commonjs2.js');

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
    '  then its contents is processed (with safeMode 0) after\n' +
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
    '    Rendered with safeMode 0.\n' +
    '\n' +
    '  --no-rimurc\n' +
    '    Do not process .rimurc from the user\'s home directory.\n' +
    '\n' +
    '  -s, --styled\n' +
    '    Include HTML header and footer and Bootstrap CSS styling in\n' +
    '    output. If only one source file is specified and the --output option\n' +
    '    is not used then the output is written to a same-named file with\n' +
    '    an .html extension.\n' +
    '\n' +
    '  --safeMode NUMBER\n' +
    '    Specifies how to process inline and block HTML elements.\n' +
    '    --safeMode 0 renders raw HTML (default).\n' +
    '    --safeMode 1 drops raw HTML.\n' +
    '    --safeMode 2 replaces raw HTML with htmlReplacement option text.\n' +
    '    --safeMode 3 renders raw HTML as text.\n' +
    '\n' +
    '  --macroMode NUMBER\n' +
    '    Specifies which Rimu macro invocations are processed.\n' +
    '    --macroMode 0 None.\n' +
    '    --macroMode 1 All (legacy version 4 default behavior).\n' +
    '    --macroMode 2 Only Defined macros.\n' +
    '    --macroMode 3 Only Reserved macros.\n' +
    '    --macroMode 4 Defined or Reserved macros (default behavior).\n' +
    '\n' +
    '  --htmlReplacement\n' +
    '    A string that replaces embedded HTML when safeMode is set to 2.\n' +
    '    Defaults to `<mark>replaced HTML</mark>`.\n' +
    '\n' +
    '  --title TITLE, --highlightjs, --mathjax, --toc, --section-numbers\n' +
    '    Shortcuts for prepended styling macro definitions:\n' +
    '    --prepend "{--title}=\'TITLE\'"\n' +
    '    --prepend "{--highlightjs}=\'true\'"\n' +
    '    --prepend "{--mathjax}=\'true\'"\n' +
    '    --prepend "{--toc}=\'true\'"\n' +
    '    --prepend "{--section-numbers}=\'true\'"\n' +
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
    '  --toc              Set to a non-blank value to generate a\n' +
    '                     table of contents (1).\n' +
    '  --section-numbers  Apply h2 and h3 section numbering (1).\n' +
    '  ______________________________________________________________\n' +
    '  (1) Must be defined prior to header (--prepend or .rimurc).\n' +
    '\n' +
    '  CSS class        Description\n' +
    '  ______________________________________________________________\n' +
    '  verse            Verse format (paragraphs, division blocks).\n' +
    '  sidebar          Sidebar format (paragraphs, division blocks).\n' +
    '  dl-numbered      Number labeled list items.\n' +
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
var macroMode = 4;
var htmlReplacement = null;
var styled = false;
var no_rimurc = false;

// Skip executable and script paths.
process.argv.shift(); // Skip executable path.
process.argv.shift(); // Skip rimuc script path.

// Parse command-line options.
var source = '';
var outfile;
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
          outfile = process.argv.shift();
          if (!outfile) {
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
        case '--safeMode':
        case '--safe-mode': // Deprecated in Rimu 5.0.0.
          safeMode = parseInt(process.argv.shift() || 99, 10);
          if (safeMode < 0 || safeMode > 3) {
            die('illegal --safeMode option value');
          }
          break;
        case '--macroMode':
          macroMode = parseInt(process.argv.shift() || 99, 10);
          if (macroMode < 0 || macroMode > 4) {
            die('illegal --macroMode option value');
          }
          break;
        case '--htmlReplacement':
          htmlReplacement = process.argv.shift();
          break;
        case '--styled':
        case '-s':
          styled = true;
          break;
        // Styling macro definitions shortcut options.
        case '--highlightjs':
        case '--mathjax':
        case '--section-numbers':
        case '--title':
        case '--toc':
          var macroValue = arg === '--title' ? process.argv.shift() : 'true';
          source += '{' + arg + "}='" + macroValue + "'\n";
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
var files = process.argv;
if (files.length === 0) {
  files.push('/dev/stdin');
}
else if (styled && !outfile && files.length === 1) {
  // Use the source file name with .html extension for the output file.
  outfile = files[0].substr(0, files[0].lastIndexOf('.')) + '.html';
}

if (styled) {
  // Envelope source files with header and footer.
  files.unshift(path.resolve(__dirname, 'header.rmu'));
  files.push(path.resolve(__dirname, 'footer.rmu'));
}

// Prepend $HOME/.rimurc file if it exists.
var homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var rimurc =  path.resolve(homeDir, '.rimurc');
if (!no_rimurc && fs.existsSync(rimurc)) {
  files.unshift(rimurc);
}

// Convert Rimu source files to HTML.
var html = '';
if (source !== '') {
  html += Rimu.render(source) + '\n'; // --prepend option source.
}
files.forEach(function (infile) {
  if (!fs.existsSync(infile)) {
    die('source file does not exist: ' + infile);
  }
  try {
    source = fs.readFileSync(infile).toString();
  } catch (e) {
    die('source file permission denied: ' + infile);
  }
  var options = {
      safeMode: infile === rimurc ? 0 : safeMode,
      macroMode: macroMode
    };
  if (htmlReplacement !== null) {
    options.htmlReplacement = htmlReplacement;
  }
  html += Rimu.render(source, options) + '\n';
});
html = html.trim() + '\n';
if (outfile) {
  fs.writeFileSync(outfile, html);
}
else {
  console.log(html);
}
