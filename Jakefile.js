/*
 * Jakefile for Rimu Markup (http://github.com/srackham/rimu).
 */
'use strict';

var shelljs = require('shelljs');


/* Inputs and outputs */

var JAKEFILE = 'Jakefile.js';
var RIMU_JS = 'bin/rimu.js';
var RIMU_MIN_JS = 'bin/rimu.min.js';
var RIMUC_JS = 'bin/rimuc.js';

// The source file compilation order is important.
var SOURCE = [
  'src/rimu.ts',
  'src/helpers.ts',
  'src/options.ts',
  'src/io.ts',
  'src/macros.ts',
  'src/lineblocks.ts',
  'src/delimitedblocks.ts',
  'src/lists.ts',
  'src/spans.ts',
  'src/quotes.ts',
  'src/replacements.ts'
];

var TESTS = shelljs.ls('test/*.js');

var DOCS = [
  {src: 'README.md', dst: 'doc/index.html', title: 'Rimu Markup'},
  {src: 'doc/tips.rmu', dst: 'doc/tips.html', title: 'Rimu Tips'},
  {src: 'doc/showcase.rmu', dst: 'doc/showcase.html', title: 'Rimu Showcase'}
];

var HTML = ['bin/rimuplayground.html'];
DOCS.forEach(function(doc) {
  HTML.push(doc.dst);
});

var PKG = JSON.parse(shelljs.cat('package.json'));


/* Utility functions. */

// shelljs.exec() wrapper.
// I don't use jake.exec() because it runs asynchronously and has no synchronous option.
function exec(command, options) {
  options = options || {};
  if (jake.program.opts.quiet) {
    options.silent = true; // Honor --quiet flag.
  }
  var result = shelljs.exec(command, options);
  if (result.code != 0) {
    if (options.silent) {
      shelljs.echo(result.output);
    }
    var msg = options.errorMessage || 'Error executing: ' + command;
    fail(msg, result.code);
  }
  return result;
}


/* Tasks */

desc('Run test task.');
task('default', ['test']);

desc('compile, lint, test, docs, validate-html.');
task('build', ['test', 'docs', 'validate-html']);

desc('Lint Javascript and JSON files.');
task('lint', function() {
  exec('jshint ' + TESTS.join(' ') + ' ' + RIMUC_JS);
  exec('jsonlint --quiet package.json');
});

desc('Run tests (recompile if necessary).');
task('test', ['compile', 'lint'], function() {
  TESTS.forEach(function(file) {
    // Use the TAP reporter because the default color terminal reporter intermittently
    // omits output when invoked with shelljs.exec().
    exec('nodeunit --reporter tap ' + file, {silent: true});
  });
});

desc('Compile Typescript to JavaScript then uglify');
task('compile', [RIMU_JS, RIMU_MIN_JS]);

file(RIMU_JS, SOURCE.concat(JAKEFILE), function() {
  exec('tsc --noImplicitAny --declaration --out ' + RIMU_JS + ' ' + SOURCE.join(' '));
});

file(RIMU_MIN_JS, [RIMU_JS], function() {
  var preamble = '/* ' + PKG.name + ' ' + PKG.version + ' (' + PKG.repository.url + ') */';
  exec('uglifyjs  --preamble "' + preamble + '" --output ' + RIMU_MIN_JS + ' ' + RIMU_JS);
});

desc('Generate HTML documentation');
task('docs', function() {
  DOCS.forEach(function(doc) {
    exec('node ./bin/rimuc.js --output ' + doc.dst
            + ' --prepend "{--title}=\'' + doc.title + '\'"'
            + ' doc/doc-header.rmu ' + doc.src + ' doc/doc-footer.rmu'
    )
  });
});

desc('Validate HTML file with W3C Validator.');
task('validate-html', function() {
  HTML.forEach(function(file) {
    exec('w3cjs validate ' + file, {silent: true, errorMessage: 'Invalid HTML: ' + file});
  });
});

desc('Display or update the project version number. Use vers=x.y.z syntax to set a new version number.');
task('version', function() {
  var version = process.env.vers;
  if (!version) {
    shelljs.echo('\nversion: ' + PKG.version);
  }
  else {
    if (!version.match(/^\d+\.\d+\.\d+$/)) {
      fail('Invalid version number: ' + version + '\n');
    }
    ['package.json', 'smart.json'].forEach(function(file) {
      shelljs.sed('-i', /(\n\s*"version"\s*:\s*)"\d+\.\d+\.\d+"/, '$1' + '"' + version + '"', file);
    });
  }
});

var tag = 'v' + PKG.version;  // The 'v' prefix is required by Meteor package management (https://groups.google.com/forum/#!topic/meteor-talk/Q6fAH9tR27Q).
desc('Create tag ' + tag);
task('tag', ['test'], function() {
  shelljs.echo('git tag -a -m "Tag ' + tag + '" ' + tag);
});

desc('Commit changes to local Git repo. Use message="commit message" syntax to set the commit message.');
task('commit', ['test'], function() {
  var commit_message = process.env.message;
  if (!commit_message) {
    fail('Missing message environment variable: message="commit message"\n');
  }
  exec('git commit -a -m "' + commit_message + '"');
});

desc('push, publish-npm, publish-meteor.');
task('publish', ['push', 'publish-npm', 'publish-meteor']);

desc('Push local commits to Github.');
task('push', ['test'], function() {
  exec('git push -u --tags origin master');
});

desc('Publish to npm.');
task('publish-npm', ['test'], function() {
  exec('npm publish');
});

desc('Publish to Meteor.');
task('publish-meteor', ['test'], function() {
  exec('mrt publish .');
});

