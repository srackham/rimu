var Rimu = require('../bin/rimu.js');

// Helpers.
function testBlock(renderer, test, source, expected, message) {
  var writer = new Rimu.Writer();
  renderer(new Rimu.Reader(source), writer);
  var actual = writer.toString();
  test.equal(actual, expected, message);
}
function testLineBlock(test, source, expected, message) {
  testBlock(Rimu.LineBlocks.render.bind(Rimu.LineBlocks), test, source, expected);
}
function testDelimitedBlock(test, source, expected, message) {
  testBlock(Rimu.DelimitedBlocks.render.bind(Rimu.DelimitedBlocks), test, source, expected);
}
function testList(test, source, expected, message) {
  testBlock(Rimu.Lists.render.bind(Rimu.Lists), test, source, expected);
}
function testDocument(test, source, expected, message) {
  var actual = Rimu.render(source);
  test.equal(actual, expected, message);
}


// Tests.
exports['Line blocks'] = function(test) {
  Rimu.Macros.defs = [];
  testLineBlock(test,
      "{macro} = 'macro value'",
      '',
      'macro definition');
  test.equal(
      Rimu.Macros.get('macro'),
      'macro value',
      'macro value');
  test.equal(
      Rimu.Macros.defs.length,
      1,
      'macros count');
  testLineBlock(test,
      "{macro} = 'macro value2'",
      '',
      'macro definition');
  test.equal(
      Rimu.Macros.get('macro'),
      'macro value2',
      'macro value');
  test.equal(
      Rimu.Macros.defs.length,
      1,
      'macros count');
  testDelimitedBlock(test,
      "&ZeroWidthSpace;\\{macro}='value'\n{macro} \\{macro}",
      "<p>&ZeroWidthSpace;{macro}='value'\nmacro value2 {macro}</p>",
      'escaped macro definitions and invocations');
  testLineBlock(test,
      "{macro2} = 'nested macro: {macro}'",
      '',
      'nested macro definition');
  test.equal(
      Rimu.Macros.defs.length,
      2,
      'macros count');
  test.equal(
      Rimu.Macros.defs[1].value,
      'nested macro: macro value2',
      'macro list value');
  testLineBlock(test,
      "{tiger} = './images/tiger.png'",
      '',
      'macro definition');
  testLineBlock(test,
      '<image:{tiger}>',
      '<img src="./images/tiger.png" alt="./images/tiger.png">',
      'macro invocation in image url');
  testLineBlock(test,
      '# Hello World!',
      '<h1>Hello World!</h1>',
      'header');
  testLineBlock(test,
      '## *Hello* World! ##',
      '<h2><strong>Hello</strong> World!</h2>',
      'header');
  testLineBlock(test,
      '=== *Hello* <joe@foo.com|Joe & Jim> ====',
      '<h3><strong>Hello</strong> <a href="mailto:joe@foo.com">Joe &amp; Jim</a></h3>',
      'header title containing quotes and email address');
  testLineBlock(test,
      '// A comment.',
      '',
      'comment line');
  testLineBlock(test,
      '<image:./images/tiger.png>',
      '<img src="./images/tiger.png" alt="./images/tiger.png">',
      'block image');
  testLineBlock(test,
      '<image:http://foobar.com|Tiger & Bar>',
      '<img src="http://foobar.com" alt="Tiger &amp; Bar">',
      'block imagei with caption');
  test.done();
};

