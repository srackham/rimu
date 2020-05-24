#!/usr/bin/env node
'use strict'

/*
TODO: Currently does weird things when input files have DOS line termination
(only works with UNIX termination).
*/

let fs = require('fs')

let MANPAGE = `NAME
  tomarkdown - convert Rimu and AsciiDoc syntaxes to Markdown subset

SYNOPSIS
  tomarkdown [OPTIONS...] INFILE

DESCRIPTION
  Convert some Rimu and AsciiDoc syntaxes to Rimu's Markdown subset.
  Does a reasonable job but is not rigourous and you should eyeball
  the results.

  - Convert Rimu '=' style headers to Markdown compatible '#' style.
  - Convert '=' and '-' underline headers to '#' single-line headers.
  - Convert Rimu '<url|caption>' links to Markdown '[caption](url)' style.
  - Optionally change resize indent on Indended paragraphs.

  If INFILE is - then read from stdin.

OPTIONS
  -h, --help
    Display this help message.

  -a, --asciidoc
    - Convert AsciiDoc 'url[caption]' links to Markdown '[caption](url)' style.
    - Convert AsciiDoc 'image::url[alt]' links to Markdown '![alt](url)' style.
    - Convert '~', '^' and '+' underline headers to '#' single-line headers.
    - Erase AsciiDoc list item continuations.
    - Convert Quote and Sidebar blocks to Rimu Quote block.
    - Block title to '######' single-line h6 header.

  -i, --indent N
    Set left margin on Indented paragraphs to N spaces.
    May generate some false positives inside delimited Code blocks.

  -o, --output OUTFILE
    Write output to file OUTFILE instead of stdout.
`

// Helpers.
function die(message) {
  console.error(message)
  process.exit(1)
}

// Skip executable and script paths.
process.argv.shift(); // Skip executable path.
process.argv.shift(); // Skip rimuc script path.

// Parse command-line options.
let inFile
let outFile
let asciidoc = false
let indent
let arg
outer:
  while (!!(arg = process.argv.shift())) {
    switch (arg) {
      case '--asciidoc':
      case '-a':
        asciidoc = true
        break
      case '--help':
      case '-h':
        console.log('\n' + MANPAGE)
        process.exit()
        break
      case '--indent':
      case '-i':
        arg = parseInt(process.argv.shift())
        if (isNaN(arg) || arg < 0 || arg > 80) {
          die('illegal --indent option value');
        }
        indent = arg
        break;
      case '--output':
      case '-o':
        outFile = process.argv.shift()
        if (!outFile) {
          die('missing --output file name')
        }
        break
      default:
        if (arg !== '-' && arg[0] === '-') {
          die('illegal option: ' + arg)
        }
        inFile = arg
        break outer
    }
  }

if (process.argv.length > 0) {
  die('to many arguments')
}
if (!inFile) {
  die('no input file specified')
}
if (!inFile || inFile === '-') {
  inFile = '/dev/stdin'
}
if (!fs.existsSync(inFile)) {
  die('input file does not exist: ' + inFile)
}

let source = ''
try {
  source = fs.readFileSync(inFile).toString()
} catch (e) {
  die('source file permission denied: ' + inFile)
}

const REPLACEMENTS = [
  [/<(https?:\/\/\S.*?)\|(\S[^]*?)>/g, '[$2]($1)'], // Rimu <url|caption> -> Markdown link.
  [/^={1,6} /gm, function(match) {                  // '=' header-> '#' header.
    return match.replace(/=/g, '#')
  }],
  [/(^\n?|\n{2})(\S.*?)\n(={3,}|-{3,})(?=\n)/g,     // Underline headers -> '#' headers.
    function(match, g1, g2, g3) {
      if (g2.length !== g3.length) {
        return match
      }
      const headerMap = {'=': '#', '-': '##'}
      return g1 + headerMap[g3[0]] + ' ' + g2 + '\n'
    }
  ],
  [/^-+$/gm, '```'],                                // '-' delimited Code block -> Fenced code block.
]

const ASCIIDOC_REPLACEMENTS = [
  [/\bimage::(\S+?)\[(|\S[^]*?)\]/g, '![$2]($1)'],     // AsciiDoc image -> Markdown image.
  [/(\bhttps?:\/\/\S+?)\[(\S[^]*?)\]/g, '[$2]($1)'],   // AsciiDoc link -> Markdown link.
  [/^(\+|--)$/gm, ''],                                  // Erase list item continuations.
  [/^(_{3,}|\*{3,})$/gm, '""'],                         // Quote and Sidebar block -> Rimu Quote block.
  [/(^\n?|\n{2})(\S.*?)\n(~{3,}|\^{3,}|\+{3,})(?=\n)/g, // Underline headers -> '#' headers.
    function(match, g1, g2, g3) {
      if (g2.length !== g3.length) {
        return match
      }
      const headerMap = {'~': '###', '^': '####', '+': '#####'}
      return g1 + headerMap[g3[0]] + ' ' + g2 + '\n'
    }
  ],
  [/^\.([^.\s].*)$/gm, '###### $1'],                 // Block title -> h6 header
]

let result = source

if (asciidoc) {
  for (let replacement of ASCIIDOC_REPLACEMENTS) {
    result = result.replace(replacement[0], replacement[1])
  }
}

for (let replacement of REPLACEMENTS) {
  result = result.replace(replacement[0], replacement[1])
}

if (indent !== undefined) {
  result = result.replace(/(^\n?|\n{2})( +\S[^]*?)(?=\n\n|\n?$)/g, function(match, m1, m2) {
    if (m2.search(/^ +(-|[*:.]{1,4}|\d+\.) +\S/) !== -1) { // Don't match indented list items.
      return match
    }
    // Examine all lines in the indented paragraph and calculate the indent.
    let old_indent = m2.search(/\S/)
    for (let line of m2.split('\n')) {
      if (line.search(/\S/) < old_indent) {
        old_indent = line.search(/\S/)
      }
    }
    let indent_change = indent - old_indent
    //console.log(old_indent, indent_change)
    return m1 + m2.replace(/^ */gm, function(match) {
        let new_indent = match.length + indent_change
        if (new_indent >= indent) { // Only add to indent, do not truncate start of line.
          return ' '.repeat(new_indent)
        }
        else {
          return ' '.repeat(indent)
        }
      })
  })
}

if (outFile) {
  fs.writeFileSync(outFile, result)
}
else {
  console.log(result)
}
