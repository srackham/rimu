//
// Rimu
//
// By: Stuart Rackham
// https://github.com/srackham/rimu
//
var Rimu;
(function (Rimu) {
    // Rimu public API.
    function render(source, options) {
        if (typeof options === "undefined") { options = {}; }
        Rimu.Options.update(options);
        return renderSource(source);
    }
    Rimu.render = render;

    // Same as render() but does not reset macros or update options.
    function renderSource(source) {
        var reader = new Rimu.Reader(source);
        var writer = new Rimu.Writer();
        while (!reader.eof()) {
            reader.skipBlankLines();
            if (reader.eof())
                break;
            if (Rimu.Macros.renderInclusions(reader))
                continue;
            if (Rimu.LineBlocks.render(reader, writer))
                continue;
            if (Rimu.Lists.render(reader, writer))
                continue;
            if (Rimu.DelimitedBlocks.render(reader, writer))
                continue;
            // We should never arrive here because a normal paragraph (the last
            // delimited block) should catch all.
        }
        return writer.toString();
    }
    Rimu.renderSource = renderSource;
})(Rimu || (Rimu = {}));

if (typeof exports !== 'undefined') {
    exports.render = Rimu.render;
}

this.Rimu = Rimu;
var Rimu;
(function (Rimu) {
    // Whitespace strippers.
    function trimLeft(s) {
        return s.replace(/^\s+/g, '');
    }
    Rimu.trimLeft = trimLeft;
    function trimRight(s) {
        return s.replace(/\s+$/g, '');
    }
    Rimu.trimRight = trimRight;
    function trim(s) {
        return s.replace(/^\s+|\s+$/g, '');
    }
    Rimu.trim = trim;

    // http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function escapeRegExp(s) {
        return s.replace(/[\-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');
    }
    Rimu.escapeRegExp = escapeRegExp;
    ;

    function replaceSpecialChars(s) {
        return s.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;");
    }
    Rimu.replaceSpecialChars = replaceSpecialChars;

    // Replace match groups, optionally substituting the replacement groups with
    // the inline elements specified in options.
    function replaceMatch(match, replacement, options) {
        return replacement.replace(/\$\d/g, function () {
            // Replace $1, $2 ... with corresponding match groups.
            var i = parseInt(arguments[0][1]);
            var text = match[i];
            return replaceInline(text, options);
        });
    }
    Rimu.replaceMatch = replaceMatch;

    // Replace the inline elements specified in options in text and return the result.
    function replaceInline(text, options) {
        if (options.macros) {
            text = Rimu.Macros.render(text);
        }
        if (options.spans) {
            return Rimu.Spans.render(text);
        } else if (options.specials) {
            return replaceSpecialChars(text);
        } else {
            return text;
        }
    }
    Rimu.replaceInline = replaceInline;

    // Inject HTML attributes from LineBlocks.htmlAttributes into the opening tag.
    // Reset LineBlocks.htmlAttributes if the injection is successful.
    function injectAttributes(tag) {
        if (!tag || !Rimu.LineBlocks.htmlAttributes) {
            return tag;
        }
        var match = tag.match(/^<([a-zA-Z]+|h[1-6])(?=[ >])/);
        if (!match) {
            return tag;
        }
        var before = tag.slice(0, match[0].length);
        var after = tag.slice(match[0].length);
        var result = before + ' ' + Rimu.LineBlocks.htmlAttributes + after;
        Rimu.LineBlocks.htmlAttributes = '';
        return result;
    }
    Rimu.injectAttributes = injectAttributes;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    (function (Options) {
        // Option values.
        Options.safeMode;
        Options.htmlReplacement;

        // Set options to values in 'options', those not in 'options' are set to
        // their default value.
        function update(options) {
            Options.safeMode = ('safeMode' in options) ? options.safeMode : 0;
            Options.htmlReplacement = ('htmlReplacement' in options) ? options.htmlReplacement : '<mark>replaced HTML<mark>';
        }
        Options.update = update;

        function safeModeFilter(text) {
            switch (Options.safeMode) {
                case 0:
                    return text;
                case 1:
                    return '';
                case 2:
                    return Options.htmlReplacement;
                case 3:
                    return Rimu.replaceSpecialChars(text);
                default:
            }
        }
        Options.safeModeFilter = safeModeFilter;

        update({});
    })(Rimu.Options || (Rimu.Options = {}));
    var Options = Rimu.Options;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    var Reader = (function () {
        function Reader(text) {
            // Split lines on newline boundaries and trim trailing white space.
            // http://stackoverflow.com/questions/1155678/javascript-string-newline-character
            // TODO split is broken on IE8 e.g. 'X\n\nX'.split(/\n/g).length) returns 2 but should return 3.
            var lines = text.split(/\r\n|\r|\n/g);
            for (var i in lines) {
                lines[i] = lines[i].replace(/\s+$/, '');
            }
            this.lines = lines;
            this.pos = 0;
        }
        // Getter/setter for current line, return null if EOF.
        Reader.prototype.cursor = function (value) {
            if (typeof value === "undefined") { value = null; }
            if (this.eof())
                return null;
            if (value !== null) {
                this.lines[this.pos] = value;
            }
            return this.lines[this.pos];
        };

        Reader.prototype.eof = function () {
            return this.pos >= this.lines.length;
        };

        // Read the next line, return null if EOF.
        Reader.prototype.next = function () {
            if (this.eof())
                return null;
            this.pos++;
            if (this.eof())
                return null;
            return this.cursor();
        };

        // Read to the first line matching the re.
        // Return the array of lines preceding the match plus a line containing
        // the $1 match group (if it exists).
        // Return null if an EOF is encountered.
        // Exit with the reader pointing to the line following the match.
        Reader.prototype.readTo = function (find) {
            var result = [];
            var match;
            while (!this.eof()) {
                match = this.cursor().match(find);
                if (match) {
                    if (match.length > 1) {
                        result.push(match[1]);
                    }
                    this.next();
                    break;
                }
                result.push(this.cursor());
                this.next();
            }

            if (match || find.toString() === '/^$/' && this.eof()) {
                return result;
            } else {
                return null;
            }
        };

        Reader.prototype.skipBlankLines = function () {
            while (this.cursor() === '') {
                this.next();
            }
        };
        return Reader;
    })();
    Rimu.Reader = Reader;

    var Writer = (function () {
        function Writer() {
            this.buffer = [];
        }
        Writer.prototype.write = function (s) {
            this.buffer.push(s);
        };

        Writer.prototype.toString = function () {
            return this.buffer.join('');
        };
        return Writer;
    })();
    Rimu.Writer = Writer;

    if (typeof exports !== 'undefined') {
        exports.Reader = Rimu.Reader;
        exports.Writer = Rimu.Writer;
    }
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    (function (Macros) {
        Macros.defs = [];

        // Return named macro value or null if it doesn't exist.
        function get(name) {
            for (var i in Macros.defs) {
                if (Macros.defs[i].name === name) {
                    return Macros.defs[i].value;
                }
            }
            return null;
        }
        Macros.get = get;

        // Set named macro value or add it if it doesn't exist.
        function set(name, value) {
            for (var i in Macros.defs) {
                if (Macros.defs[i].name === name) {
                    Macros.defs[i].value = value;
                    return;
                }
            }
            Macros.defs.push({ name: name, value: value });
        }
        Macros.set = set;

        function render(text, options) {
            if (typeof options === "undefined") { options = {}; }
            if (options.inclusionsOnly) {
                var re = /\\?\{([\w\-]+)(!)\}/g;
            } else {
                var re = /\\?\{([\w\-]+)([|?!][\s\S]*?)?\}/g;
            }
            text = text.replace(re, function (match, name, params) {
                if (match[0] === '\\') {
                    return match.slice(1);
                }
                var value = get(name);
                if (!params) {
                    return (value === null) ? '' : value.replace(/\$\d+/g, '');
                }
                if (params[0] === '|') {
                    // Substitute macro parameters.
                    var result = value;
                    var paramsList = params.slice(1).split('|');
                    for (var i in paramsList) {
                        result = result.replace('$' + (parseInt(i) + 1), paramsList[i]);
                    }
                    result = result.replace(/\$\d+/g, '');
                    return result;
                } else if (params[0] === '?') {
                    if (value === null) {
                        return params.slice(1);
                    }
                } else if (params[0] === '!') {
                    if (value === null || value === '') {
                        return '\0';
                    } else {
                        return '';
                    }
                } else if (value === null) {
                    return '';
                } else {
                    return value;
                }
            });
            if (text.indexOf('\0') !== -1) {
                var lines = text.split('\n');
                for (var i = lines.length - 1; i >= 0; --i) {
                    if (lines[i].indexOf('\0') !== -1) {
                        lines.splice(i, 1);
                    }
                }
                text = lines.join('\n');
            }
            return text;
        }
        Macros.render = render;

        // If the current line on the reader begins with an inclusion macro invocation
        // then render inclusions and skip to the next line if any are undefined.
        // Return true if the line at the cursor was skipped else return false.
        function renderInclusions(reader) {
            var line = reader.cursor();
            if (!line) {
                return false;
            }
            if (!/^\{[\w\-]+!\}/.test(line)) {
                return false;
            }

            // Arrive here if the line at the cursor starts with an inclusion macro invocation.
            line = render(line, { inclusionsOnly: true });
            if (line !== '') {
                reader.cursor(line);
                return false;
            } else {
                reader.next();
                return true;
            }
        }
        Macros.renderInclusions = renderInclusions;

        if (typeof exports !== 'undefined') {
            exports.Macros = Rimu.Macros;
        }
    })(Rimu.Macros || (Rimu.Macros = {}));
    var Macros = Rimu.Macros;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    (function (LineBlocks) {
        var defs = [
            // Prefix match with backslash to allow escaping.
            // Quote definition.
            // quote = $1, openTag = $2, separator = $3, closeTag = $4
            {
                match: /^(\S)\s*=\s*'([^\|]*)(\|{1,2})(.*)'$/,
                replacement: '',
                macros: true,
                filter: function (match) {
                    if (Rimu.Options.safeMode !== 0) {
                        return '';
                    }
                    Rimu.Quotes.set({
                        quote: match[1],
                        openTag: match[2],
                        closeTag: match[4],
                        spans: match[3] === '|'
                    });
                    return '';
                }
            },
            // Replacement definition.
            // pattern = $1, flags = $2, replacement = $3
            {
                match: /^\\?\/(.+)\/([igm]*)\s*=\s*'(.*)'$/,
                replacement: '',
                macros: true,
                filter: function (match) {
                    if (Rimu.Options.safeMode !== 0) {
                        return '';
                    }
                    var pattern = match[1];
                    var flags = match[2];
                    var replacement = match[3];
                    replacement = Rimu.replaceInline(replacement, this);
                    Rimu.Replacements.set(pattern, flags, replacement);
                    return '';
                }
            },
            // Macro definition.
            // name = $1, value = $2
            {
                match: /^\\?\{([\w\-]+)\}\s*=\s*'(.*)'$/,
                replacement: '',
                macros: true,
                filter: function (match) {
                    if (Rimu.Options.safeMode !== 0) {
                        return '';
                    }
                    var name = match[1];
                    var value = match[2];
                    value = Rimu.replaceInline(value, this);
                    Rimu.Macros.set(name, value);
                    return '';
                }
            },
            // Macro invocation.
            // reference = $1
            {
                match: /^(\{[\w\-]+(?:[|?].*)?\})$/,
                replacement: '',
                filter: function (match, reader) {
                    var value = Rimu.Macros.render(match[1]);
                    if (value === match[1]) {
                        // Macro does not exist so pass it through.
                        value = '\\' + value;
                    }

                    // Insert the macro value into the reader just ahead of the cursor.
                    reader.lines = [].concat(reader.lines.slice(0, reader.pos + 1), value.split('\n'), reader.lines.slice(reader.pos + 1));
                    return '';
                }
            },
            // Headers.
            // $1 is ID, $2 is header text.
            {
                match: /^\\?((?:#|=){1,6})\s+(.+?)(?:\s+(?:#|=){1,6})?$/,
                replacement: '<h$1>$2</h$1>',
                macros: true,
                spans: true,
                filter: function (match) {
                    match[1] = match[1].length.toString();
                    return Rimu.replaceMatch(match, this.replacement, this);
                }
            },
            // Comment line.
            {
                match: /^\\?\/{2}(.*)$/,
                replacement: ''
            },
            // Block image: <image:src|alt>
            // src = $1, alt = $2
            {
                match: /^\\?<image:([^\s\|]+)\|([\s\S]+?)>$/,
                replacement: '<img src="$1" alt="$2">',
                macros: true,
                specials: true
            },
            // Block image: <image:src>
            // src = $1, alt = $1
            {
                match: /^\\?<image:([^\s\|]+?)>$/,
                replacement: '<img src="$1" alt="$1">',
                macros: true,
                specials: true
            },
            // Block anchor: <<#id>>
            // id = $1
            {
                match: /^\\?<<#([a-zA-Z][\w\-]*)>>$/,
                replacement: '<div id="$1"></div>',
                macros: true,
                specials: true
            },
            // HTML attributes.
            // Syntax: .[class names][#id][[attributes]]
            // class names = $1, id = $2, attributes = $3
            {
                id: 'attributes',
                match: /^\\?\.([a-zA-Z][\w\- ]*)?(#[a-zA-Z][\w\-]*)?(?:\s*)?(\[.+\])?$/,
                replacement: '',
                filter: function (match) {
                    LineBlocks.htmlAttributes = '';
                    if (match[1]) {
                        LineBlocks.htmlAttributes += 'class="' + Rimu.trim(match[1]) + '"';
                    }
                    if (match[2]) {
                        LineBlocks.htmlAttributes += ' id="' + Rimu.trim(match[2]).slice(1) + '"';
                    }
                    if (match[3] && Rimu.Options.safeMode === 0) {
                        LineBlocks.htmlAttributes += ' ' + Rimu.trim(match[3].slice(1, match[3].length - 1));
                    }
                    LineBlocks.htmlAttributes = Rimu.trim(LineBlocks.htmlAttributes);
                    return '';
                }
            }
        ];

        LineBlocks.htmlAttributes = '';

        function render(reader, writer) {
            if (reader.eof())
                throw 'premature eof';
            for (var i in defs) {
                var def = defs[i];
                var match = def.match.exec(reader.cursor());
                if (match) {
                    if (match[0][0] === '\\') {
                        // Drop backslash escape and continue.
                        reader.cursor(reader.cursor().slice(1));
                        continue;
                    }
                    var text;
                    if (!def.filter) {
                        text = Rimu.replaceMatch(match, def.replacement, def);
                    } else {
                        text = def.filter(match, reader);
                    }
                    text = Rimu.injectAttributes(text);
                    writer.write(text);
                    reader.next();
                    if (text && !reader.eof()) {
                        writer.write('\n');
                    }
                    return true;
                }
            }
            return false;
        }
        LineBlocks.render = render;

        // Return def definition or null if not found.
        function getDefinition(id) {
            for (var i in defs) {
                if (defs[i].id === id) {
                    return defs[i];
                }
            }
            return null;
        }
        LineBlocks.getDefinition = getDefinition;

        if (typeof exports !== 'undefined') {
            exports.LineBlocks = Rimu.LineBlocks;
        }
    })(Rimu.LineBlocks || (Rimu.LineBlocks = {}));
    var LineBlocks = Rimu.LineBlocks;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    (function (DelimitedBlocks) {
        var defs = [
            // Delimited blocks cannot be escaped with a backslash.
            // Macro definition block.
            {
                openMatch: /^\\?\{[\w\-]+\}\s*=\s*'(.*)$/,
                closeMatch: /^(.*)'$/,
                openTag: '',
                closeTag: '',
                macros: true,
                filter: function (text, match) {
                    // Set macro.
                    // Get the macro name from the match in the first line of the block.
                    var name = match[0].match(/^\{([\w\-]+)\}/)[1];
                    Rimu.Macros.set(name, text);
                    return '';
                }
            },
            // Comment block.
            {
                openMatch: /^\\?\/\*+$/,
                closeMatch: /^\*+\/$/,
                openTag: '',
                closeTag: '',
                skip: true
            },
            // Division block.
            {
                id: 'division',
                openMatch: /^\\?\.{2,}$/,
                closeMatch: /^\.{2,}$/,
                openTag: '<div>',
                closeTag: '</div>',
                container: true
            },
            // Quote block.
            {
                id: 'quote',
                openMatch: /^\\?"{2,}$/,
                closeMatch: /^"{2,}$/,
                openTag: '<blockquote>',
                closeTag: '</blockquote>',
                container: true
            },
            // Code block.
            {
                id: 'code',
                openMatch: /^\\?\-{2,}$/,
                closeMatch: /^\-{2,}$/,
                openTag: '<pre><code>',
                closeTag: '</code></pre>',
                macros: true,
                specials: true
            },
            // HTML block.
            {
                // Must start with  an <! or a block-level element start or end tag.
                // $1 is first line of block.
                openMatch: /^(<!.*|(?:<\/?(?:html|head|body|iframe|script|style|address|article|aside|audio|blockquote|canvas|dd|div|dl|fieldset|figcaption|figure|figcaption|footer|form|h1|h2|h3|h4|h5|h6|header|hgroup|hr|img|math|nav|noscript|ol|output|p|pre|section|table|tfoot|ul|video)(?:[ >].*)?))$/i,
                closeMatch: /^$/,
                openTag: '',
                closeTag: '',
                macros: true,
                filter: function (text) {
                    return Rimu.Options.safeModeFilter(text);
                }
            },
            // Indented paragraph.
            {
                id: 'indented',
                openMatch: /^\\?(\s+.*)$/,
                closeMatch: /^$/,
                openTag: '<pre>',
                closeTag: '</pre>',
                macros: true,
                specials: true,
                filter: function (text) {
                    // Strip indent from start of each line.
                    var first_indent = text.search(/\S/);
                    var buffer = text.split('\n');
                    for (var i in buffer) {
                        // Strip first line indent width or up to first non-space character.
                        var indent = buffer[i].search(/\S/);
                        if (indent > first_indent)
                            indent = first_indent;
                        buffer[i] = buffer[i].slice(indent);
                    }
                    return buffer.join('\n');
                }
            },
            // Paragraph (lowest priority, cannot be escaped).
            {
                openMatch: /^(.*)$/,
                closeMatch: /^$/,
                openTag: '<p>',
                closeTag: '</p>',
                macros: true,
                spans: true
            }
        ];

        function render(reader, writer) {
            if (reader.eof())
                throw 'premature eof';
            for (var i in defs) {
                var def = defs[i];
                var match = reader.cursor().match(def.openMatch);
                if (match) {
                    if (match[0][0] === '\\' && parseInt(i) !== defs.length - 1) {
                        // Drop backslash escape and continue.
                        reader.cursor(reader.cursor().slice(1));
                        continue;
                    }
                    if (def.verify && !def.verify(match)) {
                        continue;
                    }
                    var lines = [];

                    if (match.length > 1) {
                        lines.push(match[1]);
                    }

                    // Read content up to the closing delimiter.
                    reader.next();
                    var content = reader.readTo(def.closeMatch);
                    if (content !== null) {
                        lines = lines.concat(content);
                    }

                    if (def.skip)
                        return true;
                    writer.write(Rimu.injectAttributes(def.openTag));
                    var text = lines.join('\n');
                    if (def.filter) {
                        text = def.filter(text, match);
                    }
                    if (def.container) {
                        text = Rimu.renderSource(text);
                    } else {
                        text = Rimu.replaceInline(text, def);
                    }
                    writer.write(text);
                    writer.write(def.closeTag);
                    if (text && !reader.eof()) {
                        writer.write('\n');
                    }
                    return true;
                }
            }
            return false;
        }
        DelimitedBlocks.render = render;

        // Return block definition or null if not found.
        function getDefinition(id) {
            for (var i in defs) {
                if (defs[i].id === id) {
                    return defs[i];
                }
            }
            return null;
        }
        DelimitedBlocks.getDefinition = getDefinition;

        if (typeof exports !== 'undefined') {
            exports.DelimitedBlocks = Rimu.DelimitedBlocks;
        }
    })(Rimu.DelimitedBlocks || (Rimu.DelimitedBlocks = {}));
    var DelimitedBlocks = Rimu.DelimitedBlocks;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    (function (Lists) {
        var defs = [
            // Prefix match with backslash to allow escaping.
            // Unordered lists.
            // $1 is list ID $2 is item text.
            {
                match: /^\\?\s*(-|\*{1,4})\s+(.*)$/,
                listOpenTag: '<ul>',
                listCloseTag: '</ul>',
                itemOpenTag: '<li>',
                itemCloseTag: '</li>'
            },
            // Ordered lists.
            // $1 is list ID $2 is item text.
            {
                match: /^\\?\s*(?:\d*)(\.{1,4})\s+(.*)$/,
                listOpenTag: '<ol>',
                listCloseTag: '</ol>',
                itemOpenTag: '<li>',
                itemCloseTag: '</li>'
            },
            // Definition lists.
            // $1 is term, $2 is list ID, $3 is definition.
            {
                match: /^\\?\s*(.*[^:])(\:{2,4})(|\s+.*)$/,
                listOpenTag: '<dl>',
                listCloseTag: '</dl>',
                itemOpenTag: '<dd>',
                itemCloseTag: '</dd>',
                termOpenTag: '<dt>',
                termCloseTag: '</dt>'
            }
        ];

        var ids;

        function render(reader, writer) {
            if (reader.eof())
                throw 'premature eof';
            var startItem;
            if (!(startItem = matchItem(reader))) {
                return false;
            }
            ids = [];
            renderList(startItem, reader, writer);

            // ids should now be empty.
            return true;
        }
        Lists.render = render;

        function renderList(startItem, reader, writer) {
            ids.push(startItem.id);
            writer.write(Rimu.injectAttributes(startItem.def.listOpenTag));
            var nextItem;
            while (true) {
                nextItem = renderListItem(startItem, reader, writer);
                if (!nextItem || nextItem.id !== startItem.id) {
                    // End of list or next item belongs to ancestor.
                    writer.write(startItem.def.listCloseTag);
                    ids.pop();
                    return nextItem;
                }
                startItem = nextItem;
            }
        }

        function renderListItem(startItem, reader, writer) {
            var def = startItem.def;
            var match = startItem.match;
            var text;
            if (match.length === 4) {
                writer.write(def.termOpenTag);
                text = Rimu.replaceInline(match[1], { macros: true, spans: true });
                writer.write(text);
                writer.write(def.termCloseTag);
            }
            writer.write(def.itemOpenTag);

            // Process of item text.
            var lines = new Rimu.Writer();
            lines.write(match[match.length - 1]);
            lines.write('\n');
            reader.next();
            var nextItem;
            nextItem = readToNext(startItem, reader, lines);
            text = lines.toString();
            text = Rimu.replaceInline(text, { macros: true, spans: true });
            writer.write(text);
            while (true) {
                if (!nextItem) {
                    // EOF or non-list related item.
                    writer.write(def.itemCloseTag);
                    return null;
                } else if (nextItem.isListItem) {
                    if (ids.indexOf(nextItem.id) !== -1) {
                        // Item belongs to current list or an ancestor list.
                        writer.write(def.itemCloseTag);
                        return nextItem;
                    } else {
                        // Render new child list.
                        nextItem = renderList(nextItem, reader, writer);
                        writer.write(def.itemCloseTag);
                        return nextItem;
                    }
                } else if (nextItem.isDelimited || nextItem.isIndented) {
                    // Delimited blocks and Indented blocks attach to list items.
                    var savedIds = ids;
                    ids = [];
                    Rimu.DelimitedBlocks.render(reader, writer);
                    ids = savedIds;
                    reader.skipBlankLines();
                    if (reader.eof()) {
                        writer.write(def.itemCloseTag);
                        return null;
                    } else {
                        nextItem = matchItem(reader);
                    }
                }
            }
            // Should never arrive here.
        }

        // Translate the list item in the reader to the writer until the next element
        // is encountered. Return 'next' containing the next element's match and
        // identity information.
        function readToNext(item, reader, writer) {
            // The reader should be at the line following the first line of the list
            // item (or EOF).
            var next;
            while (true) {
                if (reader.eof())
                    return null;
                if (reader.cursor() === '') {
                    // The list item has ended, check what follows.
                    reader.skipBlankLines();
                    if (reader.eof())
                        return null;
                    return matchItem(reader, { delimited: true, indented: true });
                }
                next = matchItem(reader, { delimited: true });
                if (next) {
                    return next;
                }
                writer.write(reader.cursor());
                writer.write('\n');
                reader.next();
            }
        }

        // Check if the line at the reader cursor matches a list related element. If
        // does return list item information else return null.  By default it matches
        // list item elements but 'options' can be included to include delimited
        // blocks or indented paragraphs.
        function matchItem(reader, options) {
            if (typeof options === "undefined") { options = {}; }
            // Consume any HTML attributes elements.
            var attrRe = Rimu.LineBlocks.getDefinition('attributes').match;
            if (attrRe.test(reader.cursor())) {
                Rimu.LineBlocks.render(reader, new Rimu.Writer());
            }

            // Check if the line matches a list definition.
            var line = reader.cursor();
            var item = {};
            var def;
            for (var i in defs) {
                var match = defs[i].match.exec(line);
                if (match) {
                    if (match[0][0] === '\\') {
                        reader.cursor(reader.cursor().slice(1));
                        return null;
                    }
                    item.match = match;
                    item.def = defs[i];
                    item.id = match[match.length - 2];
                    item.isListItem = true;
                    return item;
                }
            }
            if (options.delimited) {
                for (var id in { quote: 0, code: 0, division: 0 }) {
                    def = Rimu.DelimitedBlocks.getDefinition(id);
                    if (def.openMatch.test(line)) {
                        item.isDelimited = true;
                        return item;
                    }
                }
            }
            if (options.indented) {
                def = Rimu.DelimitedBlocks.getDefinition('indented');
                if (def.openMatch.test(line)) {
                    item.isIndented = true;
                    return item;
                }
            }
            return null;
        }

        if (typeof exports !== 'undefined') {
            exports.Lists = Lists;
        }
    })(Rimu.Lists || (Rimu.Lists = {}));
    var Lists = Rimu.Lists;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    (function (Spans) {
        function render(source) {
            var fragments = [{ text: source, done: false }];
            fragQuotes(fragments);
            fragReplacements(fragments);
            fragSpecials(fragments);
            return defrag(fragments);
        }
        Spans.render = render;

        // Converts fragments to a string.
        function defrag(fragments) {
            var result = [];
            for (var i in fragments) {
                result.push(fragments[i].text);
            }
            return result.join('');
        }

        function fragQuotes(fragments) {
            var findRe = Rimu.Quotes.findRe;
            var fragmentIndex = 0;
            var fragment = fragments[fragmentIndex];
            var nextFragment;
            var match;
            findRe.lastIndex = 0;
            while (true) {
                if (fragment.done) {
                    nextFragment = true;
                } else {
                    match = findRe.exec(fragment.text);
                    nextFragment = !match;
                }
                if (nextFragment) {
                    fragmentIndex++;
                    if (fragmentIndex >= fragments.length) {
                        break;
                    }
                    fragment = fragments[fragmentIndex];
                    if (match) {
                        findRe.lastIndex = 0;
                    }
                    continue;
                }
                if (match[0][0] === '\\') {
                    continue;
                }

                // Arrive here if we have a matched quote.
                var def = Rimu.Quotes.find(match[1]);
                if (def.verify && !def.verify(match, findRe)) {
                    // Next search starts after the opening quote (not the closing quote).
                    findRe.lastIndex = match.index + 1;
                    continue;
                }

                // The quotes splits the fragment into 5 fragments.
                var before = match.input.slice(0, match.index);
                var quoted = match[2];
                var after = match.input.slice(findRe.lastIndex);
                fragments.splice(fragmentIndex, 1, { text: before, done: false }, { text: def.openTag, done: true }, { text: quoted, done: false }, { text: def.closeTag, done: true }, { text: after, done: false });

                // Move to 'quoted' fragment.
                fragmentIndex += 2;
                fragment = fragments[fragmentIndex];
                if (!def.spans) {
                    fragment.text = Rimu.Quotes.unescape(fragment.text);
                    fragment.text = Rimu.replaceSpecialChars(fragment.text);
                    fragment.done = true;

                    // Move to 'after' fragment.
                    fragmentIndex += 2;
                    fragment = fragments[fragmentIndex];
                }
                findRe.lastIndex = 0;
            }

            for (var i in fragments) {
                fragment = fragments[i];
                if (!fragment.done) {
                    fragment.text = Rimu.Quotes.unescape(fragment.text);
                }
            }
        }

        function fragReplacements(fragments) {
            for (var i in Rimu.Replacements.defs) {
                fragReplacement(fragments, Rimu.Replacements.defs[i]);
            }
        }

        function fragReplacement(fragments, def) {
            var findRe = def.match;
            var fragmentIndex = 0;
            var fragment = fragments[fragmentIndex];
            var nextFragment;
            var match;
            findRe.lastIndex = 0;
            while (true) {
                if (fragment.done) {
                    nextFragment = true;
                } else {
                    match = findRe.exec(fragment.text);
                    nextFragment = !match;
                }
                if (nextFragment) {
                    fragmentIndex++;
                    if (fragmentIndex >= fragments.length) {
                        break;
                    }
                    fragment = fragments[fragmentIndex];
                    if (match) {
                        findRe.lastIndex = 0;
                    }
                    continue;
                }

                // Arrive here if we have a matched replacement.
                // The replacement splits the fragment into 3 fragments.
                var before = match.input.slice(0, match.index);
                var after = match.input.slice(findRe.lastIndex);
                fragments.splice(fragmentIndex, 1, { text: before, done: false }, { text: '', done: true }, { text: after, done: false });

                // Advance to 'matched' fragment and fill in the replacement text.
                fragmentIndex++;
                fragment = fragments[fragmentIndex];
                if (match[0][0] === '\\') {
                    // Remove leading backslash.
                    fragment.text = match.input.slice(match.index + 1, findRe.lastIndex);
                    fragment.text = Rimu.replaceSpecialChars(fragment.text);
                } else {
                    if (!def.filter) {
                        fragment.text = Rimu.replaceMatch(match, def.replacement, { specials: true });
                    } else {
                        fragment.text = def.filter(match);
                    }
                }
                fragmentIndex++;
                fragment = fragments[fragmentIndex];
                findRe.lastIndex = 0;
            }
        }

        function fragSpecials(fragments) {
            // Replace special characters in all non-done fragments.
            var fragment;
            for (var i in fragments) {
                fragment = fragments[i];
                if (!fragment.done) {
                    fragment.text = Rimu.replaceSpecialChars(fragment.text);
                }
            }
        }

        if (typeof exports !== 'undefined') {
            exports.Spans = Rimu.Spans;
        }
    })(Rimu.Spans || (Rimu.Spans = {}));
    var Spans = Rimu.Spans;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    (function (Quotes) {
        Quotes.defs = [
            {
                quote: '_',
                openTag: '<em>',
                closeTag: '</em>',
                spans: true
            },
            {
                quote: '*',
                openTag: '<strong>',
                closeTag: '</strong>',
                spans: true
            },
            {
                quote: '`',
                openTag: '<code>',
                closeTag: '</code>',
                spans: false
            }
        ];

        Quotes.findRe;
        var unescapeRe;

        initialize();

        // Synthesise re's to find and unescape quotes.
        function initialize() {
            var s = [];
            for (var i in Quotes.defs) {
                s.push(Rimu.escapeRegExp(Quotes.defs[i].quote));
            }

            // $1 is quote character, $2 is quoted text.
            // Quoted text cannot begin or end with whitespace.
            // Quoted can span multiple lines.
            // Quoted text cannot end with a backslash.
            Quotes.findRe = RegExp('\\\\?(' + s.join('|') + ')([^\\s\\\\]|\\S[\\s\\S]*?[^\\s\\\\])\\1', 'g');

            // $1 is quote character.
            unescapeRe = RegExp('\\\\(' + s.join('|') + ')', 'g');
        }

        // Return the quote definition corresponding to 'quote' character.
        function find(quote) {
            for (var i in Quotes.defs) {
                if (Quotes.defs[i].quote === quote)
                    return Quotes.defs[i];
            }
        }
        Quotes.find = find;

        // Strip backslashes from quote characters.
        function unescape(s) {
            return s.replace(unescapeRe, '$1');
        }
        Quotes.unescape = unescape;

        // Update existing or add new quote definition.
        function set(def) {
            for (var i in Quotes.defs) {
                if (Quotes.defs[i].quote === def.quote) {
                    // Update existing definition.
                    Quotes.defs[i].openTag = def.openTag;
                    Quotes.defs[i].closeTag = def.closeTag;
                    Quotes.defs[i].spans = def.spans;
                    return;
                }
            }

            // Add new definition at start of defs list.
            Quotes.defs.unshift(def);
            initialize();
        }
        Quotes.set = set;

        if (typeof exports !== 'undefined') {
            exports.Quotes = Rimu.Quotes;
        }
    })(Rimu.Quotes || (Rimu.Quotes = {}));
    var Quotes = Rimu.Quotes;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    (function (Replacements) {
        Replacements.defs = [
            // Begin match with \\? to allow the replacement to be escaped.
            // Global flag must be set on match re's so that the RegExp lastIndex property is set.
            // Replacements and special characters are expanded in replacement groups ($1..).
            // Replacement order is important.
            // Character entity.
            {
                match: /\\?(&[\w#][\w]+;)/g,
                replacement: '',
                filter: function (match) {
                    return match[1];
                }
            },
            // Line-break (space followed by \ at end of line).
            {
                match: /[\\ ]\\(\n|$)/g,
                replacement: '<br>$1'
            },
            // DEPRECATED: version 1 "+" line-break.
            {
                match: /[\\ ]\+(\n|$)/g,
                replacement: '<br>$1'
            },
            // Anchor: <<#id>>
            {
                match: /\\?<<#([a-zA-Z][\w\-]*)>>/g,
                replacement: '<span id="$1"></span>'
            },
            // Image: <image:src|alt>
            // src = $1, alt = $2
            {
                match: /\\?<image:([^\s\|]+)\|([\s\S]+?)>/g,
                replacement: '<img src="$1" alt="$2">'
            },
            // Image: <image:src>
            // src = $1, alt = $1
            {
                match: /\\?<image:([^\s\|]+?)>/g,
                replacement: '<img src="$1" alt="$1">'
            },
            // Email: <address|caption>
            // address = $1, caption = $2
            {
                match: /\\?<(\S+@[\w\.\-]+)\|([\s\S]+?)>/g,
                replacement: '<a href="mailto:$1">$2</a>'
            },
            // Email: <address>
            // address = $1, caption = $1
            {
                match: /\\?<(\S+@[\w\.\-]+)>/g,
                replacement: '<a href="mailto:$1">$1</a>'
            },
            // HTML tags.
            {
                match: /\\?(<[!\/]?[a-zA-Z\-]+(:?\s+[^<>&]+)?>)/g,
                replacement: '',
                filter: function (match) {
                    return Rimu.Options.safeModeFilter(match[1]);
                }
            },
            // Link: <url|caption>
            // url = $1, caption = $2
            {
                match: /\\?<(\S+?)\|([\s\S]+?)>/g,
                replacement: '<a href="$1">$2</a>'
            },
            // Link: <url>
            // url = $1
            {
                match: /\\?<(\S+?)>/g,
                replacement: '<a href="$1">$1</a>'
            }
        ];

        // Update existing or add new replacement definition.
        function set(regexp, flags, replacement) {
            if (!/g/.test(flags)) {
                flags += 'g';
            }
            for (var i in Replacements.defs) {
                if (Replacements.defs[i].match.source === regexp) {
                    // Update existing definition.
                    // Flag properties are read-only so have to create new RegExp.
                    Replacements.defs[i].match = new RegExp(regexp, flags);
                    Replacements.defs[i].replacement = replacement;
                    return;
                }
            }

            // Add new definition at start of defs list.
            Replacements.defs.unshift({ match: new RegExp(regexp, flags), replacement: replacement });
        }
        Replacements.set = set;

        if (typeof exports !== 'undefined') {
            exports.Replacements = Rimu.Replacements;
        }
    })(Rimu.Replacements || (Rimu.Replacements = {}));
    var Replacements = Rimu.Replacements;
})(Rimu || (Rimu = {}));
