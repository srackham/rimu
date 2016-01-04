var test = require('tape');
var exec = require('child_process').exec;

function rimuc_exec(source, options, callback) {
  source = source.replace(/\n/g, '\\n');
  source = source.replace(/"/g, '\\x22');
  var command = '`which echo` -e "' + source + '" | ./bin/rimuc.js --no-rimurc ' + (options || '');
  exec(command, function(error, stdout, stderr) {
    callback(stdout);
  })
}

function rimuc_equal(t, source, expected, options, message) {
  rimuc_exec(source, options, function(actual) {
    t.equal(actual, expected, message)
  });
}

test('rimuc', function(t) {
  t.plan(14);

  rimuc_equal(t, '*Hello World!*', '<p><em>Hello World!</em></p>', '',
    'rimuc basic test');

  rimuc_equal(t, '{x}', '<p>X</p>', '--prepend "{x}=\'X\'"',
    'rimuc --prepend');

  rimuc_equal(t, '<br>', '<p><br></p>', '--safe-mode 0',
    'rimuc --safe-mode 0');

  rimuc_equal(t, '<br>', '<p></p>', '--safe-mode 1',
    'rimuc --safe-mode 1');

  rimuc_equal(t, '<br>', '<p><mark>replaced HTML</mark></p>', '--safe-mode 2',
    'rimuc --safe-mode 2');

  rimuc_equal(t, '<br>', '<p>&lt;br&gt;</p>', '--safe-mode 3',
    'rimuc --safe-mode 3');

  rimuc_equal(t, '<br>', '<p>X</p>', '--safe-mode 2 --htmlReplacement X',
    'rimuc --htmlReplacement');

  rimuc_exec('', '--help', function(actual) {
    t.ok(actual.indexOf('\nNAME\n  rimuc') === 0, 'rimuc --help')
  });

  rimuc_exec('', '--styled', function(actual) {
    t.ok(actual.startsWith('<!DOCTYPE HTML>'), 'rimuc --styled')
  });

  rimuc_exec('', '--styled --title X', function(actual) {
    t.ok(actual.indexOf('<title>X</title>') > 0, 'rimuc --title')
  });

  rimuc_exec('', '--styled --highlightjs', function(actual) {
    t.ok(actual.indexOf('<script>hljs.initHighlightingOnLoad();</script>') > 0, 'rimuc --highlightjs')
  });

  rimuc_exec('', '--styled --mathjax', function(actual) {
    t.ok(actual.indexOf('<script src="http://cdn.mathjax.org') > 0, 'rimuc --mathjax')
  });

  rimuc_exec('', '--styled --toc', function(actual) {
    t.ok(actual.indexOf('<div id="toc" class="no-print"></div>') > 0, 'rimuc --toc')
  });

  rimuc_exec('', '--styled --section-numbers', function(actual) {
    t.ok(actual.indexOf('body,h1 { counter-reset: h2-counter; }') > 0, 'rimuc --section-numbers')
  });

});

