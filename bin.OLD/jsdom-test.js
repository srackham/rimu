#!/usr/bin/env node
/*
 Command-lne app to check for broken local fragments in HTML file.
 */
var path = require('path');
var fs = require('fs');
var jsdom = require('jsdom');

function die(message) {
  console.error(message);
  process.exit(1);
}

var infile = process.argv[2];
if (!infile) {
  die('usage: jsdom-test FILE');
}
if (!fs.existsSync(infile)) {
  die('source file does not exist: ' + infile);
}
try {
  html = fs.readFileSync(infile).toString();
} catch (e) {
  die('source file permission denied: ' + infile);
}

jsdom.env(
  {
    html: html,
    features: {
      FetchExternalResources: ['script'],
      ProcessExternalResources: ['script']
    },
    done: function(errors, window) {
      if (errors) {
        die(errors)
      }
      else {
        var urls = brokenUrlFragments(window.document);
        urls.forEach( function(url) { console.log('invalid fragment: ' + url); } );
        if (urls.length > 0) {
          die('errors: ' + urls.length + ' invalid URL fragment(s)');
        }
      }
    }
  }
);

function brokenUrlFragments(document) {
  // Highlight broken local URL fragments.
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

