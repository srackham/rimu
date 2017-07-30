var test = require('tape');
var Rimu = require('../bin/rimu.js');
var fs = require('fs')

test('API check', function (t) {

  t.ok(
    Rimu.render.constructor === Function,
    'Rimu.render is a function');

  // TODO: API init() test c.f. rimu-kt initTest(). 
  // But the only way to test the internals is to write the tests in TypeScript.

  t.end();
});

function catchLint(message) { // Should never be called.
  console.log(message.type + ': ' + message.text);
  throw new Error();
}

test('rimu', function (t) {

  // Execute tests specified in JSON file.
  var data = fs.readFileSync('./test/rimu-tests.json')
  var tests = JSON.parse(data)
  tests.forEach(function (e) {
    var msg = '';
    if (e.expectedCallback === '') {
      e.options.callback = catchLint;
    } else {
      e.options.callback = function (message) {
        msg = message.type + ': ' + message.text;
      }
    }
    var rendered = Rimu.render(e.input, e.options)
    t.equal(rendered, e.expectedOutput, e.description);
    if (e.expectedCallback !== '') {
      t.equal(msg.slice(0, e.expectedCallback.length), e.expectedCallback, e.description);
    }
  });

  t.end();
});