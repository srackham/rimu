/// <reference path="references.ts" />
var Rimu;
(function (Rimu) {
    // Add objects in hash to module exports so they can be imported by the nodejs require() function.
    // Hash key is the exported name; hash value is the exported object.
    function exportCommonjs(objects) {
        if (typeof exports !== 'undefined') {
            for (var key in objects) {
                exports[key] = objects[key];
            }
        }
    }
    Rimu.exportCommonjs = exportCommonjs;
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
    function replaceSpecialChars(s) {
        return s.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
    }
    Rimu.replaceSpecialChars = replaceSpecialChars;
    // Replace match groups, optionally substituting the replacement groups with
    // the inline elements specified in options.
    function replaceMatch(match, replacement, expansionOptions) {
        return replacement.replace(/\$\d/g, function () {
            // Replace $1, $2 ... with corresponding match groups.
            var i = parseInt(arguments[0][1]); // match group number.
            var text = match[i]; // match group text.
            return replaceInline(text, expansionOptions);
        });
    }
    Rimu.replaceMatch = replaceMatch;
    // Replace the inline elements specified in options in text and return the result.
    function replaceInline(text, expansionOptions) {
        if (expansionOptions.macros) {
            text = Rimu.Macros.render(text);
            text = text === null ? '' : text;
        }
        // Spans also expand special characters.
        if (expansionOptions.spans) {
            return Rimu.Spans.render(text);
        }
        else if (expansionOptions.specials) {
            return replaceSpecialChars(text);
        }
        else {
            return text;
        }
    }
    Rimu.replaceInline = replaceInline;
    // Inject HTML attributes from LineBlocks.htmlAttributes into the opening tag.
    // Consume LineBlocks.htmlAttributes unless the 'tag' argument is blank.
    function injectHtmlAttributes(tag) {
        if (!tag) {
            return tag;
        }
        if (Rimu.LineBlocks.htmlClasses) {
            if (/class="\S.*"/.test(tag)) {
                // Inject class names into existing class attribute.
                tag = tag.replace(/class="(\S.*?)"/, 'class="' + Rimu.LineBlocks.htmlClasses + ' $1"');
            }
            else {
                // Prepend new class attribute to HTML attributes.
                Rimu.LineBlocks.htmlAttributes = trim('class="' + Rimu.LineBlocks.htmlClasses + '" ' + Rimu.LineBlocks.htmlAttributes);
            }
        }
        if (Rimu.LineBlocks.htmlAttributes) {
            var match = tag.match(/^<([a-zA-Z]+|h[1-6])(?=[ >])/);
            if (match) {
                var before = tag.slice(0, match[0].length);
                var after = tag.slice(match[0].length);
                tag = before + ' ' + Rimu.LineBlocks.htmlAttributes + after;
            }
        }
        // Consume the attributes.
        Rimu.LineBlocks.htmlClasses = '';
        Rimu.LineBlocks.htmlAttributes = '';
        return tag;
    }
    Rimu.injectHtmlAttributes = injectHtmlAttributes;
})(Rimu || (Rimu = {}));
/// <reference path="references.ts" />
var Rimu;
(function (Rimu) {
    var Options;
    (function (Options) {
        // Option values.
        Options.safeMode;
        Options.htmlReplacement;
        /**
         * Set options to values in 'options', those not in 'options' are set to their default value.
         *
         * @param options
         */
        function update(options) {
            Options.safeMode = ('safeMode' in options) ? options.safeMode : 0;
            Options.htmlReplacement = ('htmlReplacement' in options) ? options.htmlReplacement : '<mark>replaced HTML</mark>';
        }
        Options.update = update;
        /**
         * Filter HTML based on current [[safeMode]].
         */
        function safeModeFilter(html) {
            switch (Options.safeMode) {
                case 0:
                    return html;
                case 1:
                    return '';
                case 2:
                    return Options.htmlReplacement;
                case 3:
                    return Rimu.replaceSpecialChars(html);
                default:
                    throw 'illegal safeMode value';
            }
        }
        Options.safeModeFilter = safeModeFilter;
        update({}); // Initialize options to default values.
    })(Options = Rimu.Options || (Rimu.Options = {}));
})(Rimu || (Rimu = {}));
/// <reference path="references.ts" />
var Rimu;
(function (Rimu) {
    var Reader = (function () {
        function Reader(text) {
            // Split lines on newline boundaries.
            // http://stackoverflow.com/questions/1155678/javascript-string-newline-character
            // TODO split is broken on IE8 e.g. 'X\n\nX'.split(/\n/g).length) returns 2 but should return 3.
            this.lines = text.split(/\r\n|\r|\n/g);
            this.pos = 0;
        }
        // Getter/setter for current line, return null if EOF.
        Reader.prototype.cursor = function (value) {
            if (value === void 0) { value = null; }
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
            return this.lines[this.pos];
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
                        result.push(match[1]); // $1
                    }
                    this.next();
                    break;
                }
                result.push(this.cursor());
                this.next();
            }
            // Blank line matches EOF.
            if (match || find.toString() === '/^$/' && this.eof()) {
                return result;
            }
            else {
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
})(Rimu || (Rimu = {}));
/// <reference path="references.ts" />
var Rimu;
(function (Rimu) {
    var Macros;
    (function (Macros) {
        // Matches macro invocation. $1 = name, $2 = params.
        var MATCH_MACRO = /\{([\w\-]+)([!=|?](?:|[\s\S]*?[^\\]))?\}/;
        // Matches all macro invocations. $1 = name, $2 = params.
        var MATCH_MACROS = RegExp('\\\\?' + MATCH_MACRO.source, 'g');
        // Matches a line starting with a macro invocation.
        Macros.MACRO_LINE = RegExp('^' + MATCH_MACRO.source + '.*$');
        // Match multi-line macro definition open delimiter. $1 is first line of macro.
        Macros.MACRO_DEF_OPEN = /^\\?\{[\w\-]+\}\s*=\s*'(.*)$/;
        // Match multi-line macro definition open delimiter. $1 is last line of macro.
        Macros.MACRO_DEF_CLOSE = /^(.*)'$/;
        // Match single-line macro definition. $1 = name, $2 = value.
        Macros.MACRO_DEF = /^\\?\{([\w\-]+)\}\s*=\s*'(.*)'$/;
        Macros.defs = [];
        // Return named macro value or null if it doesn't exist.
        function getValue(name) {
            for (var i in Macros.defs) {
                if (Macros.defs[i].name === name) {
                    return Macros.defs[i].value;
                }
            }
            return null;
        }
        Macros.getValue = getValue;
        // Set named macro value or add it if it doesn't exist.
        function setValue(name, value) {
            for (var i in Macros.defs) {
                if (Macros.defs[i].name === name) {
                    Macros.defs[i].value = value;
                    return;
                }
            }
            Macros.defs.push({ name: name, value: value });
        }
        Macros.setValue = setValue;
        // Render all macro invocations in text string.
        function render(text) {
            text = text.replace(MATCH_MACROS, function (match) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (match[0] === '\\') {
                    return match.slice(1);
                }
                var name = args[0]; /* $1 */
                var params = args[1] || ''; /* $2 */
                var value = getValue(name); // Macro value is null if macro is undefined.
                params = params.replace(/\\\}/g, '}'); // Unescape escaped } characters.
                switch (params[0]) {
                    case '?':
                        return value === null ? params.slice(1) : value;
                    case '|':
                        // Substitute macro parameters.
                        var paramsList = params.slice(1).split('|');
                        value = (value || '').replace(/\\?\$\d+/g, function (match) {
                            if (match[0] === '\\') {
                                return match.slice(1);
                            }
                            var param = paramsList[parseInt(match.slice(1)) - 1];
                            return param === undefined ? '' : param; // Unassigned parameters are replaced with a blank string.
                        });
                        return value;
                    case '!':
                    case '=':
                        var pattern = params.slice(1);
                        var skip = !RegExp('^' + pattern + '$').test(value || '');
                        if (params[0] === '!') {
                            skip = !skip;
                        }
                        return skip ? '\0' : '';
                    default:
                        return value || '';
                }
            });
            // Delete lines marked for deletion by inclusion macros.
            if (text.indexOf('\0') !== -1) {
                var lines = text.split('\n');
                for (var i = lines.length - 1; i >= 0; --i) {
                    if (lines[i].indexOf('\0') !== -1) {
                        lines.splice(i, 1); // Delete line[i].
                    }
                }
                text = lines.join('\n');
            }
            return text;
        }
        Macros.render = render;
    })(Macros = Rimu.Macros || (Rimu.Macros = {}));
})(Rimu || (Rimu = {}));
/// <reference path="references.ts" />
var Rimu;
(function (Rimu) {
    var LineBlocks;
    (function (LineBlocks) {
        var defs = [
            {
                match: /^\\?\|([\w\-]+)\|\s*=\s*'(.*)'$/,
                replacement: '',
                expansionOptions: {},
                filter: function (match) {
                    if (Rimu.Options.safeMode !== 0) {
                        return ''; // Skip if a safe mode is set.
                    }
                    Rimu.DelimitedBlocks.setDefinition(match[1], match[2]);
                    return '';
                }
            },
            {
                match: /^(\S{1,2})\s*=\s*'([^\|]*)(\|{1,2})(.*)'$/,
                replacement: '',
                expansionOptions: {
                    macros: true
                },
                filter: function (match) {
                    if (Rimu.Options.safeMode !== 0) {
                        return ''; // Skip if a safe mode is set.
                    }
                    Rimu.Quotes.setDefinition({ quote: match[1], openTag: Rimu.replaceInline(match[2], this.expansionOptions), closeTag: Rimu.replaceInline(match[4], this.expansionOptions), spans: match[3] === '|' });
                    return '';
                }
            },
            {
                match: /^\\?\/(.+)\/([igm]*)\s*=\s*'(.*)'$/,
                replacement: '',
                expansionOptions: {
                    macros: true
                },
                filter: function (match) {
                    if (Rimu.Options.safeMode !== 0) {
                        return ''; // Skip if a safe mode is set.
                    }
                    var pattern = match[1];
                    var flags = match[2];
                    var replacement = match[3];
                    replacement = Rimu.replaceInline(replacement, this.expansionOptions);
                    Rimu.Replacements.setDefinition(pattern, flags, replacement);
                    return '';
                }
            },
            {
                match: Rimu.Macros.MACRO_DEF,
                replacement: '',
                expansionOptions: {
                    macros: true
                },
                filter: function (match) {
                    if (Rimu.Options.safeMode !== 0) {
                        return ''; // Skip if a safe mode is set.
                    }
                    var name = match[1];
                    var value = match[2];
                    value = Rimu.replaceInline(value, this.expansionOptions);
                    Rimu.Macros.setValue(name, value);
                    return '';
                }
            },
            {
                match: Rimu.Macros.MACRO_LINE,
                replacement: '',
                expansionOptions: {},
                verify: function (match) {
                    return !Rimu.Macros.MACRO_DEF_OPEN.test(match[0]); // Don't match macro definition blocks.
                },
                filter: function (match, reader) {
                    var value = Rimu.Macros.render(match[0]);
                    // Insert the macro value into the reader just ahead of the cursor.
                    var spliceArgs = [reader.pos + 1, 0].concat(value.split('\n'));
                    Array.prototype.splice.apply(reader.lines, spliceArgs);
                    return '';
                }
            },
            {
                match: /^\\?((?:#|=){1,6})\s+(.+?)(?:\s+(?:#|=){1,6})?$/,
                replacement: '<h$1>$2</h$1>',
                expansionOptions: {
                    macros: true,
                    spans: true
                },
                filter: function (match) {
                    match[1] = match[1].length.toString(); // Replace $1 with header number.
                    return Rimu.replaceMatch(match, this.replacement, this.expansionOptions);
                }
            },
            {
                match: /^\\?\/{2}(.*)$/,
                replacement: '',
                expansionOptions: {}
            },
            {
                match: /^\\?<image:([^\s\|]+)\|([\s\S]+?)>$/,
                replacement: '<img src="$1" alt="$2">',
                expansionOptions: {
                    macros: true,
                    specials: true
                }
            },
            {
                match: /^\\?<image:([^\s\|]+?)>$/,
                replacement: '<img src="$1" alt="$1">',
                expansionOptions: {
                    macros: true,
                    specials: true
                }
            },
            {
                match: /^\\?<<#([a-zA-Z][\w\-]*)>>$/,
                replacement: '<div id="$1"></div>',
                expansionOptions: {
                    macros: true,
                    specials: true
                }
            },
            {
                name: 'attributes',
                match: /^\\?\.[a-zA-Z#\[+-].*$/,
                replacement: '',
                expansionOptions: {
                    macros: true
                },
                verify: function (match) {
                    // Parse Block Attributes.
                    // class names = $1, id = $2, html-attributes = $3, block-options = $4
                    var text = match[0];
                    text = Rimu.replaceInline(text, this.expansionOptions); // Expand macro references.
                    match = /^\\?\.([a-zA-Z][\w\ -]*)?(#[a-zA-Z][\w\-]*\s*)?(?:\s*)?(\[.+\])?(?:\s*)?([+-][ \w+-]+)?$/.exec(text);
                    if (!match) {
                        return false;
                    }
                    if (match[1]) {
                        LineBlocks.htmlClasses += ' ' + Rimu.trim(match[1]);
                        LineBlocks.htmlClasses = Rimu.trim(LineBlocks.htmlClasses);
                    }
                    if (match[2]) {
                        LineBlocks.htmlAttributes += ' id="' + Rimu.trim(match[2]).slice(1) + '"';
                    }
                    if (match[3] && Rimu.Options.safeMode === 0) {
                        LineBlocks.htmlAttributes += ' ' + Rimu.trim(match[3].slice(1, match[3].length - 1));
                    }
                    LineBlocks.htmlAttributes = Rimu.trim(LineBlocks.htmlAttributes);
                    Rimu.DelimitedBlocks.setBlockOptions(LineBlocks.blockOptions, match[4]);
                    return true;
                },
                filter: function (match) {
                    return '';
                }
            },
        ];
        // Globals set by Block Attributes filter.
        LineBlocks.htmlClasses = '';
        LineBlocks.htmlAttributes = '';
        LineBlocks.blockOptions = {};
        // If the next element in the reader is a valid line block render it
        // and return true, else return false.
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
                    if (def.verify && !def.verify(match)) {
                        continue;
                    }
                    var text;
                    if (!def.filter) {
                        text = Rimu.replaceMatch(match, def.replacement, def.expansionOptions);
                    }
                    else {
                        text = def.filter(match, reader);
                    }
                    text = Rimu.injectHtmlAttributes(text);
                    writer.write(text);
                    reader.next();
                    if (text && !reader.eof()) {
                        writer.write('\n'); // Add a trailing '\n' if there are more lines.
                    }
                    return true;
                }
            }
            return false;
        }
        LineBlocks.render = render;
        // Return def definition or null if not found.
        function getDefinition(name) {
            for (var i in defs) {
                if (defs[i].name === name) {
                    return defs[i];
                }
            }
            return null;
        }
        LineBlocks.getDefinition = getDefinition;
    })(LineBlocks = Rimu.LineBlocks || (Rimu.LineBlocks = {}));
})(Rimu || (Rimu = {}));
/// <reference path="references.ts" />
var Rimu;
(function (Rimu) {
    var DelimitedBlocks;
    (function (DelimitedBlocks) {
        var defs = [
            {
                openMatch: Rimu.Macros.MACRO_DEF_OPEN,
                closeMatch: Rimu.Macros.MACRO_DEF_CLOSE,
                openTag: '',
                closeTag: '',
                expansionOptions: {
                    macros: true
                },
                filter: function (text, match, expansionOptions) {
                    // Set macro.
                    // Get the macro name from the match in the first line of the block.
                    var name = match[0].match(/^\{([\w\-]+)\}/)[1];
                    text = text.replace(/' *\\\n/g, '\'\n'); // Unescape line-continuations.
                    text = text.replace(/(' *[\\]+)\\\n/g, '$1\n'); // Unescape escaped line-continuations.
                    text = Rimu.replaceInline(text, expansionOptions); // Expand macro invocations.
                    Rimu.Macros.setValue(name, text);
                    return '';
                }
            },
            {
                name: 'comment',
                openMatch: /^\\?\/\*+$/,
                closeMatch: /^\*+\/$/,
                openTag: '',
                closeTag: '',
                expansionOptions: {
                    skip: true,
                    specials: true // Fall-back if skip is disabled.
                }
            },
            {
                name: 'division',
                openMatch: /^\\?\.{2,}$/,
                openTag: '<div>',
                closeTag: '</div>',
                expansionOptions: {
                    container: true,
                    specials: true // Fall-back if container is disabled.
                }
            },
            {
                name: 'quote',
                openMatch: /^\\?"{2,}$/,
                openTag: '<blockquote>',
                closeTag: '</blockquote>',
                expansionOptions: {
                    container: true,
                    specials: true // Fall-back if container is disabled.
                }
            },
            {
                name: 'code',
                openMatch: /^\\?\-{2,}$/,
                openTag: '<pre><code>',
                closeTag: '</code></pre>',
                expansionOptions: {
                    macros: false,
                    specials: true
                }
            },
            {
                name: 'html',
                // Must start with  an <! or a block-level element start or end tag.
                // $1 is first line of block.
                /* tslint:disable:max-line-length */
                openMatch: /^(<!.*|(?:<\/?(?:html|head|body|iframe|script|style|address|article|aside|audio|blockquote|canvas|dd|div|dl|fieldset|figcaption|figure|figcaption|footer|form|h1|h2|h3|h4|h5|h6|header|hgroup|hr|img|math|nav|noscript|ol|output|p|pre|section|table|tfoot|td|th|tr|ul|video)(?:[ >].*)?))$/i,
                /* tslint:enable:max-line-length */
                closeMatch: /^$/,
                openTag: '',
                closeTag: '',
                expansionOptions: {
                    macros: true
                },
                filter: function (text) {
                    return Rimu.Options.safeModeFilter(text);
                }
            },
            {
                name: 'indented',
                openMatch: /^\\?(\s+.*)$/,
                closeMatch: /^$/,
                openTag: '<pre><code>',
                closeTag: '</code></pre>',
                expansionOptions: {
                    macros: false,
                    specials: true
                },
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
            {
                name: 'paragraph',
                openMatch: /^(.*)$/,
                closeMatch: /^$/,
                openTag: '<p>',
                closeTag: '</p>',
                expansionOptions: {
                    macros: true,
                    spans: true,
                    specials: true // Fall-back if spans is disabled.
                }
            },
        ];
        // If the next element in the reader is a valid delimited block render it
        // and return true, else return false.
        function render(reader, writer) {
            if (reader.eof())
                throw 'premature eof';
            for (var i in defs) {
                var def = defs[i];
                var match = reader.cursor().match(def.openMatch);
                if (match) {
                    // Escape non-paragraphs.
                    if (match[0][0] === '\\' && def.name !== 'paragraph') {
                        // Drop backslash escape and continue.
                        reader.cursor(reader.cursor().slice(1));
                        continue;
                    }
                    if (def.verify && !def.verify(match)) {
                        continue;
                    }
                    var lines = [];
                    // Prepend delimiter text.
                    if (match.length > 1) {
                        lines.push(match[1]); // $1
                    }
                    // Read content up to the closing delimiter.
                    reader.next();
                    var closeMatch;
                    if (def.closeMatch === undefined) {
                        // Close delimiter matches opening delimiter.
                        closeMatch = RegExp('^' + Rimu.escapeRegExp(match[0]) + '$');
                    }
                    else {
                        closeMatch = def.closeMatch;
                    }
                    var content = reader.readTo(closeMatch);
                    if (content !== null) {
                        lines = lines.concat(content);
                    }
                    // Set block expansion options.
                    var expansionOptions;
                    expansionOptions = { macros: false, spans: false, specials: false, container: false, skip: false };
                    var k;
                    for (k in expansionOptions)
                        expansionOptions[k] = def.expansionOptions[k];
                    for (k in Rimu.LineBlocks.blockOptions)
                        expansionOptions[k] = Rimu.LineBlocks.blockOptions[k];
                    // Process block.
                    if (!expansionOptions.skip) {
                        var text = lines.join('\n');
                        if (def.filter) {
                            text = def.filter(text, match, expansionOptions);
                        }
                        writer.write(Rimu.injectHtmlAttributes(def.openTag));
                        if (expansionOptions.container) {
                            text = Rimu.renderSource(text);
                        }
                        else {
                            text = Rimu.replaceInline(text, expansionOptions);
                        }
                        writer.write(text);
                        writer.write(def.closeTag);
                        if ((def.openTag || text || def.closeTag) && !reader.eof()) {
                            // Add a trailing '\n' if we've written a non-blank line and there are more source lines left.
                            writer.write('\n');
                        }
                    }
                    // Reset consumed Block Attributes expansion options.
                    Rimu.LineBlocks.blockOptions = {};
                    return true;
                }
            }
            return false; // No matching delimited block found.
        }
        DelimitedBlocks.render = render;
        // Return block definition or null if not found.
        function getDefinition(name) {
            for (var i in defs) {
                if (defs[i].name === name) {
                    return defs[i];
                }
            }
            return null;
        }
        DelimitedBlocks.getDefinition = getDefinition;
        // Parse delimited block expansion options string into blockOptions.
        function setBlockOptions(blockOptions, options) {
            if (options) {
                var opts = options.trim().split(/\s+/);
                for (var i in opts) {
                    var opt = opts[i];
                    if (Rimu.Options.safeMode !== 0 && opt === '-specials') {
                        return;
                    }
                    if (/^[+-](macros|spans|specials|container|skip)$/.test(opt)) {
                        blockOptions[opt.slice(1)] = opt[0] === '+';
                    }
                }
            }
        }
        DelimitedBlocks.setBlockOptions = setBlockOptions;
        // Update existing named definition.
        // Value syntax: <open-tag>|<close-tag> block-options
        function setDefinition(name, value) {
            var def = DelimitedBlocks.getDefinition(name);
            var match = Rimu.trim(value).match(/^(?:(<[a-zA-Z].*>)\|(<[a-zA-Z/].*>))?(?:\s*)?([+-][ \w+-]+)?$/);
            if (match) {
                if (match[1]) {
                    def.openTag = match[1];
                    def.closeTag = match[2];
                }
                setBlockOptions(def.expansionOptions, match[3]);
            }
        }
        DelimitedBlocks.setDefinition = setDefinition;
    })(DelimitedBlocks = Rimu.DelimitedBlocks || (Rimu.DelimitedBlocks = {}));
})(Rimu || (Rimu = {}));
/// <reference path="references.ts" />
var Rimu;
(function (Rimu) {
    var Lists;
    (function (Lists) {
        var defs = [
            {
                match: /^\\?\s*(-|\*{1,4})\s+(.*)$/,
                listOpenTag: '<ul>',
                listCloseTag: '</ul>',
                itemOpenTag: '<li>',
                itemCloseTag: '</li>'
            },
            {
                match: /^\\?\s*(?:\d*)(\.{1,4})\s+(.*)$/,
                listOpenTag: '<ol>',
                listCloseTag: '</ol>',
                itemOpenTag: '<li>',
                itemCloseTag: '</li>'
            },
            {
                match: /^\\?\s*(.*[^:])(:{2,4})(|\s+.*)$/,
                listOpenTag: '<dl>',
                listCloseTag: '</dl>',
                itemOpenTag: '<dd>',
                itemCloseTag: '</dd>',
                termOpenTag: '<dt>',
                termCloseTag: '</dt>'
            },
        ];
        var ids; // Stack of open list IDs.
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
            writer.write(Rimu.injectHtmlAttributes(startItem.def.listOpenTag));
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
            lines.write(match[match.length - 1]); // Item text from first line.
            lines.write('\n');
            reader.next();
            var nextItem;
            nextItem = readToNext(reader, lines);
            text = lines.toString();
            text = Rimu.replaceInline(text, { macros: true, spans: true });
            writer.write(text);
            while (true) {
                if (!nextItem) {
                    // EOF or non-list related item.
                    writer.write(def.itemCloseTag);
                    return null;
                }
                else if (nextItem.isListItem) {
                    if (ids.indexOf(nextItem.id) !== -1) {
                        // Item belongs to current list or an ancestor list.
                        writer.write(def.itemCloseTag);
                        return nextItem;
                    }
                    else {
                        // Render new child list.
                        nextItem = renderList(nextItem, reader, writer);
                        writer.write(def.itemCloseTag);
                        return nextItem;
                    }
                }
                else if (nextItem.isDelimited || nextItem.isIndented) {
                    // Delimited blocks and Indented blocks attach to list items.
                    var savedIds = ids;
                    ids = [];
                    Rimu.DelimitedBlocks.render(reader, writer);
                    ids = savedIds;
                    reader.skipBlankLines();
                    if (reader.eof()) {
                        writer.write(def.itemCloseTag);
                        return null;
                    }
                    else {
                        nextItem = matchItem(reader);
                    }
                }
            }
            // Should never arrive here.
        }
        // Translate the list item in the reader to the writer until the next element
        // is encountered. Return 'next' containing the next element's match and
        // identity information.
        function readToNext(reader, writer) {
            // The reader should be at the line following the first line of the list
            // item (or EOF).
            var next;
            while (true) {
                if (reader.eof())
                    return null;
                if (reader.cursor() === '') {
                    // Encountered blank line.
                    // Can be followed by new list item or attached indented paragraph.
                    reader.skipBlankLines();
                    if (reader.eof())
                        return null;
                    return matchItem(reader, { indented: true });
                }
                next = matchItem(reader, { delimited: true });
                if (next) {
                    // Encountered new list item or attached quote, code or division
                    // delimited block.
                    return next;
                }
                writer.write(reader.cursor());
                writer.write('\n');
                reader.next();
            }
        }
        // Check if the line at the reader cursor matches a list related element. If
        // does return list item information else return null.  It matches
        // list item elements but 'options' can be included to also match delimited
        // blocks or indented paragraphs.
        function matchItem(reader, options) {
            if (options === void 0) { options = {}; }
            // Check if the line matches a List definition.
            var line = reader.cursor();
            var item = {}; // ItemState factory.
            for (var i in defs) {
                var match = defs[i].match.exec(line);
                if (match) {
                    if (match[0][0] === '\\') {
                        reader.cursor(reader.cursor().slice(1)); // Drop backslash.
                        return null;
                    }
                    item.match = match;
                    item.def = defs[i];
                    item.id = match[match.length - 2];
                    item.isListItem = true;
                    return item;
                }
            }
            // Check if the line matches a Delimited Block definition.
            var def;
            if (options.delimited) {
                for (var name in { quote: 0, code: 0, division: 0 }) {
                    def = Rimu.DelimitedBlocks.getDefinition(name);
                    if (def.openMatch.test(line)) {
                        item.isDelimited = true;
                        return item;
                    }
                }
            }
            // Check if the line matches an Indented Paragraph definition.
            if (options.indented) {
                def = Rimu.DelimitedBlocks.getDefinition('indented');
                if (def.openMatch.test(line)) {
                    item.isIndented = true;
                    return item;
                }
            }
            return null;
        }
    })(Lists = Rimu.Lists || (Rimu.Lists = {}));
})(Rimu || (Rimu = {}));
/*
 This module renders text containing Quote and Replacement elements.

 Quote and replacement processing involves splitting the source text into
 fragments where a quote or a replacement occurs then splicing the fragments
 containing HTML markup into the breaks.  A fragment is flagged as 'done' to
 exclude it from further substitutions.

 Once all quotes and replacements are processed fragments not yet flagged as
 'done' have special characters (&, <, >) replaced with corresponding special
 character entities. The fragments are then reassembled (defraged) into a
 resultant HTML string.
 */
/// <reference path="references.ts" />
var Rimu;
(function (Rimu) {
    var Spans;
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
                }
                else {
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
                var def = Rimu.Quotes.getDefinition(match[1]);
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
                }
                else {
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
                }
                else {
                    if (!def.filter) {
                        fragment.text = Rimu.replaceMatch(match, def.replacement, { specials: true });
                    }
                    else {
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
    })(Spans = Rimu.Spans || (Rimu.Spans = {}));
})(Rimu || (Rimu = {}));
/// <reference path="references.ts" />
var Rimu;
(function (Rimu) {
    var Quotes;
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
            },
        ];
        Quotes.findRe; // Searches for quoted text.
        var unescapeRe; // Searches for escaped quotes.
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
        // Return the quote definition corresponding to 'quote' character, return null if not found.
        function getDefinition(quote) {
            for (var i in Quotes.defs) {
                if (Quotes.defs[i].quote === quote)
                    return Quotes.defs[i];
            }
            return null;
        }
        Quotes.getDefinition = getDefinition;
        // Strip backslashes from quote characters.
        function unescape(s) {
            return s.replace(unescapeRe, '$1');
        }
        Quotes.unescape = unescape;
        // Update existing or add new quote definition.
        function setDefinition(def) {
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
        Quotes.setDefinition = setDefinition;
    })(Quotes = Rimu.Quotes || (Rimu.Quotes = {}));
})(Rimu || (Rimu = {}));
/// <reference path="references.ts" />
var Rimu;
(function (Rimu) {
    var Replacements;
    (function (Replacements) {
        Replacements.defs = [
            {
                match: /\\?(&[\w#][\w]+;)/g,
                replacement: '',
                filter: function (match) {
                    return match[1]; // Pass the entity through verbatim.
                }
            },
            {
                match: /[\\ ]\\(\n|$)/g,
                replacement: '<br>$1'
            },
            {
                match: /\\?<<#([a-zA-Z][\w\-]*)>>/g,
                replacement: '<span id="$1"></span>'
            },
            {
                match: /\\?<image:([^\s\|]+)\|([\s\S]+?)>/g,
                replacement: '<img src="$1" alt="$2">'
            },
            {
                match: /\\?<image:([^\s\|]+?)>/g,
                replacement: '<img src="$1" alt="$1">'
            },
            {
                match: /\\?<(\S+@[\w\.\-]+)\|([\s\S]+?)>/g,
                replacement: '<a href="mailto:$1">$2</a>'
            },
            {
                match: /\\?<(\S+@[\w\.\-]+)>/g,
                replacement: '<a href="mailto:$1">$1</a>'
            },
            {
                match: /\\?(<[!\/]?[a-zA-Z\-]+(:?\s+[^<>&]+)?>)/g,
                replacement: '',
                filter: function (match) {
                    return Rimu.Options.safeModeFilter(match[1]);
                }
            },
            {
                match: /\\?<(\S+?)\|([\s\S]+?)>/g,
                replacement: '<a href="$1">$2</a>'
            },
            {
                match: /\\?<(\S+?)>/g,
                replacement: '<a href="$1">$1</a>'
            },
        ];
        // Update existing or add new replacement definition.
        function setDefinition(regexp, flags, replacement) {
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
        Replacements.setDefinition = setDefinition;
    })(Replacements = Rimu.Replacements || (Rimu.Replacements = {}));
})(Rimu || (Rimu = {}));
/*
  Dependent source file references.
  The order is important as it defines the order in which the files are compiled to the output file.
 */
/// <reference path="references.ts" />
/**
 * ### Rimu Modularization
 *
 * - This application uses Internal TypeScript modules and is compiled to a single rimu.js
 *   JavaScript file.
 * - `rimu.js` can be used in the browser using a script tag or can be used in Nodejs using require().
 * - Rimu API functions are explicitly exported to Nodejs with the exportCommonjs() helper.
 * - Other internal objects are exported to Nodejs for use by nodeunit unit tests.
 * - To minimize browser global namespace pollution and to disallow run-time access to internal
 *   objects all source is enveloped in a single open module named [[Rimu]].
 *
 * See [Building heterogeneous TypeScript libraries](http://srackham.wordpress.com/2012/11/20/building-heterogeneous-typescript-libraries/)
 *
 */
var Rimu;
(function (Rimu) {
    /**
     *
     * This is the single public API which translates Rimu Markup to HTML.
     *
     * @param source
     * Input text containing Rimu Markup.
     *
     * @param options
     * Markup translation options.
     *
     * @returns Returns HTML output text.
     *
     * Example:
     *
     *     Rimu.render('Hello *Rimu*!', {safeMode: 1});
     *
     * See `rimuc.js` and `rimuplayground.html` for examples of [[render]]  in action.
     *
     */
    function render(source, options) {
        if (options === void 0) { options = {}; }
        Rimu.Options.update(options);
        return renderSource(source);
    }
    Rimu.render = render;
    // Same as render() but does not update options.
    function renderSource(source) {
        var reader = new Rimu.Reader(source);
        var writer = new Rimu.Writer();
        while (!reader.eof()) {
            reader.skipBlankLines();
            if (reader.eof())
                break;
            if (Rimu.LineBlocks.render(reader, writer))
                continue;
            if (Rimu.Lists.render(reader, writer))
                continue;
            if (Rimu.DelimitedBlocks.render(reader, writer))
                continue;
            throw 'no matching delimited block found';
        }
        return writer.toString();
    }
    Rimu.renderSource = renderSource;
})(Rimu || (Rimu = {}));
// Export Rimu API.
Rimu.exportCommonjs({ render: Rimu.render });
