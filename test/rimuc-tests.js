var test = require('tape');
var exec = require('child_process').exec;

// source: Rimu source.
// options: rimuc command options.
// callback(output, error): output=stdout+stderr, error=exit code
function rimuc_exec(source, options, callback) {
  source = source.replace(/\n/g, '\\n');
  source = source.replace(/"/g, '\\x22');
  var command = '`which echo` -e "' + source + '" | ./bin/rimuc.js --no-rimurc ' + (options || '');
  exec(command, function(error, stdout, stderr) {
    callback(stdout + stderr, error);
  })
}

function rimuc_equal(t, source, expected, options, message) {
  rimuc_exec(source, options, function(output) {
    t.equal(output, expected, message)
  });
}

test('rimuc', function(t) {
  t.plan(22);

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

  rimuc_equal(t, '."color:red"\nHello World!', '<p>Hello World!</p>', '--safe-mode 5',
    'rimuc --safe-mode 5');

  rimuc_equal(t, '<br>', '<p>X</p>', '--safe-mode 2 --html-replacement X',
    'rimuc --html-replacement');

  rimuc_exec('', '--help', function(output) {
    t.ok(output.indexOf('\nNAME\n  rimuc') === 0, 'rimuc --help')
  });

  rimuc_exec('', '--styled', function(output) {
    t.ok(output.startsWith('<!DOCTYPE HTML>'), 'rimuc --styled')
  });

  rimuc_exec('', '--styled --title X', function(output) {
    t.ok(output.indexOf('<title>X</title>') > 0, 'rimuc --title')
  });

  rimuc_exec('', '--styled --highlightjs', function(output) {
    t.ok(output.indexOf('<script>hljs.initHighlightingOnLoad();</script>') > 0, 'rimuc --highlightjs')
  });

  rimuc_exec('', '--styled --mathjax', function(output) {
    t.ok(output.indexOf('<script src="http://cdn.mathjax.org') > 0, 'rimuc --mathjax')
  });

  rimuc_exec('', '--styled --toc', function(output) {
    t.ok(output.indexOf('<div id="toc"') > 0, 'rimuc --toc (DEPRECATED)')
  });

  rimuc_exec('', '--styled --sidebar-toc', function(output) {
    t.ok(output.indexOf('<div id="toc"') > 0, 'rimuc --sidebar-toc')
  });

  rimuc_exec('', '--styled --dropdown-toc', function(output) {
    t.ok(output.indexOf('<div id="toc-button"') > 0, 'rimuc --dropdown-toc')
  });

  rimuc_exec('', '--styled --sidebar-toc --custom-toc', function(output) {
    t.ok(output.indexOf('<div id="toc"') === -1, 'rimuc --sidebar-toc --custom-toc')
  });

  rimuc_exec('', '--styled --section-numbers', function(output) {
    t.ok(output.indexOf('body,h1 { counter-reset: h2-counter; }') > 0, 'rimuc --section-numbers')
  });

  rimuc_exec('{x}', '--lint', function(output, error) {
    t.ok(output.indexOf('undefined macro') > 0 && error.code === 1, 'rimuc --lint')
  });

  rimuc_exec('_Hello World!_', '--styled --styled-name "classic"', function(output) {
    t.ok(output.indexOf('<p><em>Hello World!</em></p') > 0, 'classic named style')
  });

  rimuc_exec('_Hello World!_', '--styled --styled-name "flex"', function(output) {
    t.ok(output.indexOf('<p><em>Hello World!</em></p') > 0, 'flex named style')
  });

  rimuc_exec('_Hello World!_', '--styled --styled-name "v8"', function(output) {
    t.ok(output.indexOf('<p><em>Hello World!</em></p') > 0, 'v8 named style')
  });

});

