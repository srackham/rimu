const test = require('tape');
const exec = require('child_process').exec;
const fs = require('fs');

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
      case "startsWith":
        rimuc_exec(e.input, e.args, function (output) {
          t.ok(output.startsWith(e.expectedOutput), e.description)
        });
        break;
      case "exitCode":
        rimuc_exec(e.input, e.args, function (output, error) {
          t.ok(String(error.code) === e.expectedOutput, e.description)
        });
        break;
      default:
        t.ok(false, e.description + ': illegal predicate: ' + e.predicate)
        break;
    }
  });

  t.end();
});

