#!/usr/bin/env node
/*
 Command-lne app to check for broken local fragments in HTML file.
 */
var path = require('path');
var fs = require('fs');

var APP_NAME = 'fragment-checker';
var MANPAGE = 'NAME\n' +
  '  ' + APP_NAME + ' - check for broken local fragments in HTML file\n' +
  '\n' +
  'SYNOPSIS\n' +
  '  ' + APP_NAME + ' [OPTIONS] FILE\n' +
  '\n' +
  'DESCRIPTION\n' +
  '  Checks all local links (links with URLS starting with a #)\n' +
  '  in FILE have a corresponding target element with a matching\n' +
  '  id attribute.\n' +
  '\n' +
  '  This command useful for checking pages that use JavaScript to generate\n' +
  '  element ids because static HTML validators are unable to process\n' +
  '  dynamically generated content.\n' +
  '\n' +
  'OPTIONS\n' +
  '  -h, --help\n' +
  '    Display help message.\n';

function die(message) {
  console.error(message);
  process.exit(1);
}

// Skip executable and script paths.
process.argv.shift(); // Skip executable path.
process.argv.shift(); // Skip rimuc script path.

// Parse command-line options.
var infile;
outer:
  while (!!(arg = process.argv.shift())) {
    switch (arg) {
      case '--help':
      case '-h':
        console.log('\n' + MANPAGE);
        process.exit();
        break;
      default:
        if (arg[0] === '-') {
          die('error: illegal option: ' + arg);
        }
        infile = arg;
        break outer;
    }
  }

if (infile === undefined) {
  console.error('\n' + MANPAGE);
  process.exit(1);
}
if (!fs.existsSync(infile)) {
  die('error: source file does not exist: ' + infile);
}
try {
  html = fs.readFileSync(infile).toString();
}
catch (e) {
  die('error: source file permission denied: ' + infile);
}

function analyzeHTML(html, callback) {
var jsdom = require('jsdom'); // Don't require until we need to.
jsdom.env(
  {
    html: html,
    features: {
      FetchExternalResources: ['script'],
      ProcessExternalResources: ['script']
    },
    done: function(errors, window) {
      if (errors) {
        console.log('jsdom errors:');
        die(errors)
      }
      else {
        callback(window.document);
      }
    }
  }
);
}

function brokenUrlFragments(document) {
  // Find broken local URL fragments.
  var urls = [];
  var links = [].slice.call(document.body.getElementsByTagName('a'));
  links.forEach(function(link) {
    var url = link.getAttribute('href');
    if (url[0] === '#' && !document.getElementById(url.slice(1))) {
      urls.push(url);
    }
  });
  return urls;
}

analyzeHTML(html, function(document) {
  var urls = brokenUrlFragments(document);
  urls.forEach(function(url) {
    console.error('unmatched fragment: ' + url);
  });
  if (urls.length > 0) {
    die('errors: ' + urls.length + ' URL ' +
      (urls.length === 1 ? 'fragment does' : 'fragments do') +
      ' not have a matching target'
    );
  }
  process.exit(); // Otherwise get mysterious 20s delays before exiting when analysing tips.html.
});
