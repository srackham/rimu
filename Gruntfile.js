module.exports = function(grunt) {
  'use strict';

  var shelljs = require('shelljs');
  var w3cjs = require('w3cjs');

  /* Inputs and outputs */

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

  var PKG = grunt.file.readJSON('package.json');


  /* Tasks */

  grunt.registerTask('default', ['compile', 'lint', 'uglify', 'test', 'docs', 'validate-html']);

  grunt.registerTask('lint', 'Lint Javascript and JSON files', function() {
    shelljs.exec('jshint ' + TESTS.join(' ') + ' bin/rimuc.js');
    shelljs.exec('jsonlint --quiet package.json');
  });

  grunt.registerTask('compile', 'Compile Typescript to JavaScript then uglify', function() {
    shelljs.exec('tsc --declaration --out bin/rimu.js ' + SOURCE.join(' '));
  });

  grunt.registerTask('uglify', 'Minimize compiled JavaScript', function() {
    var preamble = '/* ' + PKG.name + ' ' + PKG.version + ' (' + PKG.repository.url + ') */';
    shelljs.exec('uglifyjs --preamble "' + preamble + '" bin/rimu.js', {silent: true})
        .output
        .to('bin/rimu.min.js');
  });

  grunt.registerTask('test', 'Run unit tests', function() {
    TESTS.forEach(function(file) {
      shelljs.exec('nodeunit ' + file);
    });
  });

  grunt.registerTask('docs', 'Generate HTML documentation', function() {
    DOCS.forEach(function(doc) {
      shelljs.exec('node ./bin/rimuc.js --output ' + doc.dst
              + ' --prepend "{--title}=\'' + doc.title + '\'"'
              + ' doc/doc-header.rmu ' + doc.src + ' doc/doc-footer.rmu'
      )
    });
  });

  grunt.registerTask('version', 'Display or update the project version number. Use the --package-version option to set a new version number.', function() {
    var version = grunt.option('package-version');
    if (!version) {
      shelljs.echo('\nversion: ' + PKG.version);
    }
    else {
      if (!version.match(/^\d+\.\d+\.\d+$/)) {
        grunt.warn('Invalid version number: ' + version + '\n');
      }
      ['package.json', 'smart.json'].forEach(function(file) {
        shelljs.sed('-i', /(\n\s*"version"\s*:\s*)"\d+\.\d+\.\d+"/, '$1' + '"' + version + '"', file);
      });
    }
  });

  grunt.registerTask('commit', 'Commit changes to local Git repo. Use the --message option to set the commit message.', function() {
    var commit_message = grunt.option('m') || grunt.option('message');
    if (!commit_message) {
      grunt.warn('Missing command-line option: -m "commit-message"\n');
    }
    shelljs.exec('git commit -a -m "' + commit_message + '"');
  });

  grunt.registerTask('push', 'Push local commits to Github', function() {
    shelljs.exec('git push -u --tags origin master');
  });

  grunt.registerTask('publish', ['push', 'publish-npm', 'publish-meteor']);

  grunt.registerTask('publish-npm', 'Publish to npm', function() {
    shelljs.exec('npm publish');
  });

  grunt.registerTask('publish-meteor', 'Publish to Meteor', function() {
    shelljs.exec('mrt publish');
  });

  grunt.registerTask('validate-html', 'Validate HTML file with W3C Validator', function() {
    HTML.forEach(function(file) {
      var result = shelljs.exec('w3cjs validate ' + file, {silent: true});
      if (result.code != 0) {
        shelljs.echo(result.output);
        grunt.warn('Invalid HTML: ' + file + '\n');
      }
    });
  });

};

