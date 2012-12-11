var Rimu = require('../bin/rimu.js');

function testBlock(renderer, test, source, expected) {
  var writer = new Rimu.Writer();
  renderer(new Rimu.Reader(source), writer);
  var got = writer.toString();
  test.equal(got, expected,
      '\nSOURCE:   ' + source +
      '\nGOT:      ' + got +
      '\nEXPECTED: ' + expected);
}

function testLineBlock(test, source, expected) {
  testBlock(Rimu.LineBlocks.render.bind(Rimu.LineBlocks), test, source, expected);
}

function testDelimitedBlock(test, source, expected) {
  testBlock(Rimu.DelimitedBlocks.render.bind(Rimu.DelimitedBlocks), test, source, expected);
}

function testList(test, source, expected) {
  testBlock(Rimu.Lists.render.bind(Rimu.Lists), test, source, expected);
}

function testDocuments(test, source, expected) {
  var got = Rimu.render(source);
  test.equal(got, expected,
      '\nSOURCE:   ' + source +
      '\nGOT:      ' + got +
      '\nEXPECTED: ' + expected);
}


exports['Line blocks'] = function(test) {
//  test.expect(3);

  // Line variables.
  Rimu.Variables.list = [];
  testLineBlock(test, "{var} = 'variable value'", '');
  test.equal(Rimu.Variables.get('var'), 'variable value');
  test.equal(Rimu.Variables.list.length, 1);
  testLineBlock(test, "{var} = 'variable value2'", '');
  test.equal(Rimu.Variables.get('var'), 'variable value2');
  test.equal(Rimu.Variables.list.length, 1);
  // Escaped.
  testDelimitedBlock(test,
      '{var} \\{var}',
      '<p>variable value2 {var}</p>');
  // Nested.
  testLineBlock(test, "{var2} = 'nested var: {var}'", '');
  test.equal(Rimu.Variables.list.length, 2);
  test.equal(Rimu.Variables.list[1].value, 'nested var: variable value2');
  testDelimitedBlock(test,
      '{var2}',
      '<p>nested var: variable value2</p>');
  // In line replacement.
  testLineBlock(test, "{tiger} = './images/tiger.png'", '');
  testLineBlock(test,
      '<image:{tiger}>',
      '<img src="./images/tiger.png" alt="./images/tiger.png">');

  // Headers.
  testLineBlock(test,
      '# Hello World!',
      '<h1>Hello World!</h1>');
  testLineBlock(test,
      '## *Hello* World! ##',
      '<h2><strong>Hello</strong> World!</h2>');
  testLineBlock(test,
      '=== *Hello* <joe@foo.com|Joe & Jim> ====',
      '<h3><strong>Hello</strong> <a href="mailto:joe@foo.com">Joe &amp; Jim</a></h3>');

  // Comment line.
  testLineBlock(test,
      '// A comment.',
      '');

  // Block image.
  testLineBlock(test,
      '<image:./images/tiger.png>',
      '<img src="./images/tiger.png" alt="./images/tiger.png">');
  testLineBlock(test,
      '<image:http://foobar.com|Tiger & Bar>',
      '<img src="http://foobar.com" alt="Tiger &amp; Bar">');

  test.done();
};

