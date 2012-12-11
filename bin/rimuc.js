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
'  rimuc [OPTIONS...] [FILE]\n' +
'\n' +
'DESCRIPTION\n' +
'Reads Rimu source markup from stdin, converts it to HTML then writes the HTML\n' +
'to stdout. If FILE is specified reads Rimu source from FILE.\n' +
'\n' +
'OPTIONS\n' +
'  --safe-mode\n' +
'    Specifies how to process inline and block HTML elements.\n' +
'    --safe-mode 0 renders raw HTML (default),\n' +
'    --safe-mode 1 drops raw HTML,\n' +
'    --safe-mode 2 replaces raw HTML with text \'replaced HTML\'.\n' +
'    --safe-mode 3 renders raw HTML as text.\n' +
'\n' +
'  -h, --help\n' +
'    Display help message.\n';

// Helpers.
function die(message) {
  console.error(message);
  process.exit(1);
}

// Options.
var safeMode = 0;
var inFile = '/dev/stdin';

// Skip command name.
if (process.argv.shift() === 'node') {
  process.argv.shift();
}
// Parse command-line options.
while (!!(arg = process.argv.shift())) {
  switch (arg) {
    case '--help':
    case '-h':
      console.log('\n' + MANPAGE);
      process.exit();
      break;
    case '--safe-mode':
      safeMode = parseInt(process.argv.shift() || 99, 10);
      if (safeMode < 0 || safeMode > 3) {
        die('illegal --safe-mode option value');
      }
      break;
    default:
      if (process.argv.length === 0) { // Last argument.
        inFile = arg;
        if (!fs.existsSync(inFile)) {
          die('source file does not exist: ' + inFile);
        }
      }
      else {
        die('illegal option: ' + arg);
      }
      break;
  }
}

// Convert Rimu to HTML.
var source = fs.readFileSync(inFile).toString();
var html = Rimu.render(source, {safeMode: safeMode});
console.log(html);
