var Rimu = require('../bin/rimu.js');

exports['API check'] = function(test) {
  test.expect(1);
  test.ok(Rimu.Spans.render.constructor === Function);
  test.done();
};

exports['Quotes'] = function(test) {
//  test.expect(9);
  test.equal(Rimu.Spans.render(
        'no markup'),
        'no markup');
  test.equal(Rimu.Spans.render(
        '\\*11*'),
        '*11*');
  test.equal(Rimu.Spans.render(
        '*11* 22 _33_'),
        '<strong>11</strong> 22 <em>33</em>');
  test.equal(Rimu.Spans.render(
        '*1 1*'),
        '<strong>1 1</strong>');
  test.equal(Rimu.Spans.render(
        '*1\n1*'),
        '<strong>1\n1</strong>');
  test.equal(Rimu.Spans.render(
        '\\*11* \\*22 _33_'),
        '*11* *22 <em>33</em>');
  test.equal(Rimu.Spans.render(
        '00 _ `_11_` _2*2*_ _2*2\\*_'),
        '00 _ <code>_11_</code> <em>2<strong>2</strong></em> <em>2*2*</em>');
  test.equal(Rimu.Spans.render(
        '=11= +22+ "33" #4# H~2~O e^2^ _\\_'),
        '<del>11</del> <ins>22</ins> <q>33</q> <mark>4</mark> H<sub>2</sub>O e<sup>2</sup> __');
  test.equal(Rimu.Spans.render(
        '"to be _or_..." \\"that" is...'),
        '<q>to be <em>or</em>...</q> "that" is...');
  test.equal(Rimu.Spans.render(
        '_\\#xyz# abc_'),
        '<em>#xyz# abc</em>');
  test.equal(Rimu.Spans.render(
        '__xyz\\_ abc_'),
        '<em>_xyz_ abc</em>');
  test.equal(Rimu.Spans.render(
        '__xyz abc\\__'),
        '<em>_xyz abc_</em>');
  // Code quote.
  test.equal(Rimu.Spans.render(
        '`<http://example.com> \\``'),
        '<code>&lt;http://example.com&gt; `</code>');
  /*
  test.equal(Rimu.Spans.render(
        'Some /emphasized/ text this/is/not'),
        'Some <em>emphasized</em> text this/is/not');
  */

  test.done();
};

exports['Replacements'] = function(test) {
//  test.expect(2);

  // HTTP URLs.
  test.equal(Rimu.Spans.render(
        'http://foobar.com \\<http://foobar.com>'),
        'http://foobar.com &lt;http://foobar.com&gt;');
  test.equal(Rimu.Spans.render(
        '*<http://foobar.com>* <http://foobar.com|Foo\n& Bar>'),
        '<strong><a href="http://foobar.com">http://foobar.com</a></strong> ' +
        '<a href="http://foobar.com">Foo\n&amp; Bar</a>');

  // FTP URLs
  test.equal(Rimu.Spans.render(
        '<ftp://ftp.funet.fi/pub/standards/RFC/rfc959.txt>'),
        '<a href="ftp://ftp.funet.fi/pub/standards/RFC/rfc959.txt">ftp://ftp.funet.fi/pub/standards/RFC/rfc959.txt</a>');

  // File URLs.
  test.equal(Rimu.Spans.render(
        '<file:///home/joe/downloads/> ' +
        '<file:///home/joe/doc/user-guide.pdf|User Guide> ' +
        '\\<file:///home/joe/downloads/>'),
        '<a href="file:///home/joe/downloads/">file:///home/joe/downloads/</a> ' +
        '<a href="file:///home/joe/doc/user-guide.pdf">User Guide</a> ' +
        '&lt;file:///home/joe/downloads/&gt;');

  // Character entities.
  test.equal(Rimu.Spans.render(
        '&copy; &reg;\\&para;'),
        '&copy; &reg;&amp;para;');

  // Line break.
  test.equal(Rimu.Spans.render(
        'Lorum +\nipsum \\ +\nvestibulum  +'),
        'Lorum<br>\nipsum  +\nvestibulum <br>\n');

  // Anchors and links.
  test.equal(Rimu.Spans.render(
        'Lorum <<\\#x1>>ipsum <#x1|lorum link> \\<<#x1>>'),
        'Lorum <span id="x1"></span>ipsum <a href="#x1">lorum link</a> &lt;&lt;#x1&gt;&gt;');

  // Images.
  test.equal(Rimu.Spans.render(
        '<image:./images/tiger.png> ' +
        '<image:http://foobar.com|Tiger\n& Bar> ' +
        '\\<image:tiger.png>'),
        '<img src="./images/tiger.png" alt="./images/tiger.png"> ' +
        '<img src="http://foobar.com" alt="Tiger\n&amp; Bar"> ' +
        '&lt;image:tiger.png&gt;');

  // Email addresses.
  test.equal(Rimu.Spans.render(
        '<joe.bloggs@foobar.com> ' +
        '<joe.bloggs@foobar.com|Joe\n Bloggs> ' +
        '\\<joe.bloggs@foobar.com>'),
        '<a href="mailto:joe.bloggs@foobar.com">joe.bloggs@foobar.com</a> ' +
        '<a href="mailto:joe.bloggs@foobar.com">Joe\n Bloggs</a> ' +
        '&lt;joe.bloggs@foobar.com&gt;');

  // HTML tags.
  test.equal(Rimu.Spans.render(
        '<u>underlined *text*</u>\\<hr>'),
        '<u>underlined <strong>text</strong></u>&lt;hr&gt;');
  test.equal(Rimu.Spans.render(
        '<span style=\\"font-size:\n2em">inline elements</span>'),
        '<span style="font-size:\n2em">inline elements</span>');
  test.equal(Rimu.Spans.render(
        '<a href=\'http://example.com\'><image:tiger.png></a>'),
        '<a href=\'http://example.com\'><img src="tiger.png" alt="tiger.png"></a>');

  // Relative URLs.
  test.equal(Rimu.Spans.render(
        '<chapter1.html>'),
        '<a href="chapter1.html">chapter1.html</a>');
  test.equal(Rimu.Spans.render(
        '<./chapter1.html#x1|Foo bar>'),
        '<a href="./chapter1.html#x1">Foo bar</a>');

  test.done();
};
