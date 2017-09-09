const test = require('tape');
const exec = require('child_process').exec;
const fs = require('fs');

const test_descriptors = [];

// source: Rimu source.
// options: rimuc command options.
// callback(output, error): output=stdout+stderr, error=exit code
function rimuc_exec(source, options, callback) {
  source = source.replace(/\n/g, '\\n');
  source = source.replace(/"/g, '\\x22');
  const command = '`which echo` -e "' + source + '" | node ./bin/rimuc.js --no-rimurc ' + (options || '');
  exec(command, function (error, stdout, stderr) {
    callback(stdout + stderr, error);
  })
}

test('rimuc', function (t) {

  // Execute tests specified in JSON file.
  const data = fs.readFileSync('./test/rimuc-tests.json');
  const tests = JSON.parse(data);
  tests.forEach(function (e) {
    switch (e.predicate) {
      case "equals":
        rimuc_exec(e.input, e.args, function (output) {
          t.equal(output, e.expectedOutput, e.description)
        });
        break;
      case "!equals":
        rimuc_exec(e.input, e.args, function (output) {
          t.notEqual(output, e.expectedOutput, e.description)
        });
        break;
      case "contains":
        rimuc_exec(e.input, e.args, function (output) {
          t.ok(output.indexOf(e.expectedOutput) >= 0, e.description)
        });
        break;
      case "!contains":
        rimuc_exec(e.input, e.args, function (output) {
          t.ok(output.indexOf(e.expectedOutput) === -1, e.description)
        });
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

  t.end();
});

