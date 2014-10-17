var Rimu = require('../bin/rimu.js');

exports['API check'] = function(test) {
  test.ok(
      Rimu.render.constructor === Function,
    'Rimu.render is a function');
  test.done();
};

exports['Spans'] = function(test) {

  function test_span(source, expected, message) {
    test.equal(Rimu.render(source), '<p>' + expected + '</p>', message);
  }

  test_span(
    'no markup',
    'no markup',
    'text without markup');
  test_span(
    '\\*11*',
    '*11*',
    'escape strong quote');
  test_span(
    '*11* 22 _33_',
    '<strong>11</strong> 22 <em>33</em>',
    'strong and emphasis quotes');
  test_span(
    '*1 1*',
    '<strong>1 1</strong>',
    'strong quotes span words');
  test_span(
    '*1\n1*',
    '<strong>1\n1</strong>',
    'strong quotes span lines');
  test_span(
    '\\*11* \\*22 _33_',
    '*11* *22 <em>33</em>',
    'escape quotes');
  test_span(
    '00 _ `_11_` _2*2*_ _2*2\\*_',
    '00 _ <code>_11_</code> <em>2<strong>2</strong></em> <em>2*2*</em>',
    'nested quotes');
  test_span(
    '__xyz\\_ abc_',
    '<em>_xyz_ abc</em>',
    'quote containing quote characters');
  test_span(
    '__xyz abc\\__',
    '<em>_xyz abc_</em>',
    'quote containing quote characters');
  test_span(
    '_*abc `efg`* h<sup>i</sup>_ j',
    '<em><strong>abc <code>efg</code></strong> h<sup>i</sup></em> j',
    'nested quotes');
  test_span(
    '`<http://example.com> \\``',
    '<code>&lt;http://example.com&gt; `</code>',
    'code quotes');
  test_span(
    '<a class="btn">abc</a> <a class="btn">xyz</a>',
    '<a class="btn">abc</a> <a class="btn">xyz</a>',
    'two HTML attributes do not generate delete quote');

  test_span(
    'http://foobar.com \\<http://foobar.com>',
    'http://foobar.com &lt;http://foobar.com&gt;',
    'escaped http urls');
  test_span(
    '*<http://foobar.com>* <http://foobar.com|Foo\n& Bar>',
      '<strong><a href="http://foobar.com">http://foobar.com</a></strong> ' +
      '<a href="http://foobar.com">Foo\n&amp; Bar</a>',
    'quoted and parametrized http urls');
  test_span(
    '<ftp://ftp.funet.fi/pub/standards/RFC/rfc959.txt>',
    '<a href="ftp://ftp.funet.fi/pub/standards/RFC/rfc959.txt">ftp://ftp.funet.fi/pub/standards/RFC/rfc959.txt</a>',
    'ftp url');
  test_span(
      '<file:///home/joe/downloads/> ' +
      '<file:///home/joe/doc/user-guide.pdf|User Guide> ' +
      '\\<file:///home/joe/downloads/>',
      '<a href="file:///home/joe/downloads/">file:///home/joe/downloads/</a> ' +
      '<a href="file:///home/joe/doc/user-guide.pdf">User Guide</a> ' +
      '&lt;file:///home/joe/downloads/&gt;',
    'file urls');
  test_span(
    '&copy; &reg;\\&para;',
    '&copy; &reg;&amp;para;',
    'character entities');
  test_span(
    'Lorum \\\nipsum \\\\\n`lorum \\\nipsum`\nnostra \\\\\nvestibulum \\',
    'Lorum<br>\nipsum \\\n<code>lorum \\\nipsum</code>\nnostra \\\nvestibulum<br>',
    'line breaks');
  test_span(
    'Lorum <<#x1>>ipsum <#x1|lorum link> \\<<#x1>>',
    'Lorum <span id="x1"></span>ipsum <a href="#x1">lorum link</a> &lt;&lt;#x1&gt;&gt;',
    'inline anchors and links');
  test_span(
      '<image:./images/tiger.png> ' +
      '<image:http://foobar.com|Tiger\n& Bar> ' +
      '\\<image:tiger.png>',
      '<img src="./images/tiger.png" alt="./images/tiger.png"> ' +
      '<img src="http://foobar.com" alt="Tiger\n&amp; Bar"> ' +
      '&lt;image:tiger.png&gt;',
    'inline images');
  test_span(
      '<joe.bloggs@foobar.com> ' +
      '<joe.bloggs@foobar.com|Joe\n Bloggs> ' +
      '\\<joe.bloggs@foobar.com>',
      '<a href="mailto:joe.bloggs@foobar.com">joe.bloggs@foobar.com</a> ' +
      '<a href="mailto:joe.bloggs@foobar.com">Joe\n Bloggs</a> ' +
      '&lt;joe.bloggs@foobar.com&gt;',
    'email addresses');
  test_span(
    '<u>underlined *text*</u>\\<hr>',
    '<u>underlined <strong>text</strong></u>&lt;hr&gt;',
    'HTML tags');
  test_span(
    '<span style="font-size:\n2em">inline elements</span>',
    '<span style="font-size:\n2em">inline elements</span>',
    'HTML tags across line boundary');
  test_span(
    "<a href='http://example.com'><image:tiger.png></a>",
    "<a href='http://example.com'><img src=\"tiger.png\" alt=\"tiger.png\"></a>",
    'HTML element enveloping image');
  test_span(
    '<chapter1.html>',
    '<a href="chapter1.html">chapter1.html</a>',
    'relative url');
  test_span(
    '<./chapter1.html#x1|Foo bar>',
    '<a href="./chapter1.html#x1">Foo bar</a>',
    'parametrized relative url');

  test.done();
};


