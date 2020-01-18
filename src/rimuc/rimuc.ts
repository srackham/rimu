/*
  Command-lne app to convert Rimu source to HTML.
  Run 'node rimu.js --help' for details.
*/

import * as fs from 'fs'
import * as path from 'path'
import * as rimu from 'rimu'

const VERSION = '11.1.4'
const STDIN = '/dev/stdin'
const HOME_DIR = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']
const RIMURC = path.resolve(HOME_DIR || '', '.rimurc')

// Helpers.
function die(message: string): void {
  console.error(message)
  process.exit(1)
}

function readResourceFile(name: string): string {
  return require(`./resources/${name}`).default
}

function importLayoutFile(name: string): string {
  // DEPRECATED as of 11.0.0.
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
      console.log('\n' + readResourceFile('manpage.txt'))
      process.exit()
      break
    case '--version':
      console.log(VERSION)
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
    case '--styled':
    case '-s':
      prepend += '{--header-ids}=\'true\'\n'
      prepend += '{--no-toc}=\'true\'\n'
      layout = 'sequel'
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
