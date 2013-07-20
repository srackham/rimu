var Rimu = require('../bin/rimu.js');
var Spans = Rimu.Spans;

exports['API check'] = function(test) {
  test.ok(
      Spans.render.constructor === Function,
      'Span.render is a function');
  test.done();
};

exports['Quotes'] = function(test) {
  test.equal(Spans.render(
        'no markup'),
        'no markup',
        'text without markup');
  test.equal(Spans.render(
        '\\*11*'),
        '*11*',
        'escape strong quote');
  test.equal(Spans.render(
        '*11* 22 _33_'),
        '<strong>11</strong> 22 <em>33</em>',
        'strong and emphasis quotes');
  test.equal(Spans.render(
        '*1 1*'),
        '<strong>1 1</strong>',
        'strong quotes span words');
  test.equal(Spans.render(
        '*1\n1*'),
        '<strong>1\n1</strong>',
        'strong quotes span lines');
  test.equal(Spans.render(
        '\\*11* \\*22 _33_'),
        '*11* *22 <em>33</em>',
        'escape quotes');
  test.equal(Spans.render(
        '00 _ `_11_` _2*2*_ _2*2\\*_'),
        '00 _ <code>_11_</code> <em>2<strong>2</strong></em> <em>2*2*</em>',
        'nested quotes');
  test.equal(Spans.render(
        '__xyz\\_ abc_'),
        '<em>_xyz_ abc</em>',
        'quote containing quote characters');
  test.equal(Spans.render(
        '__xyz abc\\__'),
        '<em>_xyz abc_</em>',
        'quote containing quote characters');
  test.equal(Spans.render(
        '_*abc `efg`* h<sup>i</sup>_ j'),
        '<em><strong>abc <code>efg</code></strong> h<sup>i</sup></em> j',
        'nested quotes');
  test.equal(Spans.render(
        '`<http://example.com> \\``'),
        '<code>&lt;http://example.com&gt; `</code>',
        'code quotes');
  test.equal(Spans.render(
        '<a class="btn">abc</a> <a class="btn">xyz</a>'),
        '<a class="btn">abc</a> <a class="btn">xyz</a>',
        'two HTML attributes do not generate delete quote');
  test.done();
};

exports['Replacements'] = function(test) {
  test.equal(Spans.render(
        'http://foobar.com \\<http://foobar.com>'),
        'http://foobar.com &lt;http://foobar.com&gt;',
        'escaped http urls');
  test.equal(Spans.render(
        '*<http://foobar.com>* <http://foobar.com|Foo\n& Bar>'),
        '<strong><a href="http://foobar.com">http://foobar.com</a></strong> ' +
        '<a href="http://foobar.com">Foo\n&amp; Bar</a>',
        'quoted and parametrized http urls');
  test.equal(Spans.render(
        '<ftp://ftp.funet.fi/pub/standards/RFC/rfc959.txt>'),
        '<a href="ftp://ftp.funet.fi/pub/standards/RFC/rfc959.txt">ftp://ftp.funet.fi/pub/standards/RFC/rfc959.txt</a>',
        'ftp url');
  test.equal(Spans.render(
        '<file:///home/joe/downloads/> ' +
        '<file:///home/joe/doc/user-guide.pdf|User Guide> ' +
        '\\<file:///home/joe/downloads/>'),
        '<a href="file:///home/joe/downloads/">file:///home/joe/downloads/</a> ' +
        '<a href="file:///home/joe/doc/user-guide.pdf">User Guide</a> ' +
        '&lt;file:///home/joe/downloads/&gt;',
        'file urls');
  test.equal(Spans.render(
        '&copy; &reg;\\&para;'),
        '&copy; &reg;&amp;para;',
        'character entities');
  test.equal(Spans.render(
        'Lorum +\nipsum \\+\nvestibulum  +'),
        'Lorum<br>\nipsum +\nvestibulum <br>',
        'line breaks');
  test.equal(Spans.render(
      '\\+ Lorum \\+\nipsum \\+ + \\+vestibulum \\+'),
      '+ Lorum +\nipsum + + \\+vestibulum +',
      'safe plus');
  test.equal(Spans.render(
        'Lorum <<#x1>>ipsum <#x1|lorum link> \\<<#x1>>'),
        'Lorum <span id="x1"></span>ipsum <a href="#x1">lorum link</a> &lt;&lt;#x1&gt;&gt;',
        'inline anchors and links');
  test.equal(Spans.render(
        '<image:./images/tiger.png> ' +
        '<image:http://foobar.com|Tiger\n& Bar> ' +
        '\\<image:tiger.png>'),
        '<img src="./images/tiger.png" alt="./images/tiger.png"> ' +
        '<img src="http://foobar.com" alt="Tiger\n&amp; Bar"> ' +
        '&lt;image:tiger.png&gt;',
        'inline images');
  test.equal(Spans.render(
        '<joe.bloggs@foobar.com> ' +
        '<joe.bloggs@foobar.com|Joe\n Bloggs> ' +
        '\\<joe.bloggs@foobar.com>'),
        '<a href="mailto:joe.bloggs@foobar.com">joe.bloggs@foobar.com</a> ' +
        '<a href="mailto:joe.bloggs@foobar.com">Joe\n Bloggs</a> ' +
        '&lt;joe.bloggs@foobar.com&gt;',
        'email addresses');
  test.equal(Spans.render(
        '<u>underlined *text*</u>\\<hr>'),
        '<u>underlined <strong>text</strong></u>&lt;hr&gt;',
        'HTML tags');
  test.equal(Spans.render(
        '<span style="font-size:\n2em">inline elements</span>'),
        '<span style="font-size:\n2em">inline elements</span>',
        'HTML tags across line boundary');
  test.equal(Spans.render(
        "<a href='http://example.com'><image:tiger.png></a>"),
        "<a href='http://example.com'><img src=\"tiger.png\" alt=\"tiger.png\"></a>",
        'HTML element enveloping image');
  test.equal(Spans.render(
        '<chapter1.html>'),
        '<a href="chapter1.html">chapter1.html</a>',
        'relative url');
  test.equal(Spans.render(
        '<./chapter1.html#x1|Foo bar>'),
        '<a href="./chapter1.html#x1">Foo bar</a>',
        'parametrized relative url');
  test.equal(Spans.render(
        '<!-- comment -->'),
        '<!-- comment -->',
        'HTML comment');
  test.done();
};
