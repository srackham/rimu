const test = require('tape');
const rimu = require('../lib/rimu.js');
const fs = require('fs');

test('API check', function (t) {
  t.ok(
    rimu.render.constructor === Function,
    'Rimu.render is a function');
  t.end();
});

function catchLint(message) { // Should never be called.
  console.log(message.type + ': ' + message.text);
  throw new Error();
}

test('rimu', function (t) {
  // Execute tests specified in JSON file.
  const data = fs.readFileSync('./test/rimu-tests.json');
  const tests = JSON.parse(data);
  tests.forEach(function (e) {
    let msg = '';
    if (e.expectedCallback === '') {
      e.options.callback = catchLint;
    } else {
      e.options.callback = function (message) {
        msg = message.type + ': ' + message.text;
      }
    }
    let rendered = rimu.render(e.input, e.options)
    t.equal(rendered, e.expectedOutput, e.description);
    if (e.expectedCallback !== '') {
      t.equal(msg.slice(0, e.expectedCallback.length), e.expectedCallback, e.description);
    }
  });
  t.end();
});