exports['Delimited blocks'] = function(test) {
  // Block macros.
  Rimu.Macros.defs = [];
  testDelimitedBlock(test,
      "{macro} = 'macro\n value'",
      '',
      'multi-line macro value');
  test.equal(
      Rimu.Macros.get('macro'),
      'macro\n value',
      'macro value');
  test.equal(
      Rimu.Macros.defs.length,
      1,
      'macros count');
  testDelimitedBlock(test,
      "{macro} = 'macro\n value2'",
      '',
      'redefine macro');
  test.equal(
      Rimu.Macros.get('macro'),
      'macro\n value2',
      'macro value');
  test.equal(
      Rimu.Macros.defs.length,
      1,
      'macros count');
  testDelimitedBlock(test,
      '{macro}',
      '<p>macro\n value2</p>',
      'macro invocation renders paragraph');
  testDelimitedBlock(test,
      '..\nTo be...\n\nor not to be!\n..',
      '<div><p>To be...</p>\n<p>or not to be!</p></div>',
      'division block');
  testDelimitedBlock(test,
      '""\nTo be...\n\nor not to be!\n""',
      '<blockquote><p>To be...</p>\n<p>or not to be!</p></blockquote>',
      'quote block');
  testDelimitedBlock(test,
      '<p>Raw <em>HTML</em>\nis *passed* through</p>',
      '<p>Raw <em>HTML</em>\nis *passed* through</p>',
      'html block');
  testDelimitedBlock(test,
      '<!-- An HTML comment -->',
      '<!-- An HTML comment -->',
      'html comment');
  testDelimitedBlock(test,
      '  *Indented* paragraph\nLine 2\n    Line 3',
      '<pre>*Indented* paragraph\nLine 2\n  Line 3</pre>',
      'indented paragraph');
  testDelimitedBlock(test,
      '/*\nComment lines\n More comments.\n*/',
      '',
      'comment block');
  testDelimitedBlock(test,
      '--\nA <code> block\n Line _two_\n--',
      '<pre><code>A &lt;code&gt; block\n Line _two_</code></pre>',
      'code block');
  testDelimitedBlock(test,
      '*Hello* <joe@foo.com|Joe & Jim>',
      '<p><strong>Hello</strong> <a href="mailto:joe@foo.com">Joe &amp; Jim</a></p>',
      'normal paragraph');
  testDelimitedBlock(test,
      'Line 1\nLine 2',
      '<p>Line 1\nLine 2</p>',
      'multi-line normal paragraph');
  testDelimitedBlock(test,
      '<joe@foo.com|Joe & Jim>',
      '<p><a href="mailto:joe@foo.com">Joe &amp; Jim</a></p>',
      'do not mistake url for HTML block');
  test.done();
};

exports['Lists'] = function(test) {
  testList(test,
      'term::\ndef\nterm:: def',
      '<dl><dt>term</dt><dd>\ndef\n</dd><dt>term</dt><dd> def\n</dd></dl>',
      'definition list');
  testList(test,
      '- Item _1_\n - Item 2\n\\ - Escaped',
      '<ul><li>Item <em>1</em>\n</li><li>Item 2\n - Escaped\n</li></ul>',
      'unordered list with escapted list item');
  testList(test,
      '- List 1\n* List 2',
      '<ul><li>List 1\n<ul><li>List 2\n</li></ul></li></ul>',
      'nested unordered lists');

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
      '<ul><li>List item1.\n</li><li>List item2.\n<ul><li>List item3.\n<ul><li>List item4.\n<dl><dt>Term</dt><dd> List\n item5\n</dd></dl></li></ul></li></ul></li><li>List item6.\n</li></ul>',
      'Mixed nested lists');
  testList(test,
      '- Item 1\n..\nA\nparagraph\n..\n- Item 2\n\n  Indented',
      '<ul><li>Item 1\n<div><p>A\nparagraph</p></div>\n</li><li>Item 2\n<pre>Indented</pre></li></ul>',
      'list item with attached division block and indented paragraph');
  testList(test,
      '- Item 1\n""\nA\nparagraph\n""',
      '<ul><li>Item 1\n<blockquote><p>A\nparagraph</p></blockquote></li></ul>',
      'list item with attached quote block');
  testList(test,
      '- Item 1\n--\nA\nparagraph\n--',
      '<ul><li>Item 1\n<pre><code>A\nparagraph</code></pre></li></ul>',
      'list item with attached code block');
  testList(test,
      'a::\n' +
      '..\n' +
      '- b\n' +
      '..\n' +
      'c::\n' +
      'd',
      '<dl><dt>a</dt><dd>\n' +
      '<div><ul><li>b\n' +
      '</li></ul></div>\n' +
      '</dd><dt>c</dt><dd>\n' +
      'd\n' +
      '</dd></dl>',
      'nested list in attached division block');
  test.done();
};