exports['Blocks'] = function(test) {

  function test_document(source, expected, message, options) {
    options = options || {};
    test.equal(Rimu.render(source, options), expected, message);
  }

  // Macros.
  test_document(
    "{macro} = 'macro value'",
    '',
    'macro definition');
  test_document(
    "{macro}",
    '<p>macro value</p>',
    'macro value');
  test_document(
    "{macro} = 'macro value2'\n{macro}",
    '<p>macro value2</p>',
    'macro value');
  test_document(
    "&ZeroWidthSpace;\\{macro}='value'\n{macro} \\{macro}",
    "<p>&ZeroWidthSpace;{macro}='value'\nmacro value2 {macro}</p>",
    'escaped macro definitions and invocations');
  test_document(
    "{macro2} = 'nested macro: {macro}'\n{macro2}",
    '<p>nested macro: macro value2</p>',
    'nested macro value');
  test_document(
    "{tiger} = './images/tiger.png'\n<image:{tiger}>",
    '<img src="./images/tiger.png" alt="./images/tiger.png">',
    'macro invocation in image url');
  test_document(
    '# Hello World!',
    '<h1>Hello World!</h1>',
    'header');
  test_document(
    '## *Hello* World! ##',
    '<h2><strong>Hello</strong> World!</h2>',
    'header');
  test_document(
    '=== *Hello* <joe@foo.com|Joe & Jim> ====',
    '<h3><strong>Hello</strong> <a href="mailto:joe@foo.com">Joe &amp; Jim</a></h3>',
    'header title containing quotes and email address');
  test_document(
    '// A comment.',
    '',
    'comment line');
  test_document(
    '<image:./images/tiger.png>',
    '<img src="./images/tiger.png" alt="./images/tiger.png">',
    'block image');
  test_document(
    '<image:http://foobar.com|Tiger & Bar>',
    '<img src="http://foobar.com" alt="Tiger &amp; Bar">',
    'block image with caption');
  test_document(
    "{macro} = 'macro\n value'\n{macro}",
    '<p>macro\n value</p>',
    'multi-line macro value');
  test_document(
    "{macro} = 'macro\n value2'\n{macro}",
    '<p>macro\n value2</p>',
    'redefine macro');
  test_document(
    '..\nTo be...\n\nor not to be!\n..',
    '<div><p>To be...</p>\n<p>or not to be!</p></div>',
    'division block');
  test_document(
    '""\nTo be...\n\nor not to be!\n""',
    '<blockquote><p>To be...</p>\n<p>or not to be!</p></blockquote>',
    'quote block');
  test_document(
    '<p>Raw <em>HTML</em>\nis *passed* through</p>',
    '<p>Raw <em>HTML</em>\nis *passed* through</p>',
    'html block');
  test_document(
    '<!-- An HTML comment -->',
    '<!-- An HTML comment -->',
    'html comment');
  test_document(
    '  *Indented* paragraph\nLine 2\n    Line 3',
    '<pre><code>*Indented* paragraph\nLine 2\n  Line 3</code></pre>',
    'indented paragraph');
  test_document(
    '/*\nComment lines\n More comments.\n*/',
    '',
    'comment block');
  test_document(
    '--\nA <code> block\n Line _two_\n--',
    '<pre><code>A &lt;code&gt; block\n Line _two_</code></pre>',
    'code block');
  test_document(
    '*Hello* <joe@foo.com|Joe & Jim>',
    '<p><strong>Hello</strong> <a href="mailto:joe@foo.com">Joe &amp; Jim</a></p>',
    'normal paragraph');
  test_document(
    'Line 1\nLine 2',
    '<p>Line 1\nLine 2</p>',
    'multi-line normal paragraph');
  test_document(
    '<joe@foo.com|Joe & Jim>',
    '<p><a href="mailto:joe@foo.com">Joe &amp; Jim</a></p>',
    'do not mistake url for HTML block');
  test_document(
    '..\nTo be...\n\n...\nTo be...\n\nor not to be!\n...\n\nor not to be!\n..',
    '<div><p>To be...</p>\n<div><p>To be...</p>\n<p>or not to be!</p></div>\n<p>or not to be!</p></div>',
    'nested delimited block of the same type');

  // Lists.
  test_document(
    'term::\ndef\nterm:: def',
    '<dl><dt>term</dt><dd>\ndef\n</dd><dt>term</dt><dd> def\n</dd></dl>',
    'definition list');
  test_document(
    '- Item _1_\n - Item 2\n\\ - Escaped',
    '<ul><li>Item <em>1</em>\n</li><li>Item 2\n - Escaped\n</li></ul>',
    'unordered list with escaped list item');
  test_document(
    '- List 1\n* List 2',
    '<ul><li>List 1\n<ul><li>List 2\n</li></ul></li></ul>',
    'nested unordered lists');
  test_document(
    '. Item 1\n. Item 2',
    '<ol><li>Item 1\n</li><li>Item 2\n</li></ol>',
    'ordered list');

  /*
   - List item1.
   - List item2.
   * List item3.
   ** List ite4m.
   Term:: List
   item5

   - List item6.
   */
  test_document(
    '- List item1.\n  - List item2.\n  * List item3.\n  ** List item4.\nTerm:: List\n item5\n\n- List item6.',
    '<ul><li>List item1.\n</li><li>List item2.\n<ul><li>List item3.\n<ul><li>List item4.\n<dl><dt>Term</dt><dd> List\n item5\n</dd></dl></li></ul></li></ul></li><li>List item6.\n</li></ul>',
    'Mixed nested lists');
  test_document(
    '- Item 1\n..\nA\nparagraph\n..\n- Item 2\n\n  Indented',
    '<ul><li>Item 1\n<div><p>A\nparagraph</p></div>\n</li><li>Item 2\n<pre><code>Indented</code></pre></li></ul>',
    'list item with attached division block and indented paragraph');
  test_document(
    '- Item 1\n""\nA\nparagraph\n""',
    '<ul><li>Item 1\n<blockquote><p>A\nparagraph</p></blockquote></li></ul>',
    'list item with attached quote block');
  test_document(
    '- Item 1\n--\nA\nparagraph\n--',
    '<ul><li>Item 1\n<pre><code>A\nparagraph</code></pre></li></ul>',
    'list item with attached code block');
  test_document(
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

  // Mixed blocks.
  test_document(
    '# Title\n## Subtitle\n\nParagraph \none.\n\r\nParagraph two.',
    '<h1>Title</h1>\n<h2>Subtitle</h2>\n<p>Paragraph\none.</p>\n<p>Paragraph two.</p>',
    'headers and paragraphs');
  test_document(
    '# h1 header\n\n// Comment line.',
    '<h1>h1 header</h1>\n',
    'header followed by comment line');
  test_document(
    '\\# I am not a header',
    '<p># I am not a header</p>',
    'escaped header');
  test_document(
    '<hr>\n<br>\n\n\\<br><HR>\n\n&ZeroWidthSpace;\\<div>',
    '<hr>\n<br>\n<p>&lt;br&gt;<HR></p>\n<p>&ZeroWidthSpace;&lt;div&gt;</p>',
    'html blocks and spans');
  test_document(
    '<chapter1.html>',
    '<p><a href="chapter1.html">chapter1.html</a></p>',
    'relative file name url');
  test_document(
    '<div>a block</div>\n\n<span>not a block</span>',
    '<div>a block</div>\n<p><span>not a block</span></p>',
    'html block element and html span element');
  test_document(
    '</body></html>',
    '</body></html>',
    'html block starting with closing tag');
  test_document(
    '<!DOCTYPE HTML>',
    '<!DOCTYPE HTML>',
    'HTML doctype element');
  test_document(
    '<!--comment-->\n\nx <!--comment-->y`<!--comment-->`',
    '<!--comment-->\n<p>x <!--comment-->y<code>&lt;!--comment--&gt;</code></p>',
    'html block comment and html span comment');
  test_document(
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

  test_document('<hr>', '<hr>', 'safeMode default');
  test_document('<hr>', '', 'saveMode=1', {safeMode: 1});
  test_document('<hr>', '<hr>');
  test_document('<hr>', '&lt;hr&gt;', 'safeMode=3', {safeMode: 3});
  test_document('<hr>', '<hr>', 'safeMode default');
  test_document('<hr>', '<hr>', 'safeMode=0', {safeMode: 0});
  test_document('Lorum\nIpsum<br>', '<p>Lorum\nIpsum<br></p>', 'safeMode default');
  test_document('Lorum ipsum<br>', '<p>Lorum ipsum</p>', 'safeMode=1', {safeMode: 1});
  test_document('<hr>', '', 'safeMode=1', {safeMode: 1});
  test_document('<hr>', 'XXX', 'htmlReplacement option', {safeMode: 2, htmlReplacement: 'XXX'});
  // The {blockref} is passed through and gets picked up as a paragraph.
  test_document(
    '{v1}=\'1\'\n\n{v1}',
    '<p>1</p>',
    'stand-alone macro invocation');
  test_document(
    '{v1}=\'1\'\n\n\\{v1}',
    '<p>{v1}</p>',
    'escaped stand-alone macro invocation');
  test_document(
    '{undefined!}',
    '',
    'inclusion macro: empty document corner case');
  test_document(
    '\\<img href="url" alt="alt">',
    '<p>&lt;img href="url" alt="alt"&gt;</p>',
    'escaped HTML block');
  test_document(
    '{blockref}=\'BLOCKREF\'\n{inlineref}=\'INLINEREF\'\n{blockref}\n\nAn {inlineref}',
    '<p>BLOCKREF</p>\n<p>An INLINEREF</p>',
    'block and inline macro expansion');
  test_document(
    "{v1}='1'\n{v2}='2'\n{v1} and {v2}\n\n- {v1}\n\n{v2}",
    '<p>1 and 2</p>\n<ul><li>1\n</li></ul><p>2</p>',
    'macro invocation in list');
  test_document(
    "{v1}='1\n2'\n{v2}='3\n4'\n{v1} and {v2}",
    '<p>1\n2 and 3\n4</p>',
    'multi-line macro values rendered inline');
  test_document(
    "{v}='$1 and $2'\n{v|a|b_c_} {v|d|e\nfg}.",
    '<p>a and b<em>c</em> d and e\nfg.</p>',
    'parametrized macros');
  test_document(
    "{v}='This $1 and \\$2 and $3 and $42'\n{v}{v|} {v|1|2}",
    '<p>This $1 and \\$2 and $3 and $42This  and $2 and  and  This 1 and $2 and  and </p>',
    'parametrized macros with escaped, blank and missing parameters');
  test_document(
    "{v1}='$1 $2'\n{v2}='{v1|1|2} $1 $2'\n{v2|3|4} {v1|5|6}",
    '<p>1 2 3 4 5 6</p>',
    'nested parametrized macros');
  test_document(
    "{v1}='$1 $2'\n{v2}='<div>{v1|1|2} $1 $2</div>'\n{v2|3|4}",
    '<div>1 2 3 4</div>',
    'nested parametrized macros');
  test_document(
    "{mark}='<mark>$1</mark>'\n{sub}='<sub>$1</sub>'\n{mark|Note}: H{sub|2}O",
    '<p><mark>Note</mark>: H<sub>2</sub>O</p>',
    'text format parametrized macros');
  test_document(
    "{v1}='$1 and $10 and $2'\n{v1|one}\n{v1|}",
    '<p>one and  and \n and  and </p>',
    'undefined parametrized arguments replaced by an empty string');
  test_document(
    '{undefined|one|two}',
    '',
    'undefined macro invoked with arguments');
  test_document(
    ".-macros\n{v1}='{undefined}\n'\n {v1}",
    '<pre><code>{v1}</code></pre>',
    'multi-line macro definition defined with macros disabled');
  test_document(
    '.-macros\n<div>{undefined}\n</div>',
    '<div>{undefined}\n</div>',
    'multi-line HTML defined with macros disabled');
  test_document(
    "{src}='tiger.png'\n{caption}='Tiger'\n<image:{src}|{caption}>",
    '<img src="tiger.png" alt="Tiger">',
    'macro substitution in block image');
  test_document(
    '\\/*\nabc\n*/\n\n\\// xyz',
    '<p>/*\nabc\n*/</p>\n<p>// xyz</p>',
    'escaped comments');
  test_document(
    "{v}='This 'and' that'\n{v}",
    "<p>This 'and' that</p>",
    'single quotes are ok inside macros values');
  test_document(
    'A \\{v}',
    '<p>A {v}</p>',
    'escaped undefined macros are unescaped');
  test_document(
    '{v}',
    "<p>This 'and' that</p>",
    'macros are preserved across Rimu.render() invocations');
  test_document(
    'Hello {undefined}',
    '<p>Hello </p>',
    'undefined macro');
  test_document(
    'foo\n{undefined!}1\nbar {undefined|2\n3} four',
    '<p>foo\nbar  four</p>',
    'comment out block contents with inclusion and parametrized macros');
  test_document(
    "{v}='yes'\n{v!}.+skip\nfoobar",
    '',
    'comment out delimited block with inclusion macro');
  test_document(
    'Hello {undefined?undefined macro.}',
    '<p>Hello undefined macro.</p>',
    'existential macro invocation');
  test_document(
    "{v1}='<div>\n\n'\n{v2}='\n\n</div>\n\n'\n{v1}\nfoo\n\n{v2}\nbar",
    '<div>\n<p>foo</p>\n</div>\n<p>bar</p>',
    'macros with blank lines');
  test_document(
    'foo\n{undefined!}bar\nmacro',
    '<p>foo\nmacro</p>',
    'inclusion macro: ! syntax: undefined macro and empty pattern: skipped');
  test_document(
    "{v}='xxx'\nfoo\n{v!}bar\nmacro",
    '<p>foo\nbar\nmacro</p>',
    'inclusion macro: ! syntax: defined macro and empty pattern: included');
  test_document(
    "{v}=''\nfoo\n{v!}bar\nmacro",
    '<p>foo\nmacro</p>',
    'inclusion macro: ! syntax: blank value and empty pattern: skipped');
  test_document(
    'foo\n{undefined=}bar\nmacro',
    '<p>foo\nbar\nmacro</p>',
    'inclusion macro: = syntax: undefined macro and empty pattern: included');
  test_document(
    'foo\n{undefined=xxx}bar\nmacro',
    '<p>foo\nmacro</p>',
    'inclusion macro: = syntax: undefined macro and non-empty pattern: skipped');
  test_document(
    'foo\n{undefined=}bar\nmacro',
    '<p>foo\nbar\nmacro</p>',
    'inclusion macro: = syntax: undefined macro and empty pattern: included');
  test_document(
    "{v}=''\nfoo\n{v=}bar\nmacro",
    '<p>foo\nbar\nmacro</p>',
    'inclusion macro: = syntax: blank value and empty pattern: included');
  test_document(
    "{v}=''\nfoo\n{v=xxx}bar\nmacro",
    '<p>foo\nmacro</p>',
    'inclusion macro: = syntax: blank value and non-empty pattern: skipped');
  test_document(
    "{v}='xyz'\nfoo\n{v=.*z}bar\nmacro",
    '<p>foo\nbar\nmacro</p>',
    'inclusion macro: = syntax: value matches pattern: included');
  test_document(
    "{v}='1234'\nfoo\n{v=\\d+}bar\nmacro",
    '<p>foo\nbar\nmacro</p>',
    'inclusion macro: = syntax: value matches pattern: included');
  test_document(
    "{v}='xyz'\nfoo\n{v!.*z}bar\nmacro",
    '<p>foo\nmacro</p>',
    'inclusion macro: ! syntax: value matches pattern: skipped');
  test_document(
    "{v}='xxyz'\nfoo\n{v=x.z}bar\nmacro",
    '<p>foo\nmacro</p>',
    'inclusion macro: = syntax: value does not match pattern: skipped');
  test_document(
    "{v}='xxyz'\nfoo\n{v!x.z}bar\nmacro",
    '<p>foo\nbar\nmacro</p>',
    'inclusion macro: ! syntax: value does not match pattern: included');
  test_document(
    "{v}='xxyz'\nfoo\n{v=x{2,\\}yz}bar\nmacro",
    '<p>foo\nbar\nmacro</p>',
    'inclusion macro: = syntax: matched pattern with escaped } character');
  test_document(
    "{v}='[style=\"margin:0;\"]'\n.bar {v}\nfoobar",
    '<p class="bar" style="margin:0;">foobar</p>',
    'macro expansion in Block Attributes');
  test_document(
    '.bar {undefined!}\nfoobar',
    '<p>foobar</p>',
    'undefined macro in Block Attributes');
  test_document(
    '.#x1\n.foo\n.bar\n.[style="color:red;"]\n.[data-duration="5"]\n.-macros\n.-spans\n_foobar_ {undefined}\n\n_foobar_ {undefined}',
    '<p class="foo bar" id="x1" style="color:red;" data-duration="5">_foobar_ {undefined}</p>\n<p><em>foobar</em> </p>',
    'accumulated Block Attributes');
  test_document(
    "{v}='xxx'\n<div>\nfoo {v} bar</div>",
    '<div>\nfoo xxx bar</div>',
    'macro expansion in html delimited block');
  test_document(
    '<div>{undefined!}</div>',
    '',
    'inclusion macro: ! syntax: HTML line block');
  test_document(
    '<div>{undefined=xxx}</div>',
    '',
    'inclusion macro: = syntax: HTML line block');
  test_document(
    "{v}='xxx'\n<div>{v!}foobar</div>",
    '<div>foobar</div>',
    'inclusion macro: ! syntax: in html line block');
  test_document(
    "{v}='xxx'\n<div>{v=..x}foobar</div>",
    '<div>foobar</div>',
    'inclusion macro: = syntax: in html line block');
  test_document(
    "{v}='{$1} = 'foobar''\n{v|v1}\n{v1}",
    '<p>foobar</p>',
    'meta-macro (macro definition that generates macro definitions)');
  test_document(
    "{v}='foo' \\\nfoo' \\\\\nbar'\n{v}",
    "<p>foo'\nfoo'<br>\nbar</p>",
    'macro definition with backslash continuation and escaped continuation');
  test_document(
    "{v}='foo'\n{v1}='\\{v} {v}'\n{v1}\n\n{v}='bar'\n{v1}",
    "<p>foo foo</p>\n<p>bar foo</p>",
    'meta-macro with deferred evaluation');
  test_document(
    "{v}='foo $1 \\$1'\n{v1}='{v|1}'\n{v1|2}",
    "<p>foo 1 2</p>",
    'meta-macro with deferred parameter evaluation');
  test_document(
    '{skipped} = \'SKIPPED\'\n{skipped?foobar}',
    '<p>foobar</p>',
    'skip macro definitions in safe mode', {safeMode: 1});
  test_document(
    '.error\nError message\n\nNormal paragraph',
    '<p class="error">Error message</p>\n<p>Normal paragraph</p>',
    'html class');
  test_document(
    '.large error   #x1 [style="color: red;"]\nError message',
    '<p class="large error" id="x1" style="color: red;">Error message</p>',
    'html class, id and attributes');
  test_document(
    '.[style="color: red;"]\nError message',
    '<p>Error message</p>',
    'html attributes skipped by safeMode=2', {safeMode: 2});
  test_document(
    '.large error   #x1 [style="color: red;"]\nError message',
    '<p class="large error" id="x1">Error message</p>',
    'html attributes skipped by safeMode=1', {safeMode: 1});
  test_document(
    '.#preface\n== Preface',
    '<h2 id="preface">Preface</h2>',
    'header attributes');
  test_document(
    '.polaroid [width="800"]\n<image:tiger.png>',
    '<img class="polaroid" width="800" src="tiger.png" alt="tiger.png">',
    'block image html attributes');
  test_document(
    '.dl-horizontal\nterm:: definition\nterm::: definition',
    '<dl class="dl-horizontal"><dt>term</dt><dd> definition\n<dl><dt>term</dt><dd> definition\n</dd></dl></dd></dl>',
    'list html attributes');
  test_document(
    '.class1\n- Item\n..\n.class2\n...\nDivision\n...\n..\nParagraph',
    '<ul class="class1"><li>Item\n<div><div class="class2"><p>Division</p></div></div>\n</li></ul><p>Paragraph</p>',
    'list item with Division block containing Division block with html attributes');
  test_document(
    '{info}= \'.info #ref2 [style="color:green"]\'\n{info}\ngreeny\n\nnormal\n\n{2paragraphs} =\'paragraph 1\n\nparagraph2\'\n{2paragraphs}',
    '<p class="info" id="ref2" style="color:green">greeny</p>\n<p>normal</p>\n<p>paragraph 1</p>\n<p>paragraph2</p>',
    'html attributes assigned to macro');
  test_document(
    '{undefined}',
    '',
    'Single undefined macro');
  test_document(
    '{undefined=}',
    '',
    'Single undefined inclusion macro');
  test_document(
    '.+macros\n {undefined}\n\n {undefined}',
    '<pre><code></code></pre>\n<pre><code>{undefined}</code></pre>',
    'enable macro expansion in Indented paragraph');
  // Attribute Block expansion options.
  test_document(
    '.-macros\nThis is `{undefined}`\n\nThis is `{undefined}`',
    '<p>This is <code>{undefined}</code></p>\n<p>This is ``</p>',
    'disable macro expansion in normal paragraph');
  test_document(
    '.+macros\n--\n{undefined}\n--\n--\n{undefined}\n--',
    '<pre><code></code></pre>\n<pre><code>{undefined}</code></pre>',
    'enable macro expansion in Code Block');
  test_document(
    '.-macros\n<div>{undefined}</div>\n\n<div>{undefined}</div>',
    '<div>{undefined}</div>\n<div></div>',
    'disable macro expansion in HTML Block');
  test_document(
    '.-container\n..\nfoo\n..',
    '<div>foo</div>',
    '-container expansion option');
  test_document(
    '.-spans -specials\n&foo',
    '<p>&foo</p>',
    'disable specials (both spans and specials must off)');
  test_document(
    '.-spans -specials\n_&foo_',
    '<p>_&amp;foo_</p>',
    'specials expansion cannot be disabled in safe-mode', {safeMode: 1});
  test_document(
    '.-spans\n_&foo_',
    '<p>_&amp;foo_</p>',
    '-spans expansion option');
  test_document(
    '.+skip\nfoo\nbar',
    '',
    '+skip expansion option');

  // Quote definitions.
  test_document(
    '= = \'<del>|</del>\'\n=Testing *123*=',
    '<p><del>Testing <strong>123</strong></del></p>',
    'new single quote definition');
  test_document(
    '\\=Testing= 123',
    '<p>=Testing= 123</p>',
    'escaped single quote');
  test_document(
    '** = \'<strong>|</strong>\'\n**Testing** *123*',
    '<p><strong>Testing</strong> <strong>123</strong></p>',
    'new double quote definition');
  test_document(
    '\\**Testing** 123',
    '<p>**Testing** 123</p>',
    'escaped double quote');
  test_document(
    '_* = \'<em><strong>|</strong></em>\'\n_*Testing_* *123*',
    '<p><em><strong>Testing</strong></em> <strong>123</strong></p>',
    'new asymmetric double quote definition');
  test_document(
    '\\_*Testing_* 123',
    '<p>_*Testing_* 123</p>',
    'escaped asymmetric double quote');
  test_document(
    '#=\'<ins>|</ins>\'\n#skipped#',
    '<p>#skipped#</p>',
    'quote definition skipped in safe mode', {safeMode: 1});
  test_document(
    '=Testing= 123',
    '<p><del>Testing</del> 123</p>',
    'existing quotes work in safe mode', {safeMode: 1});
  test_document(
    '#=\'<ins>|</ins>\'\n#Quote 2#',
    '<p><ins>Quote 2</ins></p>',
    'second quote definition', {safeMode: 0});
  test_document(
    '==\'<code>||</code>\'\n=Testing #123#=',
    '<p><code>Testing #123#</code></p>',
    'update quote with no spans');
  test_document(
    '*=\'<em>|</em>\'\n**Testing** *123*',
    '<p><strong>Testing</strong> <em>123</em></p>',
    'modify built-in quote');

  // Replacement definitions.
  test_document(
    '/\\\\?\\.{3}/=\'&hellip;\'\nTesting...',
    '<p>Testing&hellip;</p>',
    'new replacement');
  test_document(
    'Testing\\...',
    '<p>Testing...</p>',
    'escaped replacement');
  test_document(
    '/skipped/=\'SKIPPED\'\nskipped',
    '<p>skipped</p>',
    'replacement definition skipped in safe mode', {safeMode: 1});
  test_document(
    'Testing...',
    '<p>Testing&hellip;</p>',
    'existing replacements work in safe mode', {safeMode: 1});
  test_document(
    '/\\\\?\\.{3}/i=\'...\'\nTesting...',
    '<p>Testing...</p>',
    'update replacement');
  test_document(
    "/\\\\?\\B'\\b(.+?)\\b'\\B/g = '<em>$1</em>'\n'emphasized'",
    '<p><em>emphasized</em></p>',
    'replacement with match groups');

  // Delimited Block definitions.
  test_document(
    '|paragraph| = \'<p class="normal">|</p>\'\nfoobar\n\n.test1 test2\nfoobar',
    '<p class="normal">foobar</p>\n<p class="test1 test2 normal">foobar</p>',
    'update HTML tags and test class injection');
  test_document(
    "|paragraph| = '<p>|</p>'\n_Lorum_ & {ipsum}.\n\n|paragraph| = '-macros'\n\n_Lorum_ & {ipsum}.\n\n|paragraph| = '<p class=\"normal\">|</p> -spans +macros'\n\n_Lorum_ & {ipsum}.",
    '<p><em>Lorum</em> &amp; .</p>\n<p><em>Lorum</em> &amp; {ipsum}.</p>\n<p class="normal">_Lorum_ &amp; .</p>',
    'paragraph expansion options');

  test.done();
};