exports['Delimited blocks'] = function(test) {
//  test.expect(3);

  // Block variables.
  Rimu.Variables.list = [];
  testDelimitedBlock(test, "{var} = 'variable\n value'", '');
  test.equal(Rimu.Variables.get('var'), 'variable\n value');
  test.equal(Rimu.Variables.list.length, 1);
  testDelimitedBlock(test, "{var} = 'variable\n value2'", '');
  test.equal(Rimu.Variables.get('var'), 'variable\n value2');
  test.equal(Rimu.Variables.list.length, 1);
  testDelimitedBlock(test,
      '{var}',
      '<p>variable\n value2</p>');

  // Continuation Block.
  testDelimitedBlock(test,
      '..\nTo be...\n\nor not to be!\n..',
      '<div><p>To be...</p>\n<p>or not to be!</p></div>');
  // Quote Block.
  testDelimitedBlock(test,
      '""\nTo be...\n\nor not to be!\n""',
      '<blockquote><p>To be...</p>\n<p>or not to be!</p></blockquote>');
  // HTML Block.
  testDelimitedBlock(test,
      '<p>Raw <em>HTML</em>\nis *passed* through</p>',
      '<p>Raw <em>HTML</em>\nis *passed* through</p>');
  testDelimitedBlock(test,
      '<!-- An HTML comment -->',
      '<!-- An HTML comment -->');
  // Indented paragraph.
  testDelimitedBlock(test,
      '  *Indented* paragraph\nLine 2\n    Line 3',
      '<pre>*Indented* paragraph\nLine 2\n  Line 3</pre>');
  // Comment Block.
  testDelimitedBlock(test,
      '/*\nComment lines\n More comments.\n*/',
      '');
  // Code block.
  testDelimitedBlock(test,
      '--\nA <code> block\n Line _two_\n--',
      '<pre><code>A &lt;code&gt; block\n Line _two_</code></pre>');
  // Paragraph.
  testDelimitedBlock(test,
      '*Hello* <joe@foo.com|Joe & Jim>',
      '<p><strong>Hello</strong> <a href="mailto:joe@foo.com">Joe &amp; Jim</a></p>');
  // Multi-line paragraph.
  testDelimitedBlock(test,
      'Line 1\nLine 2',
      '<p>Line 1\nLine 2</p>');
  // Don't mistake a URL for an HTML block.
  testDelimitedBlock(test,
      '<joe@foo.com|Joe & Jim>',
      '<p><a href="mailto:joe@foo.com">Joe &amp; Jim</a></p>');
  test.done();
};

exports['Lists'] = function(test) {
  testList(test,
      'term::\ndef\nterm:: def',
      '<dl><dt>term</dt><dd>\ndef\n</dd><dt>term</dt><dd> def\n</dd></dl>');
  testList(test,
      '- Item _1_\n - Item 2\n\\ - Escaped',
      '<ul><li>Item <em>1</em>\n</li><li>Item 2\n - Escaped\n</li></ul>');
  testList(test,
      '- List 1\n* List 2',
      '<ul><li>List 1\n<ul><li>List 2\n</li></ul></li></ul>');

  /*
  - List item1.
  - List item2.
  * List item3.
  ** List ite4m.
  Term:: List
  item5

  - List item6.
  */
  testList(test,
      '- List item1.\n  - List item2.\n  * List item3.\n  ** List item4.\nTerm:: List\n item5\n\n- List item6.',
      '<ul><li>List item1.\n</li><li>List item2.\n<ul><li>List item3.\n<ul><li>List item4.\n<dl><dt>Term</dt><dd> List\n item5\n</dd></dl></li></ul></li></ul></li><li>List item6.\n</li></ul>');

  testList(test,
      '- Item 1\n..\nA\nparagraph\n..\n- Item 2\n\n  Indented',
      '<ul><li>Item 1\n<div><p>A\nparagraph</p></div>\n</li><li>Item 2\n<pre>Indented</pre></li></ul>');

  test.done();
};