exports['Documents'] = function(test) {
  testDocument(test,
      '# Title\n## Subtitle\n\nParagraph \none.\n\r\nParagraph two.',
      '<h1>Title</h1>\n<h2>Subtitle</h2>\n<p>Paragraph\none.</p>\n<p>Paragraph two.</p>',
      'headers and paragraphs');
  testDocument(test,
      '# h1 header\n\n// Comment line.',
      '<h1>h1 header</h1>\n',
      'header followed by comment line');
  testDocument(test,
      '\\# I am not a header',
      '<p># I am not a header</p>',
      'escapted header');
  testDocument(test,
      '<hr>\n<br>\n\n\\<br><HR>\n\n&ZeroWidthSpace;\\<div>',
      '<hr>\n<br>\n<p>&lt;br&gt;<HR></p>\n<p>&ZeroWidthSpace;&lt;div&gt;</p>',
      'html blocks and spans');
  testDocument(test,
      '<chapter1.html>',
      '<p><a href="chapter1.html">chapter1.html</a></p>',
      'relative file name url');
  testDocument(test,
      '<div>a block</div>\n\n<span>not a block</span>',
      '<div>a block</div>\n<p><span>not a block</span></p>',
      'html block element and html span element');
  testDocument(test,
      '</body></html>',
      '</body></html>',
      'html block starting with closing tag');
  testDocument(test,
      '<!DOCTYPE HTML>',
      '<!DOCTYPE HTML>',
      'HTML doctype element');
  testDocument(test,
      '<!--comment-->\n\nx <!--comment-->y`<!--comment-->`',
      '<!--comment-->\n<p>x <!--comment-->y<code>&lt;!--comment--&gt;</code></p>',
      'html block comment and html span comment');
  testDocument(test,
    'Refer to the <#x1|next paragraph> or the <#x2|second list item\n' +
    'below>.\n' +
    '\n' +
    '<<#x1>>\n' +
    'Nisl curabitur donec. Vel porttitor et. Et amet vitae. Quam\n' +
    'porttitor integer. Bibendum neque quis quisque ac commodo. Non et\n' +
    'cumque. Sit et a consequat.\n' +
    '\n' +
    '- Viverra pede turpis.\n' +
    '- <<#x2>>Esse et dui nonummy modi.\n',

    '<p>Refer to the <a href="#x1">next paragraph</a> or the <a href="#x2">second list item\n' +
    'below</a>.</p>\n' +
    '<div id="x1"></div>\n' +
    '<p>Nisl curabitur donec. Vel porttitor et. Et amet vitae. Quam\n' +
    'porttitor integer. Bibendum neque quis quisque ac commodo. Non et\n' +
    'cumque. Sit et a consequat.</p>\n' +
    '<ul><li>Viverra pede turpis.\n' +
    '</li><li><span id="x2"></span>Esse et dui nonummy modi.\n' +
    '</li></ul>',
    'anchors and links');

  test.equal(Rimu.render('<hr>'), '<hr>', 'safeMode default');
  test.equal(Rimu.render('<hr>', {safeMode: 1}), '', 'saveMode=1');
  test.equal(Rimu.render('<hr>'), '<hr>');
  test.equal(Rimu.render('<hr>', {safeMode: 3}), '&lt;hr&gt;', 'safeMode=3');
  test.equal(Rimu.render('<hr>'), '<hr>', 'safeMode default');
  test.equal(Rimu.render('<hr>', {safeMode: 0}), '<hr>', 'safeMode=0');
  test.equal(Rimu.render('Lorum\nIpsum<br>'), '<p>Lorum\nIpsum<br></p>', 'safeMode default');
  test.equal(Rimu.render('Lorum ipsum<br>', {safeMode: 1}), '<p>Lorum ipsum</p>', 'safeMode=1');
  test.equal(Rimu.render('<hr>', {safeMode: 1}), '', 'safeMode=1');
  test.equal(Rimu.render('<hr>', {safeMode: 2, htmlReplacement: 'XXX'}), 'XXX', 'htmlReplacement option');
  // The {blockref} is passed through and gets picked up as a paragraph.
  testDocument(test,
      '{v1}=\'1\'\n\n{v1}',
      '<p>1</p>',
      'stand-alone macro invocation');
  testDocument(test,
      '{v1}=\'1\'\n\n\\{v1}',
      '<p>{v1}</p>',
      'escaped stand-alone macro invocation');
  testDocument(test,
      '\\<img href="url" alt="alt">',
      '<p>&lt;img href="url" alt="alt"&gt;</p>',
      'escaped HTML block');
  testDocument(test,
      '{blockref}=\'BLOCKREF\'\n{inlineref}=\'INLINEREF\'\n{blockref}\n\nAn {inlineref}',
      '<p>BLOCKREF</p>\n<p>An INLINEREF</p>',
      'non-existant macro invocations are rendered verbatim');
  testDocument(test,
      "{v1}='1'\n{v2}='2'\n{v1} and {v2}\n\n- {v1}\n\n{v2}",
      '<p>1 and 2</p>\n<ul><li>1\n</li></ul><p>2</p>',
      'macro invocation in list');
  testDocument(test,
      "{v1}='1\n2'\n{v2}='3\n4'\n{v1} and {v2}",
      '<p>1\n2 and 3\n4</p>',
      'multi-line macro values rendered inline');
  testDocument(test,
      "{v}='$1 and $2'\n{v|a|b_c_} {v|d|e\nfg}.",
      '<p>a and b<em>c</em> d and e\nfg.</p>',
      'parametrized macros');
  testDocument(test,
      "{v}='$1 and $2 and $3 and $42'\n{v}{v|} {v|1|2}",
      '<p> and  and  and  and  and  and  1 and 2 and  and </p>',
      'parametrized macros');
  testDocument(test,
      "{v1}='$1 $2'\n{v2}='{v1|1|2} $1 $2'\n{v2|3|4} {v1|5|6}",
      '<p>1 2 3 4 5 6</p>',
      'nested parametrized macros');
  testDocument(test,
      "{v1}='$1 $2'\n{v2}='<div>{v1|1|2} $1 $2</div>'\n{v2|3|4}",
      '<div>1 2 3 4</div>',
      'nested parametrized macros');
  testDocument(test,
      "{mark}='<mark>$1</mark>'\n{sub}='<sub>$1</sub>'\n{mark|Note}: H{sub|2}O",
      '<p><mark>Note</mark>: H<sub>2</sub>O</p>',
      'text format parametrized macros');
  testDocument(test,
      "{src}='tiger.png'\n{caption}='Tiger'\n<image:{src}|{caption}>",
      '<img src="tiger.png" alt="Tiger">',
      'macro substitution in block image');
  testDocument(test,
      '\\/*\nabc\n*/\n\n\\// xyz',
      '<p>/*\nabc\n*/</p>\n<p>// xyz</p>',
      'escaped comments');
  testDocument(test,
      "{v}='This 'and' that'\n{v}",
      "<p>This 'and' that</p>",
      'single quotes are ok inside macros values');
  testDocument(test,
      'A \\{v}',
      '<p>A {v}</p>',
      'escaped undefined macros are unescaped');
  test.equal(Rimu.render(
      'Hello {undefined}'),
      '<p>Hello </p>',
      'undefined macro');
  test.equal(Rimu.render(
      'Hello {undefined?undefined macro.}'),
      '<p>Hello undefined macro.</p>',
      'default macro value');
  test.equal(Rimu.render(
      '{skipped} = \'SKIPPED\'\n{skipped?foobar}', {safeMode:1}),
      '<p>foobar</p>',
      'skip macro definitions in safe mode');
  test.equal(Rimu.render(
      '.error\nError message\n\nNormal paragraph'),
      '<p class="error">Error message</p>\n<p>Normal paragraph</p>',
      'html class');
  test.equal(Rimu.render(
      '.large error   #x1 [style="color: red;"]\nError message'),
      '<p class="large error" id="x1" style="color: red;">Error message</p>',
      'html class, id and attributes');
  test.equal(Rimu.render(
      '.[style="color: red;"]\nError message', {safeMode:2}),
      '<p>Error message</p>',
      'html attributes skipped by safeMode=2');
  test.equal(Rimu.render(
      '.large error   #x1 [style="color: red;"]\nError message', {safeMode:1}),
      '<p class="large error" id="x1">Error message</p>',
      'html attributes skipped by safeMode=1');
  test.equal(Rimu.render(
      '.#preface\n== Preface'),
      '<h2 id="preface">Preface</h2>',
      'header attributes');
  test.equal(Rimu.render(
      '.polaroid [width="800"]\n<image:tiger.png>'),
      '<img class="polaroid" width="800" src="tiger.png" alt="tiger.png">',
      'block image html attributes');
  test.equal(Rimu.render(
      '.dl-horizontal\nterm:: definition\nterm::: definition'),
      '<dl class="dl-horizontal"><dt>term</dt><dd> definition\n<dl><dt>term</dt><dd> definition\n</dd></dl></dd></dl>',
      'list html attributes');
  test.equal(Rimu.render(
      '.class1\n- Item\n.class2\n..\nDivision\n..\nParagraph'),
      '<ul class="class1"><li>Item\n<div class="class2"><p>Division</p></div>\n</li></ul><p>Paragraph</p>',
      'list item and attached division block html attributes');
  test.equal(Rimu.render(
      '{info}= \'.info #ref2 [style="color:green"]\'\n{info}\ngreeny\n\nnormal\n\n{2paragraphs} =\'paragraph 1\n\nparagraph2\'\n{2paragraphs}'),
      '<p class="info" id="ref2" style="color:green">greeny</p>\n<p>normal</p>\n<p>paragraph 1</p>\n<p>paragraph2</p>',
      'html attributes assigned to macro');
  // Replacement definitions.
  Rimu.Replacements.defs = [];
  test.equal(Rimu.render(
      '/\\\\?\\.{3}/=\'&hellip;\'\nTesting...'),
      '<p>Testing&hellip;</p>',
      'new replacement');
  test.equal(Rimu.render(
      'Testing\\...'),
      '<p>Testing...</p>',
      'escaped replacement');
  test.equal(Rimu.render(
      '/skipped/=\'SKIPPED\'\nskipped', {safeMode:1}),
      '<p>skipped</p>',
      'replacement definition skipped in safe mode');
  test.equal(Rimu.render(
      'Testing...', {safeMode:1}),
      '<p>Testing&hellip;</p>',
      'existing replacements work in safe mode');
  test.equal(Rimu.render(
      '/\\\\?\\.{3}/=\'...\'\nTesting...'),
      '<p>Testing...</p>',
      'update replacement');
  test.equal(
      Rimu.Replacements.defs.length,
      1,
      'replacements length');
  test.equal(Rimu.render(
      "/\\\\?\\B'\\b(.+?)\\b'\\B/g = '<em>$1</em>'\n'emphasized'"),
      '<p><em>emphasized</em></p>',
      'replacement with match groups');
  test.equal(
      Rimu.Replacements.defs.length,
      2,
      'replacements length');
  test.done();
};
