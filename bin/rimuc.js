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
    '  then its contents is processed after --prepend sources but before\n' +
    '  any other inputs. Rendered with safe-mode 0.\n' +
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
    '  --safe-mode NUMBER\n' +
    '    Specifies how to process inline and block HTML elements.\n' +
    '    --safe-mode 0 renders raw HTML (default),\n' +
    '    --safe-mode 1 drops raw HTML,\n' +
    '    --safe-mode 2 replaces raw HTML with text \'replaced HTML\'.\n' +
    '    --safe-mode 3 renders raw HTML as text.\n' +
    '\n' +
    '  -s, --styled\n' +
    '    Include HTML header and footer and CSS styling in output.\n' +
    '    If one source file is specified the output is written to\n' +
    '    same-named file with .html extension.\n' +
    '    Styled using Bootstrap.\n' +
    '    Set the {highlightjs} macro to a non-blank value to enable\n' +
    '    syntax highlighting with Highlight.js.\n' +
    '    Set the {mathjax} macro to a non-blank value to enable MathJax.\n';

// Helpers.
function die(message) {
  console.error(message);
  process.exit(1);
}

var safeMode = 0;
var styled = false;

// Skip command name.
if (process.argv.shift() === 'node') {
  process.argv.shift();
}
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
if (fs.existsSync(rimurc)) {
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
  source = fs.readFileSync(arg).toString();
  html += Rimu.render(source, {safeMode: arg === rimurc ? 0 : safeMode}) + '\n';
}
html = html.trim() + '\n';
if (outFile) {
  fs.writeFileSync(outFile, html);
}
else {
  console.log(html);
}
