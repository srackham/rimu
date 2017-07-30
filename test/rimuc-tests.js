var test = require('tape');
var exec = require('child_process').exec;
var fs = require('fs')

var test_descriptors = []

// source: Rimu source.
// options: rimuc command options.
// callback(output, error): output=stdout+stderr, error=exit code
function rimuc_exec(source, options, callback) {
  source = source.replace(/\n/g, '\\n');
  source = source.replace(/"/g, '\\x22');
  var command = '`which echo` -e "' + source + '" | ./bin/rimuc.js --no-rimurc ' + (options || '');
  exec(command, function (error, stdout, stderr) {
    callback(stdout + stderr, error);
  })
}

function rimuc_equals(t, source, expected, options, message) {
  // test_descriptors.push({ description: message, args: options, input: source, expectedOutput: expected, predicate: 'equals' })
  rimuc_exec(source, options, function (output) {
    t.equal(output, expected, message)
  });
}

function rimuc_contains(t, source, expected, options, message) {
  // test_descriptors.push({ description: message, args: options, input: source, expectedOutput: expected, predicate: 'contains' })
  rimuc_exec(source, options, function (output) {
    t.ok(output.indexOf(expected) > 0, message)
  });
}

test('rimuc', function (t) {
  t.plan(23);

  // Execute tests specified in JSON file.
  var data = fs.readFileSync('./test/rimuc-tests.json')
  var tests = JSON.parse(data)
  tests.forEach(function (e) {
    switch (e.predicate) {
      case "equals":
        rimuc_equals(t, e.input, e.expectedOutput, e.args, e.description);
        break;
      case "contains":
        rimuc_contains(t, e.input, e.expectedOutput, e.args, e.description);
        break;
    }
  });

  // Tests that don't fit the fixture driven mold.
  rimuc_exec('', '--help', function (output) {
    t.ok(output.startsWith('\nNAME\n  rimuc'), 'rimuc --help')
  });

  rimuc_exec('', '--styled', function (output) {
    t.ok(output.startsWith('<!DOCTYPE HTML>'), 'rimuc --styled')
  });

  rimuc_exec('', '--styled --sidebar-toc --custom-toc', function (output) {
    t.ok(output.indexOf('<div id="toc"') === -1, 'rimuc --sidebar-toc --custom-toc')
  });

  rimuc_exec('{x}', '--lint', function (output, error) {
    t.ok(output.indexOf('undefined macro') > 0 && error.code === 1, 'rimuc --lint')
  });

});

