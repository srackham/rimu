var Rimu;
(function (Rimu) {
    function render(source, options) {
        if (typeof options === "undefined") { options = {
        }; }
        Rimu.Variables.reset();
        Rimu.Options.update(options);
        return renderSource(source);
    }
    Rimu.render = render;
    function renderSource(source) {
        var reader = new Rimu.Reader(source);
        var writer = new Rimu.Writer();
        while(!reader.eof()) {
            reader.skipBlankLines();
            if(reader.eof()) {
                break;
            }
            if(Rimu.LineBlocks.render(reader, writer)) {
                continue;
            }
            if(Rimu.Lists.render(reader, writer)) {
                continue;
            }
            if(Rimu.DelimitedBlocks.render(reader, writer)) {
                continue;
            }
        }
        return writer.toString();
    }
    Rimu.renderSource = renderSource;
})(Rimu || (Rimu = {}));
if(typeof exports !== 'undefined') {
    exports.render = Rimu.render;
}
var Rimu;
(function (Rimu) {
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
    function escapeRegExp(s) {
        return s.replace(/[\-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');
    }
    Rimu.escapeRegExp = escapeRegExp;
    ; ;
    function replaceSpecialChars(s) {
        return s.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;");
    }
    Rimu.replaceSpecialChars = replaceSpecialChars;
    function replaceMatch(match, replacement, options) {
        if (typeof options === "undefined") { options = {
        }; }
        return replacement.replace(/\$\d/g, function () {
            var i = parseInt(arguments[0][1]);
            var text = match[i];
            return replaceOptions(text, options);
        });
    }
    Rimu.replaceMatch = replaceMatch;
    function replaceOptions(text, options) {
        if(options.variables) {
            text = Rimu.Variables.render(text);
        }
        if(options.spans) {
            return Rimu.Spans.render(text);
        } else {
            if(options.specials) {
                return replaceSpecialChars(text);
            } else {
                return text;
            }
        }
    }
    Rimu.replaceOptions = replaceOptions;
    function injectAttributes(tag) {
        if(!tag || !Rimu.LineBlocks.htmlAttributes) {
            return tag;
        }
        var match = tag.match(/^<[a-zA-Z]+(?=[ >])/);
        if(!match) {
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
        Options.safeMode;
        Options.htmlReplacement;
        function update(options) {
            Options.safeMode = ('safeMode' in options) ? options.safeMode : 0;
            Options.htmlReplacement = ('htmlReplacement' in options) ? options.htmlReplacement : '<mark>replaced HTML<mark>';
        }
        Options.update = update;
        function safeModeFilter(text) {
            switch(Options.safeMode) {
                case 0: {
                    return text;

                }
                case 1: {
                    return '';

                }
                case 2: {
                    return Options.htmlReplacement;

                }
                case 3: {
                    return Rimu.replaceSpecialChars(text);

                }
                default:
            }
        }
        Options.safeModeFilter = safeModeFilter;
        update({
        });
    })(Rimu.Options || (Rimu.Options = {}));
    var Options = Rimu.Options;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    var Reader = (function () {
        function Reader(text) {
            var lines = text.split(/\r\n|\r|\n/g);
            for(var i in lines) {
                lines[i] = lines[i].replace(/\s+$/, '');
            }
            this.lines = lines;
            this.pos = 0;
        }
        Reader.prototype.cursor = function (value) {
            if (typeof value === "undefined") { value = null; }
            if(this.eof()) {
                return null;
            }
            if(value !== null) {
                this.lines[this.pos] = value;
            }
            return this.lines[this.pos];
        };
        Reader.prototype.eof = function () {
            return this.pos >= this.lines.length;
        };
        Reader.prototype.next = function () {
            if(this.eof()) {
                return null;
            }
            this.pos++;
            if(this.eof()) {
                return null;
            }
            return this.cursor();
        };
        Reader.prototype.readTo = function (find) {
            var result = [];
            var match;
            while(!this.eof()) {
                match = this.cursor().match(find);
                if(match) {
                    if(match.length > 1) {
                        result.push(match[1]);
                    }
                    this.next();
                    break;
                }
                result.push(this.cursor());
                this.next();
            }
            if(match || find.toString() === '/^$/' && this.eof()) {
                return result;
            } else {
                return null;
            }
        };
        Reader.prototype.skipBlankLines = function () {
            while(this.cursor() === '') {
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
            var text = this.buffer.join('');
            return text;
        };
        return Writer;
    })();
    Rimu.Writer = Writer;    
})(Rimu || (Rimu = {}));
if(typeof exports !== 'undefined') {
    exports.Reader = Rimu.Reader;
    exports.Writer = Rimu.Writer;
}
var Rimu;
(function (Rimu) {
    (function (Variables) {
        Variables.list = [];
        function reset() {
            Variables.list = [];
        }
        Variables.reset = reset;
        function get(name) {
            for(var i in Variables.list) {
                if(Variables.list[i].name === name) {
                    return Variables.list[i].value;
                }
            }
            return null;
        }
        Variables.get = get;
        function set(name, value) {
            for(var i in Variables.list) {
                if(Variables.list[i].name === name) {
                    Variables.list[i].value = value;
                    return;
                }
            }
            Variables.list.push({
                name: name,
                value: value
            });
        }
        Variables.set = set;
        function render(text) {
            for(var i in Variables.list) {
                var variable = Variables.list[i];
                var re = RegExp('\\\\?\\{' + Rimu.escapeRegExp(variable.name) + '(\\|[\\s\\S]*?)?\\}', 'g');
                text = text.replace(re, function (match, params) {
                    if(match[0] === '\\') {
                        return match.slice(1);
                    }
                    if(!params) {
                        return variable.value.replace(/\$\d+/g, '');
                    }
                    var result = variable.value;
                    var paramsList = params.slice(1).split('|');
                    for(var i in paramsList) {
                        result = result.replace('$' + (parseInt(i) + 1), paramsList[i]);
                    }
                    result = result.replace(/\$\d+/g, '');
                    return result;
                });
            }
            return text;
        }
        Variables.render = render;
        if(typeof exports !== 'undefined') {
            exports.Variables = Rimu.Variables;
        }
    })(Rimu.Variables || (Rimu.Variables = {}));
    var Variables = Rimu.Variables;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    (function (LineBlocks) {
        var defs = [
            {
                match: /^\\?\{([\w\-]+)\}\s*=\s*'(.*)'$/,
                replacement: '',
                variables: true,
                filter: function (match, block) {
                    var name = match[1];
                    var value = match[2];
                    value = Rimu.replaceOptions(value, block);
                    Rimu.Variables.set(name, value);
                    return '';
                }
            }, 
            {
                match: /^\\?(\{[\w\-]+(?:\|.*)?\})$/,
                replacement: '',
                filter: function (match, block, reader) {
                    var value = Rimu.Variables.render(match[1]);
                    if(value === match[1]) {
                        value = '\\' + value;
                    }
                    reader.lines = [].concat(reader.lines.slice(0, reader.pos + 1), value.split('\n'), reader.lines.slice(reader.pos + 1));
                    return '';
                }
            }, 
            {
                match: /^\\?((?:#|=){1,6})\s+(.+?)(?:\s+(?:#|=){1,6})?$/,
                replacement: '<h$1>$2</h$1>',
                variables: true,
                spans: true,
                filter: function (match, block) {
                    match[1] = match[1].length.toString();
                    return Rimu.replaceMatch(match, block.replacement, block);
                }
            }, 
            {
                match: /^\/{2}(.*)$/,
                replacement: ''
            }, 
            {
                match: /^\\?<image:([^\s\|]+)\|([\s\S]+?)>$/,
                replacement: '<img src="$1" alt="$2">',
                variables: true,
                specials: true
            }, 
            {
                match: /^\\?<image:([^\s\|]+?)>$/,
                replacement: '<img src="$1" alt="$1">',
                variables: true,
                specials: true
            }, 
            {
                match: /^\\?<<#([a-zA-Z][\w\-]*)>>$/,
                replacement: '<div id="$1"></div>',
                variables: true,
                specials: true
            }, 
            {
                id: 'attributes',
                match: /^\\?\.([a-zA-Z][\w\- ]*)?(#[a-zA-Z][\w\-]*)?(?:\s*)?(\[.+\])?$/,
                replacement: '',
                filter: function (match, block) {
                    LineBlocks.htmlAttributes = '';
                    if(match[1]) {
                        LineBlocks.htmlAttributes += 'class="' + Rimu.trim(match[1]) + '"';
                    }
                    if(match[2]) {
                        LineBlocks.htmlAttributes += ' id="' + Rimu.trim(match[2]).slice(1) + '"';
                    }
                    if(match[3] && Rimu.Options.safeMode === 0) {
                        LineBlocks.htmlAttributes += ' ' + Rimu.trim(match[3].slice(1, match[3].length - 1));
                    }
                    LineBlocks.htmlAttributes = Rimu.trim(LineBlocks.htmlAttributes);
                    return '';
                }
            }, 
            
        ];
        LineBlocks.htmlAttributes = '';
        function render(reader, writer) {
            if(reader.eof()) {
                throw 'premature eof';
            }
            for(var i in defs) {
                var def = defs[i];
                var match = def.match.exec(reader.cursor());
                if(match) {
                    if(match[0][0] === '\\') {
                        reader.cursor(reader.cursor().slice(1));
                        continue;
                    }
                    var text;
                    if(!def.filter) {
                        text = Rimu.replaceMatch(match, def.replacement, def);
                    } else {
                        text = def.filter(match, def, reader);
                    }
                    text = Rimu.injectAttributes(text);
                    writer.write(text);
                    reader.next();
                    if(text && !reader.eof()) {
                        writer.write('\n');
                    }
                    return true;
                }
            }
            return false;
        }
        LineBlocks.render = render;
        function getDefinition(id) {
            for(var i in defs) {
                if(defs[i].id === id) {
                    return defs[i];
                }
            }
            return null;
        }
        LineBlocks.getDefinition = getDefinition;
        if(typeof exports !== 'undefined') {
            exports.LineBlocks = Rimu.LineBlocks;
        }
    })(Rimu.LineBlocks || (Rimu.LineBlocks = {}));
    var LineBlocks = Rimu.LineBlocks;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    (function (DelimitedBlocks) {
        var defs = [
            {
                openMatch: /^\{[\w\-]+\}\s*=\s*'(.*)$/,
                closeMatch: /^(.*)'$/,
                openTag: '',
                closeTag: '',
                variables: true,
                filter: function (text, match) {
                    var name = match[0].match(/^\{([\w\-]+)\}/)[1];
                    Rimu.Variables.set(name, text);
                    return '';
                }
            }, 
            {
                openMatch: /^\/\*+$/,
                closeMatch: /^\*+\/$/,
                openTag: '',
                closeTag: '',
                skip: true
            }, 
            {
                id: 'division',
                openMatch: /^\.{2,}$/,
                closeMatch: /^\.{2,}$/,
                openTag: '<div>',
                closeTag: '</div>',
                container: true
            }, 
            {
                openMatch: /^"{2,}$/,
                closeMatch: /^"{2,}$/,
                openTag: '<blockquote>',
                closeTag: '</blockquote>',
                container: true
            }, 
            {
                openMatch: /^\-{2,}$/,
                closeMatch: /^\-{2,}$/,
                openTag: '<pre><code>',
                closeTag: '</code></pre>',
                variables: true,
                specials: true
            }, 
            {
                openMatch: /^(<!.*|(?:<\/?(?:html|head|body|script|style|address|article|aside|audio|blockquote|canvas|dd|div|dl|fieldset|figcaption|figure|figcaption|footer|form|h1|h2|h3|h4|h5|h6|header|hgroup|hr|noscript|ol|output|p|pre|section|table|tfoot|ul|video)(?:[ >].*)?))$/i,
                closeMatch: /^$/,
                openTag: '',
                closeTag: '',
                variables: true,
                filter: function (text) {
                    return Rimu.Options.safeModeFilter(text);
                }
            }, 
            {
                id: 'indented',
                openMatch: /^(\s+.*)$/,
                closeMatch: /^$/,
                openTag: '<pre>',
                closeTag: '</pre>',
                variables: true,
                specials: true,
                filter: function (text) {
                    var first_indent = text.search(/\S/);
                    var buffer = text.split('\n');
                    for(var i in buffer) {
                        var indent = buffer[i].search(/\S/);
                        if(indent > first_indent) {
                            indent = first_indent;
                        }
                        buffer[i] = buffer[i].slice(indent);
                    }
                    return buffer.join('\n');
                }
            }, 
            {
                openMatch: /^(.*)$/,
                closeMatch: /^$/,
                openTag: '<p>',
                closeTag: '</p>',
                variables: true,
                spans: true
            }, 
            
        ];
        function render(reader, writer) {
            if(reader.eof()) {
                throw 'premature eof';
            }
            for(var i in defs) {
                var def = defs[i];
                var match = reader.cursor().match(def.openMatch);
                if(match) {
                    if(def.verify && !def.verify(match)) {
                        continue;
                    }
                    var lines = [];
                    if(match.length > 1) {
                        lines.push(match[1]);
                    }
                    reader.next();
                    var content = reader.readTo(def.closeMatch);
                    if(content !== null) {
                        lines = lines.concat(content);
                    }
                    if(def.skip) {
                        return true;
                    }
                    writer.write(Rimu.injectAttributes(def.openTag));
                    var text = lines.join('\n');
                    if(def.filter) {
                        text = def.filter(text, match);
                    }
                    if(def.container) {
                        text = Rimu.renderSource(text);
                    } else {
                        text = Rimu.replaceOptions(text, def);
                    }
                    writer.write(text);
                    writer.write(def.closeTag);
                    if(text && !reader.eof()) {
                        writer.write('\n');
                    }
                    return true;
                }
            }
            return false;
        }
        DelimitedBlocks.render = render;
        function getDefinition(id) {
            for(var i in defs) {
                if(defs[i].id === id) {
                    return defs[i];
                }
            }
            return null;
        }
        DelimitedBlocks.getDefinition = getDefinition;
        if(typeof exports !== 'undefined') {
            exports.DelimitedBlocks = Rimu.DelimitedBlocks;
        }
    })(Rimu.DelimitedBlocks || (Rimu.DelimitedBlocks = {}));
    var DelimitedBlocks = Rimu.DelimitedBlocks;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
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
                match: /^\\?\s*(.*[^:])(\:{2,4})(|\s+.*)$/,
                listOpenTag: '<dl>',
                listCloseTag: '</dl>',
                itemOpenTag: '<dd>',
                itemCloseTag: '</dd>',
                termOpenTag: '<dt>',
                termCloseTag: '</dt>'
            }, 
            
        ];
        var ids;
        function render(reader, writer) {
            if(reader.eof()) {
                throw 'premature eof';
            }
            var startItem;
            if(!(startItem = matchItem(reader))) {
                return false;
            }
            ids = [];
            renderList(startItem, reader, writer);
            return true;
        }
        Lists.render = render;
        function renderList(startItem, reader, writer) {
            ids.push(startItem.id);
            writer.write(Rimu.injectAttributes(startItem.def.listOpenTag));
            var nextItem;
            while(true) {
                nextItem = renderListItem(startItem, reader, writer);
                if(!nextItem || nextItem.id !== startItem.id) {
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
            if(match.length === 4) {
                writer.write(def.termOpenTag);
                text = Rimu.replaceOptions(match[1], {
                    variables: true,
                    spans: true
                });
                writer.write(text);
                writer.write(def.termCloseTag);
            }
            writer.write(def.itemOpenTag);
            var lines = new Rimu.Writer();
            lines.write(match[match.length - 1]);
            lines.write('\n');
            reader.next();
            var nextItem;
            nextItem = readToNext(startItem, reader, lines);
            text = lines.toString();
            text = Rimu.replaceOptions(text, {
                variables: true,
                spans: true
            });
            writer.write(text);
            while(true) {
                if(!nextItem) {
                    writer.write(def.itemCloseTag);
                    return null;
                } else {
                    if(nextItem.isListItem) {
                        if(ids.indexOf(nextItem.id) !== -1) {
                            writer.write(def.itemCloseTag);
                            return nextItem;
                        } else {
                            nextItem = renderList(nextItem, reader, writer);
                            writer.write(def.itemCloseTag);
                            return nextItem;
                        }
                    } else {
                        if(nextItem.isDivision || nextItem.isIndented) {
                            Rimu.DelimitedBlocks.render(reader, writer);
                            reader.skipBlankLines();
                            if(reader.eof()) {
                                writer.write(def.itemCloseTag);
                                return null;
                            } else {
                                nextItem = matchItem(reader);
                            }
                        }
                    }
                }
            }
        }
        function readToNext(item, reader, writer) {
            var next;
            while(true) {
                if(reader.eof()) {
                    return null;
                }
                if(reader.cursor() === '') {
                    reader.skipBlankLines();
                    if(reader.eof()) {
                        return null;
                    }
                    return matchItem(reader, {
                        division: true,
                        indented: true
                    });
                }
                next = matchItem(reader, {
                    division: true
                });
                if(next) {
                    return next;
                }
                writer.write(reader.cursor());
                writer.write('\n');
                reader.next();
            }
        }
        function matchItem(reader, options) {
            if (typeof options === "undefined") { options = {
            }; }
            var attrRe = Rimu.LineBlocks.getDefinition('attributes').match;
            if(attrRe.test(reader.cursor())) {
                Rimu.LineBlocks.render(reader, new Rimu.Writer());
            }
            var line = reader.cursor();
            var item = {
            };
            var def;
            for(var i in defs) {
                var match = defs[i].match.exec(line);
                if(match) {
                    if(match[0][0] === '\\') {
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
            if(options.division) {
                def = Rimu.DelimitedBlocks.getDefinition('division');
                if(def.openMatch.test(line)) {
                    item.isDivision = true;
                    return item;
                }
            }
            if(options.indented) {
                def = Rimu.DelimitedBlocks.getDefinition('indented');
                if(def.openMatch.test(line)) {
                    item.isIndented = true;
                    return item;
                }
            }
            return null;
        }
        if(typeof exports !== 'undefined') {
            exports.Lists = Lists;
        }
    })(Rimu.Lists || (Rimu.Lists = {}));
    var Lists = Rimu.Lists;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    (function (Spans) {
        function render(source) {
            var fragments = [
                {
                    text: source,
                    done: false
                }
            ];
            fragQuotes(fragments);
            fragReplacements(fragments);
            fragSpecials(fragments);
            return defrag(fragments);
        }
        Spans.render = render;
        function defrag(fragments) {
            var result = [];
            for(var i in fragments) {
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
            while(true) {
                if(fragment.done) {
                    nextFragment = true;
                } else {
                    match = findRe.exec(fragment.text);
                    nextFragment = !match;
                }
                if(nextFragment) {
                    fragmentIndex++;
                    if(fragmentIndex >= fragments.length) {
                        break;
                    }
                    fragment = fragments[fragmentIndex];
                    if(match) {
                        findRe.lastIndex = 0;
                    }
                    continue;
                }
                if(match[0][0] === '\\') {
                    continue;
                }
                var def = Rimu.Quotes.find(match[1]);
                if(def.verify && !def.verify(match, findRe)) {
                    continue;
                }
                var before = match.input.slice(0, match.index);
                var quoted = match[2];
                var after = match.input.slice(findRe.lastIndex);
                fragments.splice(fragmentIndex, 1, {
                    text: before,
                    done: false
                }, {
                    text: def.openTag,
                    done: true
                }, {
                    text: quoted,
                    done: false
                }, {
                    text: def.closeTag,
                    done: true
                }, {
                    text: after,
                    done: false
                });
                fragmentIndex += 2;
                fragment = fragments[fragmentIndex];
                if(!def.spans) {
                    fragment.text = Rimu.Quotes.unescape(fragment.text);
                    fragment.text = Rimu.replaceSpecialChars(fragment.text);
                    fragment.done = true;
                    fragmentIndex += 2;
                    fragment = fragments[fragmentIndex];
                }
                findRe.lastIndex = 0;
            }
            for(var i in fragments) {
                fragment = fragments[i];
                if(!fragment.done) {
                    fragment.text = Rimu.Quotes.unescape(fragment.text);
                }
            }
        }
        function fragReplacements(fragments) {
            for(var i in Rimu.Replacements.defs) {
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
            while(true) {
                if(fragment.done) {
                    nextFragment = true;
                } else {
                    match = findRe.exec(fragment.text);
                    nextFragment = !match;
                }
                if(nextFragment) {
                    fragmentIndex++;
                    if(fragmentIndex >= fragments.length) {
                        break;
                    }
                    fragment = fragments[fragmentIndex];
                    if(match) {
                        findRe.lastIndex = 0;
                    }
                    continue;
                }
                var before = match.input.slice(0, match.index);
                var after = match.input.slice(findRe.lastIndex);
                fragments.splice(fragmentIndex, 1, {
                    text: before,
                    done: false
                }, {
                    text: '',
                    done: true
                }, {
                    text: after,
                    done: false
                });
                fragmentIndex++;
                fragment = fragments[fragmentIndex];
                if(match[0][0] === '\\') {
                    fragment.text = match.input.slice(match.index + 1, findRe.lastIndex);
                    fragment.text = Rimu.replaceSpecialChars(fragment.text);
                } else {
                    if(!def.filter) {
                        fragment.text = Rimu.replaceMatch(match, def.replacement, def);
                    } else {
                        fragment.text = def.filter(match, def);
                    }
                }
                fragmentIndex++;
                fragment = fragments[fragmentIndex];
                findRe.lastIndex = 0;
            }
        }
        function fragSpecials(fragments) {
            var fragment;
            for(var i in fragments) {
                fragment = fragments[i];
                if(!fragment.done) {
                    fragment.text = Rimu.replaceSpecialChars(fragment.text);
                }
            }
        }
        if(typeof exports !== 'undefined') {
            exports.Spans = Rimu.Spans;
        }
    })(Rimu.Spans || (Rimu.Spans = {}));
    var Spans = Rimu.Spans;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    (function (Quotes) {
        var defs = [
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
            {
                quote: '=',
                openTag: '<del>',
                closeTag: '</del>',
                spans: true,
                verify: function (match, re) {
                    var precedingChar = match.input[match.index - 1] || '';
                    var followingChar = match.input[re.lastIndex] || '';
                    return !(/[a-zA-Z]/.test(precedingChar) && /["']/.test(followingChar));
                }
            }, 
            {
                quote: '+',
                openTag: '<ins>',
                closeTag: '</ins>',
                spans: true
            }, 
            {
                quote: '#',
                openTag: '<mark>',
                closeTag: '</mark>',
                spans: true,
                verify: function (match, re) {
                    var precedingChar = match.input[match.index - 1] || '';
                    var followingChar = match.input[re.lastIndex] || '';
                    return !(/</.test(precedingChar) && /[a-zA-Z]/.test(followingChar));
                }
            }, 
            {
                quote: '~',
                openTag: '<sub>',
                closeTag: '</sub>',
                spans: true
            }, 
            {
                quote: '^',
                openTag: '<sup>',
                closeTag: '</sup>',
                spans: true
            }, 
            
        ];
        Quotes.findRe;
        var unescapeRe;
        var s = [];
        for(var i in defs) {
            s.push(Rimu.escapeRegExp(defs[i].quote));
        }
        Quotes.findRe = RegExp('\\\\?(' + s.join('|') + ')([^\\s\\\\]|\\S[\\s\\S]*?[^\\s\\\\])\\1', 'g');
        unescapeRe = RegExp('\\\\(' + s.join('|') + ')', 'g');
        function find(quote) {
            for(var i in defs) {
                if(defs[i].quote === quote) {
                    return defs[i];
                }
            }
        }
        Quotes.find = find;
        function unescape(s) {
            return s.replace(unescapeRe, '$1');
        }
        Quotes.unescape = unescape;
    })(Rimu.Quotes || (Rimu.Quotes = {}));
    var Quotes = Rimu.Quotes;
})(Rimu || (Rimu = {}));
var Rimu;
(function (Rimu) {
    (function (Replacements) {
        Replacements.defs = [
            {
                match: /\\?(&[\w#][\w]+;)/g,
                replacement: '$1',
                specials: false
            }, 
            {
                match: /\\? \+(?:\n|$)/g,
                replacement: '<br>\n',
                specials: false
            }, 
            {
                match: /\\?<<#([a-zA-Z][\w\-]*)>>/g,
                replacement: '<span id="$1"></span>',
                specials: true
            }, 
            {
                match: /\\?<image:([^\s\|]+)\|([\s\S]+?)>/g,
                replacement: '<img src="$1" alt="$2">',
                specials: true
            }, 
            {
                match: /\\?<image:([^\s\|]+?)>/g,
                replacement: '<img src="$1" alt="$1">',
                specials: true
            }, 
            {
                match: /\\?<(\S+@[\w\.\-]+)\|([\s\S]+?)>/g,
                replacement: '<a href="mailto:$1">$2</a>',
                specials: true
            }, 
            {
                match: /\\?<(\S+@[\w\.\-]+)>/g,
                replacement: '<a href="mailto:$1">$1</a>',
                specials: true
            }, 
            {
                filter: function (match, replacement) {
                    var text = Rimu.replaceMatch(match, replacement.replacement, replacement);
                    return Rimu.Options.safeModeFilter(text);
                },
                match: /\\?(<[!\/]?[a-zA-Z\-]+(:?\s+[^<>&]+)?>)/g,
                replacement: '$1',
                specials: false
            }, 
            {
                match: /\\?<(\S+?)\|([\s\S]+?)>/g,
                replacement: '<a href="$1">$2</a>',
                specials: true
            }, 
            {
                match: /\\?<(\S+?)>/g,
                replacement: '<a href="$1">$1</a>',
                specials: true
            }, 
            
        ];
    })(Rimu.Replacements || (Rimu.Replacements = {}));
    var Replacements = Rimu.Replacements;
})(Rimu || (Rimu = {}));
