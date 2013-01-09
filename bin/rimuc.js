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
'OPTIONS\n' +
'  -h, --help\n' +
'    Display help message.\n' +
'\n' +
'  -o, --output OUTFILE\n' +
'    Write output to file OUTFILE instead of stdout.\n' +
'\n' +
'  --safe-mode\n' +
'    Specifies how to process inline and block HTML elements.\n' +
'    --safe-mode 0 renders raw HTML (default),\n' +
'    --safe-mode 1 drops raw HTML,\n' +
'    --safe-mode 2 replaces raw HTML with text \'replaced HTML\'.\n' +
'    --safe-mode 3 renders raw HTML as text.\n';

// Helpers.
function die(message) {
  console.error(message);
  process.exit(1);
}

var safeMode = 0;
var inFile = '';

// Skip command name.
if (process.argv.shift() === 'node') {
  process.argv.shift();
}
// Parse command-line options.
var source = '';
var outFile;
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
    case '--safe-mode':
      safeMode = parseInt(process.argv.shift() || 99, 10);
      if (safeMode < 0 || safeMode > 3) {
        die('illegal --safe-mode option value');
      }
      break;
    default:
      if (arg[0] === '-') {
        die('illegal option: ' + arg);
      }
      inFile = arg;
      if (!fs.existsSync(inFile)) {
        die('source file does not exist: ' + inFile);
      }
      source += fs.readFileSync(inFile).toString();
      source += '\n\n';  // Separate sources with blank line.
      break;
  }
}
if (!inFile) {
  source = fs.readFileSync('/dev/stdin').toString();
}

// Convert Rimu to HTML.
var html = Rimu.render(source, {safeMode: safeMode});
if (outFile) {
  fs.writeFileSync(outFile, html);
}
else {
  console.log(html);
}
