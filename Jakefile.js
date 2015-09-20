/*
 * Jakefile for Rimu Markup (http://github.com/srackham/rimu).
 */
'use strict';

var pkg = require('./package.json');
var shelljs = require('shelljs');
var child_process = require('child_process');


/* Inputs and outputs */

var RIMU_LIB = 'bin/rimu.js';
var RIMU_LIB_MIN = 'bin/rimu.min.js';
var MAIN_TS = 'src/main.ts';
var SOURCE = shelljs.ls('src/*.ts');
var TESTS = shelljs.ls('test/*.js');
var GH_PAGES_DIR = './gh-pages/';
var RIMUC = './bin/rimuc.js';

var DOCS = [
  {
    src: 'README.md', dst: 'doc/index.html', title: 'Rimu Markup',
    rimucOptions: '--toc'
  },
  {
    src: 'CHANGELOG.md', dst: 'doc/CHANGELOG.html', title: 'Rimu Change Log',
    rimucOptions: '--toc'
  },
  {
    src: 'doc/reference.rmu', dst: 'doc/reference.html', title: 'Rimu Reference',
    rimucOptions: '--toc --prepend "{generate-examples}=\'yes\'"'
  },
  {
    src: 'doc/tips.rmu', dst: 'doc/tips.html', title: 'Rimu Tips',
    rimucOptions: '--toc --prepend "{generate-examples}=\'yes\'"'
  },
  {
    src: 'doc/rimuplayground.rmu', dst: 'doc/rimuplayground.html', title: 'Rimu Playground',
    rimucOptions: '--toc --prepend "{generate-examples}=\'yes\'"'
  }
];

var HTML = [];
DOCS.forEach(function(doc) {
  HTML.push(doc.dst);
});


/* Utility functions. */

/*
 Execute shell commands in parallel then run the `callback` when they have all finished.
 Abort if an error occurs.
 Write command output to the inherited stdout (unless the Jake --quiet option is set).
 Print a status message when each command starts and finishes (unless the Jake --quiet option is set).

 NOTE: This function is similar to the built-in jake.exec function but is twice as fast.
 */
function exec(commands, callback) {
  if (typeof commands === 'string') {
    commands = [commands];
  }
  var remaining = commands.length;
  if (remaining === 0) {
    callback();
  }
  else {
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
  exec(commands, complete);
});

desc('Lint TypeScript source files.');
task('tslint', {async: true}, function() {
  var commands = SOURCE.map(function(file) {
    return 'tslint ' + file;
  });
  exec(commands, complete);
});

desc('Run tests (recompile if necessary).');
task('test', ['compile', 'jslint'], {async: true}, function() {
  var commands = TESTS.map(function(file) {
    return 'tape ' + file + ' | faucet';
  });
  exec(commands, complete);
});

desc('Compile Typescript to JavaScript then bundle CommonJS and scriptable libraries.');
task('compile', [RIMU_LIB]);

file(RIMU_LIB, [MAIN_TS], {async: true}, function() {
  exec('webpack -d', complete);
});

file(RIMU_LIB_MIN, [MAIN_TS], {async: true}, function() {
  exec('webpack -p --output-filename ' + RIMU_LIB_MIN, function () {
    // Prepend package name and version.
    var preamble = '/* ' + pkg.name + ' ' + pkg.version + ' (' + pkg.repository.url + ') */\n';
    (preamble + shelljs.cat(RIMU_LIB_MIN)).to(RIMU_LIB_MIN);
    complete();
  });
});

desc('Generate HTML documentation');
task('html-docs', [RIMU_LIB_MIN], {async: true}, function() {
  var commands = DOCS.map(function(doc) {
    return 'node ' + RIMUC +
      ' --styled --lint --no-rimurc' +
      ' --output "' + doc.dst + '"' +
      ' --title "' + doc.title + '"' +
      ' ' + doc.rimucOptions + ' ' +
      ' ./examples/.rimurc ./doc/doc-header.rmu ' + doc.src;
  });
  exec(commands, complete);
});

desc('Validate HTML documents with W3C Validator.');
task('validate-html', {async: true}, function() {
  var commands = HTML.map(function(file) {
    return 'nu-html-checker ' + file;
  });
  exec(commands, complete);
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
    exec('git commit -m "Bump version number." package.json', complete);
  }
});

desc('Create tag ' + pkg.version);
task('tag', ['test'], {async: true}, function() {
  exec('git tag -a -m "Tag ' + pkg.version + '" ' + pkg.version, complete);
});

desc('Commit changes to local Git repo.');
task('commit', ['test'], {async: true}, function() {
  jake.exec('git commit -a', {interactive: true}, complete);
});

desc('push, publish-npm.');
task('publish', ['push', 'publish-npm']);

desc('Push local commits to Github.');
task('push', ['test'], {async: true}, function() {
  exec('git push -u --tags origin master', complete);
});

desc('Publish to npm.');
task('publish-npm', {async: true}, ['test', RIMU_LIB_MIN], function() {
  exec('npm publish', complete);
});

desc('Rebuild and validate documentation then commit and publish to GitHub Pages');
task('release-gh-pages', ['build-gh-pages', 'commit-gh-pages', 'push-gh-pages']);

desc('Generate documentation and copy to local gh-pages repo');
task('build-gh-pages', ['html-docs', 'validate-html'], function() {
  shelljs.cp('-f', HTML.concat(RIMU_LIB_MIN), GH_PAGES_DIR)
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