exports['Documents'] = function(test) {
//  test.expect(3);

  testDocuments(test,
      '# Title\n## Subtitle\n\nParagraph \none.\n\r\nParagraph two.',
      '<h1>Title</h1>\n<h2>Subtitle</h2>\n<p>Paragraph\none.</p>\n<p>Paragraph two.</p>');

  testDocuments(test,
      '# h1 header\n\n// Comment line.',
      '<h1>h1 header</h1>\n');

  // Escaped header.
  testDocuments(test,
      '\\# I am not a header',
      '<p># I am not a header</p>');

  // HTML blocks and spans.
  testDocuments(test,
      '<hr>\n<br>\n\n\\<br><hr>',
      '<hr>\n<br>\n<p>&lt;br&gt;<hr></p>');

  // Block anchor.
  testDocuments(test,
      '<<#x1>>\n<#x1>',
      '<div id="x1"></div>\n<p><a href="#x1">#x1</a></p>');

  // Options.
  test.equal(Rimu.render('<hr>'), '<hr>');
  test.equal(Rimu.render('<hr>', {safeMode: 1}), '');
  test.equal(Rimu.render('<hr>'), '<hr>');
  test.equal(Rimu.render('<hr>', {safeMode: 3}), '&lt;hr&gt;');
  test.equal(Rimu.render('<hr>'), '<hr>');
  test.equal(Rimu.render('<hr>', {safeMode: 0}), '<hr>');
  test.equal(Rimu.render('Lorum\nIpsum'), '<p>Lorum\nIpsum</p>');
  test.equal(Rimu.render('Lorum ipsum<br>', {safeMode: 1}), '<p>Lorum ipsum</p>');
  test.equal(Rimu.render('<hr>', {safeMode: 1}), '');
  test.equal(Rimu.render('<hr>', {safeMode: 2, htmlReplacement: 'XXX'}), 'XXX');

  // Line variables, and tests that variable persists across a list.
  testDocuments(test,
      "{v1}='1'\n{v2}='2'\n{v1} and {v2}\n\n- {v1}\n\n{v2}",
      '<p>1 and 2</p>\n<ul><li>1\n</li></ul><p>2</p>');

  // Block variables.
  testDocuments(test,
      "{v1}='1\n2'\n{v2}='3\n4'\n{v1} and {v2}",
      '<p>1\n2 and 3\n4</p>');

  // Single quotes are OK inside variable values.
  testDocuments(test,
      "{v}='This \'and\' that'\n{v}",
      "<p>This 'and' that</p>");

  // HTML attributes.
  test.equal(Rimu.render(
      '.error\nError message\n\nNormal paragraph'),
      '<p class="error">Error message</p>\n<p>Normal paragraph</p>');
  test.equal(Rimu.render(
      '.large error   #x1 [style="color: red;"]\nError message'),
      '<p class="large error" id="x1" style="color: red;">Error message</p>');
  test.equal(Rimu.render(
      '.[style="color: red;"]\nError message', {safeMode:2}),
      '<p>Error message</p>');
  test.equal(Rimu.render(
      '.large error   #x1 [style="color: red;"]\nError message', {safeMode:1}),
      '<p class="large error" id="x1">Error message</p>');
  test.equal(Rimu.render(
      '.polaroid [width="800"]\n<image:tiger.png>'),
      '<img class="polaroid" width="800" src="tiger.png" alt="tiger.png">');
  test.equal(Rimu.render(
      '.dl-horizontal\nterm:: definition\nterm::: definition'),
      '<dl class="dl-horizontal"><dt>term</dt><dd> definition\n<dl><dt>term</dt><dd> definition\n</dd></dl></dd></dl>');
  test.equal(Rimu.render(
      '.class1\n- Item\n.class2\n..\nContinuation\n..\nParagraph'),
      '<ul class="class1"><li>Item\n<div class="class2"><p>Continuation</p></div>\n</li></ul><p>Paragraph</p>');

  // Variable reference blocks.
  test.equal(Rimu.render(
      '{info}= \'.info #ref2 [style="color:green"]\'\n{info}\ngreeny\n\n{xyz}\n\n{2paragraphs} =\'paragraph 1\n\nparagraph2\'\n{2paragraphs}'),
      '<p class="info" id="ref2" style="color:green">greeny</p>\n<p>{xyz}</p>\n<p>paragraph 1</p>\n<p>paragraph2</p>');

  test.done();
};

exports['tmp'] = function(test) {
  test.done();
};
