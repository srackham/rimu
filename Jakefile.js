/*
 * Jakefile for Rimu Markup (http://github.com/srackham/rimu).
 */
'use strict';

var pkg = require('./package.json');
var shelljs = require('shelljs');
var child_process = require('child_process');


/* Inputs and outputs */

var RIMU_VAR_LIB = 'bin/rimu-var.js';  // Script tag library format.
var RIMU_VAR_LIB_MIN = 'bin/rimu-var.min.js';
var RIMU_COMMONJS2_LIB = 'bin/rimu-commonjs2.js';  // Npm library format.
var MAIN_TS = 'src/main.ts';
var MAIN_JS = 'out/main.js';
var SOURCE = shelljs.ls('src/*.ts');
var TESTS = shelljs.ls('test/*.js');
var GH_PAGES_DIR = './gh-pages/';
var RIMUC = './bin/rimuc.js';

var DOCS = [
  {src: 'README.md', dst: 'doc/index.html', title: 'Rimu Markup', hasToc: true},
  {src: 'CHANGELOG.md', dst: 'doc/CHANGELOG.html', title: 'Rimu Change Log', hasToc: true},
  {src: 'doc/reference.rmu', dst: 'doc/reference.html', title: 'Rimu Reference', hasToc: true},
  {src: 'doc/tips.rmu', dst: 'doc/tips.html', title: 'Rimu Tips', hasToc: true},
  {src: 'doc/rimuplayground.rmu', dst: 'doc/rimuplayground.html', title: 'Rimu Playground', hasToc: true}
];

var HTML = [];
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
  if (remaining === 0) {
    callback();
  } else {
    commands.forEach(function(command) {
      jake.logger.log('Starting: ' + command);
      child_process.exec(command, function(error, stdout, stderr) {
        if (!jake.program.opts.quiet) {
          process.stdout.write(stdout);
        }
        if (error !== null) {
          fail(error, error.code);
        }
        jake.logger.log('Finished: ' + command);
        remaining--;
        if (remaining === 0) {
          callback();
        }
      });
    });
  }
}


/*
 Tasks

 All tasks are synchronous (another task will not run until the current task has completed).
 Consequently all task dependencies are executed asynchronously in declaration order.
 The `exec` function ensures shell commands within each task run in parallel.
 */

desc('Run test task.');
task('default', ['test']);

desc('compile, jslint, test, tslint, build-gh-pages, validate-html.');
task('build', ['test', 'tslint', 'build-gh-pages', 'validate-html']);

desc('Update version number, tag and push to Github and npm. Use vers=x.y.z argument to set a new version number. Finally, rebuild and publish docs website.');
task('release', ['build', 'version', 'tag', 'publish', 'release-gh-pages']);

desc('Lint Javascript and JSON files.');
task('jslint', {async: true}, function() {
  var commands = TESTS.concat([RIMUC]).map(function(file) {
    return 'jshint ' + file;
  });
  commands.push('jsonlint --quiet package.json');
  exec(commands);
});

desc('Lint TypeScript source files.');
task('tslint', {async: true}, function() {
  complete(); return  // TODO: Uncomment when tslint is compatible with TypeScript 1.5.
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

// TODO: Fix me.
desc('Compile Typescript to JavaScript then bundle CommonJS and scriptable libraries.');
task('compile', [MAIN_JS, RIMU_VAR_LIB, RIMU_COMMONJS2_LIB, RIMU_VAR_LIB_MIN]);

file(MAIN_JS, SOURCE, {async: true}, function() {
  shelljs.rm('./out/*');
  exec('tsc --project .');
});

file(RIMU_COMMONJS2_LIB, [MAIN_JS], {async: true}, function() {
  exec('webpack');
});

file(RIMU_VAR_LIB, [MAIN_JS], {async: true}, function() {
  exec('webpack --output-library-target var --output-file ' + RIMU_VAR_LIB);
});

function minify(src, dst) {
  var preamble = '/* ' + pkg.name + ' ' + pkg.version + ' (' + pkg.repository.url + ') */';
  var command = 'uglifyjs  --preamble "' + preamble + '" --output ' + dst + ' ' + src;
  exec(command);
};

file(RIMU_VAR_LIB_MIN, [RIMU_VAR_LIB], {async: true}, function() {
  minify(RIMU_VAR_LIB, RIMU_VAR_LIB_MIN)
});

desc('Generate HTML documentation');
task('html-docs', {async: true}, function() {
  var commands = DOCS.map(function(doc) {
    return 'node ./bin/rimuc.js' +
      ' --styled --no-rimurc' +
      ' --output "' + doc.dst + '"' +
      ' --title "' + doc.title + '"' +
      (doc.hasToc ? ' --toc' : '' ) +
      ' ./examples/.rimurc ./doc/doc-header.rmu ' + doc.src;
  });
  exec(commands);
});

desc('Validate HTML documents with W3C Validator.');
task('validate-html', {async: true}, function() {
  var commands = HTML.map(function(file) {
    return 'nu-html-checker ' + file;
  });
  exec(commands);
});

desc('Display or update the project version number. Use vers=x.y.z argument to set a new version number.');
task('version', {async: true}, function() {
  var version = process.env.vers;
  if (!version) {
    console.log('\nversion: ' + pkg.version);
    complete();
  }
  else {
    if (!version.match(/^\d+\.\d+\.\d+$/)) {
      fail('Invalid version number: ' + version + '\n');
    }
    shelljs.sed('-i', /(\n\s*"version"\s*:\s*)"\d+\.\d+\.\d+"/, '$1' + '"' + version + '"', 'package.json');
    pkg.version = version;
    exec('git commit -m "Bump version number." package.json');
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

desc('Rebuild and validate documentation then commit and publish to GitHub Pages');
task('release-gh-pages', ['build-gh-pages', 'commit-gh-pages', 'push-gh-pages']);

desc('Generate documentation and copy to local gh-pages repo');
task('build-gh-pages', ['html-docs', 'validate-html'], function() {
  shelljs.cp('-f', HTML.concat(RIMU_VAR_LIB), GH_PAGES_DIR)
});

desc('Commit changes to local gh-pages repo. Use msg=\'commit message\' to set a custom commit message.');
task('commit-gh-pages', ['test'], {async: true}, function() {
  var msg = process.env.msg;
  if (!msg) {
    msg = 'rebuilt project website';
  }
  shelljs.cd(GH_PAGES_DIR);
  exec('git commit -a -m "' + msg + '"', function () {
    shelljs.cd('..');
    complete();
  });
});

desc('Push gh-pages commits to Github.');
task('push-gh-pages', ['test'], {async: true}, function() {
  shelljs.cd(GH_PAGES_DIR);
  exec('git push origin gh-pages', function () {
    shelljs.cd('..');
    complete();
  });
});
