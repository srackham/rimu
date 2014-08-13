module.exports = function(grunt) {

  require('shelljs/global');

  /* Inputs and outputs */

  // The source file compilation order is important.
  SOURCE = [
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

  TESTS = ls('test/*.js');

  DOCS = [
    {src: 'README.md', dst: 'doc/index.html', title: 'Rimu Markup'},
    {src: 'doc/tips.rmu', dst: 'doc/tips.html', title: 'Rimu Tips'},
    {src: 'doc/showcase.rmu', dst: 'doc/showcase.html', title: 'Rimu Showcase'}
  ];

  PKG = grunt.file.readJSON('package.json');


  /* Tasks */

  grunt.registerTask('default', ['compile', 'lint', 'uglify', 'test', 'docs']);

  grunt.registerTask('lint', 'Lint Javascript and JSON files', function() {
    exec('jshint ' + TESTS.join(' ') + ' bin/rimuc.js');
    exec('jsonlint --quiet package.json');
  });

  grunt.registerTask('compile', 'Compile Typescript to JavaScript then uglify', function() {
    exec('tsc --declaration --out bin/rimu.js ' + SOURCE.join(' '));
  });

  grunt.registerTask('uglify', 'Minimize compiled JavaScript', function() {
    var preamble = '/* ' + PKG.name + ' ' + PKG.version + ' (' + PKG.repository.url + ') */';
    exec('uglifyjs --preamble "' + preamble + '" bin/rimu.js', {silent: true})
        .output
        .to('bin/rimu.min.js');
  });

  grunt.registerTask('test', 'Run unit tests', function() {
    TESTS.forEach(function(file) {
      exec('nodeunit ' + file);
    });
  });

  grunt.registerTask('docs', 'Generate HTML documentation', function() {
    DOCS.forEach(function(doc) {
      exec('node ./bin/rimuc.js --output ' + doc.dst
              + ' --prepend "{--title}=\'' + doc.title + '\'"'
              + ' doc/doc-header.rmu ' + doc.src + ' doc/doc-footer.rmu'
      )
    });
  });

  grunt.registerTask('commit', 'Commit changes to local Git repo', function() {
    var commit_message = grunt.option('m') || grunt.option('message');
    if (!commit_message) {
      grunt.warn('Missing command-line option: -m "commit-message".');
    }
    exec('git commit -a -m "' + commit_message + '"');
  });

  grunt.registerTask('push', 'Push local commits to Github', function() {
    exec('git push -u --tags origin master');
  });

  grunt.registerTask('publish', ['push', 'publish-npm', 'publish-meteor']);

  grunt.registerTask('publish-npm', 'Publish to npm', function() {
    exec('npm publish');
  });

  grunt.registerTask('publish-meteor', 'Publish to Meteor', function() {
    exec('mrt publish');
  });

};

