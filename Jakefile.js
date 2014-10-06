/*
 * Jakefile for Rimu Markup (http://github.com/srackham/rimu).
 */
'use strict';

var pkg = require('./package.json');
var shelljs = require('shelljs');
var child_process = require('child_process');


/* Inputs and outputs */

var RIMU_JS = 'bin/rimu.js';
var MAIN_TS = 'src/main.ts';
var RIMU_MIN_JS = 'bin/rimu.min.js';
var SOURCE = shelljs.ls('src/*.ts');
var TESTS = shelljs.ls('test/*.js');
var TYPEDOC_DIR = 'doc/api';
var TYPEDOC_INDEX = TYPEDOC_DIR + '/index.html';

var DOCS = [
  {src: 'README.md', dst: 'doc/index.html', title: 'Rimu Markup'},
  {src: 'doc/tips.rmu', dst: 'doc/tips.html', title: 'Rimu Tips'},
  {src: 'doc/showcase.rmu', dst: 'doc/showcase.html', title: 'Rimu Showcase'}
];

var HTML = ['bin/rimuplayground.html'];
DOCS.forEach(function(doc) {
  HTML.push(doc.dst);
});


/* Utility functions. */

/*
 Execute shell commands in parallel then run the callback when they have all finished.
 `callback` defaults to the Jake async `complete` function.
 Abort if an error occurs.
 Write command output to the inherited stdout (unless the Jake --quiet option is set).
 Print a status message when each command starts and finishes (unless the Jake --quiet option is set).

 NOTE: This function is similar to the built-in jake.exec function but is twice as fast.
 */
function exec(commands, callback) {
  if (typeof commands === 'string') {
    commands = [commands];
  }
  callback = callback || complete;
  var remaining = commands.length;
  commands.forEach(function(command) {
    jake.logger.log('Starting: ' + command);
    child_process.exec(command, function(error, stdout, stderr) {
      jake.logger.log('Finished: ' + command);
      if (!jake.program.opts.quiet) {
        process.stdout.write(stdout);
      }
      if (error !== null) {
        fail(error, error.code);
      }
      remaining--;
      if (remaining === 0) {
        callback();
      }
    });
  });
}


/*
 Tasks

 All tasks are synchronous (another task will not run until the current task has completed).
 Consequently all task dependencies are executed asynchronously in declaration order.
 The `exec` function ensures shell commands within each task run in parallel.
 */

desc('Run test task.');
task('default', ['test']);

desc('compile, jslint, test, tslint, docs, validate-html.');
task('build', ['test', 'tslint', 'docs', 'validate-html']);

desc('Lint Javascript and JSON files.');
task('jslint', {async: true}, function() {
  var commands = TESTS.map(function(file) {
    return 'jshint ' + file;
  });
  commands.push('jsonlint --quiet package.json');
  exec(commands);
});

desc('Lint TypeScript source files.');
task('tslint', {async: true}, function() {
  var commands = SOURCE.map(function(file) {
    return 'tslint -f ' + file;
  });
  exec(commands);
});

desc('Run tests (recompile if necessary).');
task('test', ['compile', 'jslint'], {async: true}, function() {
  var commands = TESTS.map(function(file) {
    return 'nodeunit ' + file;
  });
  exec(commands);
});

desc('Compile Typescript to JavaScript then uglify.');
task('compile', [RIMU_JS, RIMU_MIN_JS]);

file(RIMU_JS, SOURCE, {async: true}, function() {
  exec('tsc --noImplicitAny --out ' + RIMU_JS + ' ' + MAIN_TS);
});

file(RIMU_MIN_JS, [RIMU_JS], {async: true}, function() {
  var preamble = '/* ' + pkg.name + ' ' + pkg.version + ' (' + pkg.repository.url + ') */';
  var command = 'uglifyjs  --preamble "' + preamble + '" --output ' + RIMU_MIN_JS + ' ' + RIMU_JS;
  exec(command);
});

desc('Create TypeDoc API documentation.');
task('api-docs', [TYPEDOC_INDEX]);

file(TYPEDOC_INDEX, SOURCE, {async: true}, function() {
  shelljs.rm('-rf', TYPEDOC_DIR);
  exec('typedoc --out ' + TYPEDOC_DIR + ' ./src');
});

desc('Generate HTML documentation');
task('docs', ['api-docs'], {async: true}, function() {
  var commands = DOCS.map(function(doc) {
    return 'node ./bin/rimuc.js --output ' + doc.dst +
      ' --prepend "{--title}=\'' + doc.title + '\'"' +
      ' doc/doc-header.rmu ' + doc.src + ' doc/doc-footer.rmu';
  });
  exec(commands);
});

desc('Validate HTML documents with W3C Validator.');
task('validate-html', {async: true}, function() {
  var commands = HTML.map(function(file) {
    return 'w3cjs validate ' + file;
  });
  exec(commands);
});

desc('Display or update the project version number. Use vers=x.y.z syntax to set a new version number.');
task('version', function() {
  var version = process.env.vers;
  if (!version) {
    console.log('\nversion: ' + pkg.version);
  }
  else {
    if (!version.match(/^\d+\.\d+\.\d+$/)) {
      fail('Invalid version number: ' + version + '\n');
    }
    ['package.json'].forEach(function(file) {
      shelljs.sed('-i', /(\n\s*"version"\s*:\s*)"\d+\.\d+\.\d+"/, '$1' + '"' + version + '"', file);
    });
  }
});

desc('Create tag ' + pkg.version);
task('tag', ['test'], {async: true}, function() {
  exec('git tag -a -m "Tag ' + pkg.version + '" ' + pkg.version);
});

desc('Commit changes to local Git repo.');
task('commit', ['test'], {async: true}, function() {
  jake.exec('git commit -a', {interactive: true}, complete);
});

desc('push, publish-npm.');
task('publish', ['push', 'publish-npm']);

desc('Push local commits to Github.');
task('push', ['test'], {async: true}, function() {
  exec('git push -u --tags origin master');
});

desc('Publish to npm.');
task('publish-npm', {async: true}, ['test'], function() {
  exec('npm publish');
});

