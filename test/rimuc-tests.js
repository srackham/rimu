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

function runTest(tester, test) {
  switch (test.predicate) {
    case "equals":
      rimuc_exec(test.input, test.args, function (output) {
        tester.equal(output, test.expectedOutput, test.description)
      });
      break;
    case "!equals":
      rimuc_exec(test.input, test.args, function (output) {
        tester.notEqual(output, test.expectedOutput, test.description)
      });
      break;
    case "contains":
      rimuc_exec(test.input, test.args, function (output) {
        tester.ok(output.indexOf(test.expectedOutput) >= 0, test.description)
      });
      break;
    case "!contains":
      rimuc_exec(test.input, test.args, function (output) {
        tester.ok(output.indexOf(test.expectedOutput) === -1, test.description)
      });
      break;
    case "startsWith":
      rimuc_exec(test.input, test.args, function (output) {
        tester.ok(output.startsWith(test.expectedOutput), test.description)
      });
      break;
    case "exitCode":
      rimuc_exec(test.input, test.args, function (output, error) {
        tester.equal(output, test.expectedOutput, test.description)
        tester.ok(error.code === test.exitCode, test.description)
      });
      break;
    default:
      tester.ok(false, test.description + ': illegal predicate: ' + test.predicate)
      break;
  }
}

test('rimuc', function (tester) {
  // Execute tests specified in JSON file.
  const data = fs.readFileSync('./test/rimuc-tests.json');
  const tests = JSON.parse(data);
  tests.forEach(function (test) {
    if (test.layouts) {
      // Run the test on built-in layouts.
      ['classic', 'flex', 'sequel'].forEach(function (layout) {
        let t = {};
        Object.assign(t, test);
        t.args = '--layout ' + layout + ' ' + test.args;
        t.description = layout + ' layout: ' + test.description;
        runTest(tester, t);
      });
    }
    else {
      runTest(tester, test);
    }
  });
  tester.end();
});

