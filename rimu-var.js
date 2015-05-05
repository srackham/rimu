var Rimu =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/*
	  This is the main module, it exports the 'render' API.

	  The compiled modules are bundled by Webpack into 'var' (script tag) and 'commonjs' (npm)
	  formatted libraries.
	 */
	/* tslint:disable */
	var render_1 = __webpack_require__(1);
	var options = __webpack_require__(2);
	var quotes = __webpack_require__(3);
	/* tslint:enable */
	/**
	 *
	 * This is the single public API which translates Rimu Markup to HTML.
	 *
	 * @param source
	 * Input text containing Rimu Markup.
	 *
	 * @param opts
	 * Markup translation options.
	 *
	 * @returns Returns HTML output text.
	 *
	 * Example:
	 *
	 *     Rimu.render('Hello *Rimu*!', {safeMode: 1})
	 *
	 */
	function render(source, opts) {
	    if (opts === void 0) { opts = {}; }
	    options.update(opts);
	    return render_1.renderSource(source);
	}
	exports.render = render;
	// Load-time initializations.
	quotes.initialize();


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/* tslint:disable */
	var io = __webpack_require__(5);
	var lineBlocks = __webpack_require__(4);
	var delimitedBlocks = __webpack_require__(6);
	var lists = __webpack_require__(7);
	/* tslint:enable */
	function renderSource(source) {
	    var reader = new io.Reader(source);
	    var writer = new io.Writer();
	    while (!reader.eof()) {
	        reader.skipBlankLines();
	        if (reader.eof())
	            break;
	        if (lineBlocks.render(reader, writer))
	            continue;
	        if (lists.render(reader, writer))
	            continue;
	        if (delimitedBlocks.render(reader, writer))
	            continue;
	        throw 'no matching delimited block found';
	    }
	    return writer.toString();
	}
	exports.renderSource = renderSource;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* tslint:disable */
	var utils = __webpack_require__(8);
	// Option values.
	exports.safeMode;
	exports.htmlReplacement;
	/**
	 * Set options to values in 'options', those not in 'options' are set to their default value.
	 *
	 * @param options
	 */
	function update(options) {
	    exports.safeMode = ('safeMode' in options) ? options.safeMode : 0;
	    exports.htmlReplacement = ('htmlReplacement' in options) ? options.htmlReplacement : '<mark>replaced HTML</mark>';
	}
	exports.update = update;
	/**
	 * Filter HTML based on current [[safeMode]].
	 */
	function safeModeFilter(html) {
	    switch (exports.safeMode) {
	        case 0:
	            return html;
	        case 1:
	            return '';
	        case 2:
	            return exports.htmlReplacement;
	        case 3:
	            return utils.replaceSpecialChars(html);
	        default:
	            throw 'illegal safeMode value';
	    }
	}
	exports.safeModeFilter = safeModeFilter;
	update({}); // Initialize options to default values.


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/* tslint:disable */
	var utils = __webpack_require__(8);
	exports.defs = [
	    {
	        quote: '_',
	        openTag: '<em>',
	        closeTag: '</em>',
	        spans: true
	    },
	    {
	        quote: '**',
	        openTag: '<strong>',
	        closeTag: '</strong>',
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
	        quote: '~~',
	        openTag: '<del>',
	        closeTag: '</del>',
	        spans: true
	    },
	];
	exports.findRe; // Searches for quoted text.
	var unescapeRe; // Searches for escaped quotes.
	// Synthesise re's to find and unescape quotes.
	function initialize() {
	    var s = [];
	    for (var i in exports.defs) {
	        s.push(utils.escapeRegExp(exports.defs[i].quote));
	    }
	    // $1 is quote character, $2 is quoted text.
	    // Quoted text cannot begin or end with whitespace.
	    // Quoted can span multiple lines.
	    // Quoted text cannot end with a backslash.
	    exports.findRe = RegExp('\\\\?(' + s.join('|') + ')([^\\s\\\\]|\\S[\\s\\S]*?[^\\s\\\\])\\1', 'g');
	    // $1 is quote character(s).
	    unescapeRe = RegExp('\\\\(' + s.join('|') + ')', 'g');
	}
	exports.initialize = initialize;
	// Return the quote definition corresponding to 'quote' character, return null if not found.
	function getDefinition(quote) {
	    for (var i in exports.defs) {
	        if (exports.defs[i].quote === quote)
	            return exports.defs[i];
	    }
	    return null;
	}
	exports.getDefinition = getDefinition;
	// Strip backslashes from quote characters.
	function unescape(s) {
	    return s.replace(unescapeRe, '$1');
	}
	exports.unescape = unescape;
	// Update existing or add new quote definition.
	function setDefinition(def) {
	    for (var i in exports.defs) {
	        if (exports.defs[i].quote === def.quote) {
	            // Update existing definition.
	            exports.defs[i].openTag = def.openTag;
	            exports.defs[i].closeTag = def.closeTag;
	            exports.defs[i].spans = def.spans;
	            return;
	        }
	    }
	    // Double-quote definitions are prepended to the array so they are matched
	    // before single-quote definitions (which are appended to the array).
	    if (def.quote.length === 2) {
	        exports.defs.unshift(def);
	    }
	    else {
	        exports.defs.push(def);
	    }
	    initialize();
	}
	exports.setDefinition = setDefinition;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/* tslint:disable */
	var utils = __webpack_require__(8);
	var options = __webpack_require__(2);
	var delimitedBlocks = __webpack_require__(6);
	var quotes = __webpack_require__(3);
	var replacements = __webpack_require__(9);
	var macros = __webpack_require__(10);
	var defs = [
	    // Prefix match with backslash to allow escaping.
	    // Delimited Block definition.
	    // name = $1, definition = $2
	    {
	        match: /^\\?\|([\w\-]+)\|\s*=\s*'(.*)'$/,
	        replacement: '',
	        expansionOptions: {},
	        filter: function (match) {
	            if (options.safeMode !== 0) {
	                return ''; // Skip if a safe mode is set.
	            }
	            delimitedBlocks.setDefinition(match[1], match[2]);
	            return '';
	        }
	    },
	    // Quote definition.
	    // quote = $1, openTag = $2, separator = $3, closeTag = $4
	    {
	        match: /^(\S{1,2})\s*=\s*'([^\|]*)(\|{1,2})(.*)'$/,
	        replacement: '',
	        expansionOptions: {
	            macros: true
	        },
	        filter: function (match) {
	            if (options.safeMode !== 0) {
	                return ''; // Skip if a safe mode is set.
	            }
	            quotes.setDefinition({
	                quote: match[1],
	                openTag: utils.replaceInline(match[2], this.expansionOptions),
	                closeTag: utils.replaceInline(match[4], this.expansionOptions),
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
	        expansionOptions: {
	            macros: true
	        },
	        filter: function (match) {
	            if (options.safeMode !== 0) {
	                return ''; // Skip if a safe mode is set.
	            }
	            var pattern = match[1];
	            var flags = match[2];
	            var replacement = match[3];
	            replacement = utils.replaceInline(replacement, this.expansionOptions);
	            replacements.setDefinition(pattern, flags, replacement);
	            return '';
	        }
	    },
	    // Macro definition.
	    // name = $1, value = $2
	    {
	        match: macros.MACRO_DEF,
	        replacement: '',
	        expansionOptions: {
	            macros: true
	        },
	        filter: function (match) {
	            if (options.safeMode !== 0) {
	                return ''; // Skip if a safe mode is set.
	            }
	            var name = match[1];
	            var value = match[2];
	            value = utils.replaceInline(value, this.expansionOptions);
	            macros.setValue(name, value);
	            return '';
	        }
	    },
	    // Macro Line block.
	    {
	        match: macros.MACRO_LINE,
	        replacement: '',
	        expansionOptions: {},
	        verify: function (match) {
	            return !macros.MACRO_DEF_OPEN.test(match[0]); // Don't match macro definition blocks.
	        },
	        filter: function (match, reader) {
	            var value = macros.render(match[0]);
	            // Insert the macro value into the reader just ahead of the cursor.
	            var spliceArgs = [reader.pos + 1, 0].concat(value.split('\n'));
	            Array.prototype.splice.apply(reader.lines, spliceArgs);
	            return '';
	        }
	    },
	    // Headers.
	    // $1 is ID, $2 is header text.
	    {
	        match: /^\\?((?:#|=){1,6})\s+(.+?)(?:\s+(?:#|=){1,6})?$/,
	        replacement: '<h$1>$2</h$1>',
	        expansionOptions: {
	            macros: true,
	            spans: true
	        },
	        filter: function (match) {
	            match[1] = match[1].length.toString(); // Replace $1 with header number.
	            return utils.replaceMatch(match, this.replacement, this.expansionOptions);
	        }
	    },
	    // Comment line.
	    {
	        match: /^\\?\/{2}(.*)$/,
	        replacement: '',
	        expansionOptions: {}
	    },
	    // Block image: <image:src|alt>
	    // src = $1, alt = $2
	    {
	        match: /^\\?<image:([^\s\|]+)\|([\s\S]+?)>$/,
	        replacement: '<img src="$1" alt="$2">',
	        expansionOptions: {
	            macros: true,
	            specials: true
	        }
	    },
	    // Block image: <image:src>
	    // src = $1, alt = $1
	    {
	        match: /^\\?<image:([^\s\|]+?)>$/,
	        replacement: '<img src="$1" alt="$1">',
	        expansionOptions: {
	            macros: true,
	            specials: true
	        }
	    },
	    // DEPRECATED as of 3.4.0.
	    // Block anchor: <<#id>>
	    // id = $1
	    {
	        match: /^\\?<<#([a-zA-Z][\w\-]*)>>$/,
	        replacement: '<div id="$1"></div>',
	        expansionOptions: {
	            macros: true,
	            specials: true
	        }
	    },
	    // Block Attributes.
	    // Syntax: .class-names #id [html-attributes] block-options
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
	            text = utils.replaceInline(text, this.expansionOptions); // Expand macro references.
	            match = /^\\?\.([a-zA-Z][\w\ -]*)?(#[a-zA-Z][\w\-]*\s*)?(?:\s*)?(\[.+\])?(?:\s*)?([+-][ \w+-]+)?$/.exec(text);
	            if (!match) {
	                return false;
	            }
	            if (match[1]) {
	                exports.htmlClasses += ' ' + utils.trim(match[1]);
	                exports.htmlClasses = utils.trim(exports.htmlClasses);
	            }
	            if (match[2]) {
	                exports.htmlAttributes += ' id="' + utils.trim(match[2]).slice(1) + '"';
	            }
	            if (match[3] && options.safeMode === 0) {
	                exports.htmlAttributes += ' ' + utils.trim(match[3].slice(1, match[3].length - 1));
	            }
	            exports.htmlAttributes = utils.trim(exports.htmlAttributes);
	            delimitedBlocks.setBlockOptions(exports.blockOptions, match[4]);
	            return true;
	        },
	        filter: function (match) {
	            return '';
	        }
	    },
	];
	// Globals set by Block Attributes filter.
	exports.htmlClasses = '';
	exports.htmlAttributes = '';
	exports.blockOptions = {};
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
	                text = utils.replaceMatch(match, def.replacement, def.expansionOptions);
	            }
	            else {
	                text = def.filter(match, reader);
	            }
	            text = utils.injectHtmlAttributes(text);
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
	exports.render = render;
	// Return def definition or null if not found.
	function getDefinition(name) {
	    for (var i in defs) {
	        if (defs[i].name === name) {
	            return defs[i];
	        }
	    }
	    return null;
	}
	exports.getDefinition = getDefinition;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

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
	exports.Reader = Reader;
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
	exports.Writer = Writer;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/* tslint:disable */
	var render_1 = __webpack_require__(1);
	var utils = __webpack_require__(8);
	var options = __webpack_require__(2);
	var macros = __webpack_require__(10);
	var lineBlocks = __webpack_require__(4);
	var defs = [
	    // Delimited blocks cannot be escaped with a backslash.
	    // Macro definition block.
	    {
	        openMatch: macros.MACRO_DEF_OPEN,
	        closeMatch: macros.MACRO_DEF_CLOSE,
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
	            text = utils.replaceInline(text, expansionOptions); // Expand macro invocations.
	            macros.setValue(name, text);
	            return '';
	        }
	    },
	    // Comment block.
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
	    // Division block.
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
	    // Quote block.
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
	    // Code block.
	    {
	        name: 'code',
	        // Backtick hex literal \x60 to work arount eslint problem.
	        // See https://github.com/palantir/tslint/issues/357.
	        openMatch: /^\\?(?:\-{2,}|\x60{2,})$/,
	        openTag: '<pre><code>',
	        closeTag: '</code></pre>',
	        expansionOptions: {
	            macros: false,
	            specials: true
	        }
	    },
	    // HTML block.
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
	            return options.safeModeFilter(text);
	        }
	    },
	    // Indented paragraph.
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
	    // Quote paragraph.
	    {
	        name: 'quote-paragraph',
	        openMatch: /^\\?(>.*)$/,
	        closeMatch: /^$/,
	        openTag: '<blockquote><p>',
	        closeTag: '</p></blockquote>',
	        expansionOptions: {
	            macros: true,
	            spans: true,
	            specials: true // Fall-back if spans is disabled.
	        },
	        filter: function (text) {
	            // Strip leading > from start of each line and unescape escaped leading >.
	            var buffer = text.split('\n');
	            for (var i in buffer) {
	                buffer[i] = buffer[i].replace(/^>/, '');
	                buffer[i] = buffer[i].replace(/^\\>/, '>');
	            }
	            return buffer.join('\n');
	        }
	    },
	    // Paragraph (lowest priority, cannot be escaped).
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
	                closeMatch = RegExp('^' + utils.escapeRegExp(match[0]) + '$');
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
	            expansionOptions = {
	                macros: false,
	                spans: false,
	                specials: false,
	                container: false,
	                skip: false
	            };
	            var k;
	            for (k in expansionOptions)
	                expansionOptions[k] = def.expansionOptions[k];
	            for (k in lineBlocks.blockOptions)
	                expansionOptions[k] = lineBlocks.blockOptions[k];
	            // Process block.
	            if (!expansionOptions.skip) {
	                var text = lines.join('\n');
	                if (def.filter) {
	                    text = def.filter(text, match, expansionOptions);
	                }
	                writer.write(utils.injectHtmlAttributes(def.openTag));
	                if (expansionOptions.container) {
	                    text = render_1.renderSource(text);
	                }
	                else {
	                    text = utils.replaceInline(text, expansionOptions);
	                }
	                writer.write(text);
	                writer.write(def.closeTag);
	                if ((def.openTag || text || def.closeTag) && !reader.eof()) {
	                    // Add a trailing '\n' if we've written a non-blank line and there are more source lines left.
	                    writer.write('\n');
	                }
	            }
	            // Reset consumed Block Attributes expansion options.
	            lineBlocks.blockOptions = {};
	            return true;
	        }
	    }
	    return false; // No matching delimited block found.
	}
	exports.render = render;
	// Return block definition or null if not found.
	function getDefinition(name) {
	    for (var i in defs) {
	        if (defs[i].name === name) {
	            return defs[i];
	        }
	    }
	    return null;
	}
	exports.getDefinition = getDefinition;
	// Parse delimited block expansion options string into blockOptions.
	function setBlockOptions(blockOptions, optionsString) {
	    if (optionsString) {
	        var opts = optionsString.trim().split(/\s+/);
	        for (var i in opts) {
	            var opt = opts[i];
	            if (options.safeMode !== 0 && opt === '-specials') {
	                return;
	            }
	            if (/^[+-](macros|spans|specials|container|skip)$/.test(opt)) {
	                blockOptions[opt.slice(1)] = opt[0] === '+';
	            }
	        }
	    }
	}
	exports.setBlockOptions = setBlockOptions;
	// Update existing named definition.
	// Value syntax: <open-tag>|<close-tag> block-options
	function setDefinition(name, value) {
	    var def = getDefinition(name);
	    var match = utils.trim(value).match(/^(?:(<[a-zA-Z].*>)\|(<[a-zA-Z/].*>))?(?:\s*)?([+-][ \w+-]+)?$/);
	    if (match) {
	        if (match[1]) {
	            def.openTag = match[1];
	            def.closeTag = match[2];
	        }
	        setBlockOptions(def.expansionOptions, match[3]);
	    }
	}
	exports.setDefinition = setDefinition;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/* tslint:disable */
	var utils = __webpack_require__(8);
	var io = __webpack_require__(5);
	var delimitedBlocks = __webpack_require__(6);
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
	exports.render = render;
	function renderList(startItem, reader, writer) {
	    ids.push(startItem.id);
	    writer.write(utils.injectHtmlAttributes(startItem.def.listOpenTag));
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
	        text = utils.replaceInline(match[1], { macros: true, spans: true });
	        writer.write(text);
	        writer.write(def.termCloseTag);
	    }
	    writer.write(def.itemOpenTag);
	    // Process of item text.
	    var lines = new io.Writer();
	    lines.write(match[match.length - 1]); // Item text from first line.
	    lines.write('\n');
	    reader.next();
	    var nextItem;
	    nextItem = readToNext(reader, lines);
	    text = lines.toString();
	    text = utils.replaceInline(text, { macros: true, spans: true });
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
	            delimitedBlocks.render(reader, writer);
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
	            def = delimitedBlocks.getDefinition(name);
	            if (def.openMatch.test(line)) {
	                item.isDelimited = true;
	                return item;
	            }
	        }
	    }
	    // Check if the line matches an Indented Paragraph definition.
	    if (options.indented) {
	        def = delimitedBlocks.getDefinition('indented');
	        if (def.openMatch.test(line)) {
	            item.isIndented = true;
	            return item;
	        }
	    }
	    return null;
	}


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/* tslint:disable */
	var macros = __webpack_require__(10);
	var spans = __webpack_require__(11);
	var lineBlocks = __webpack_require__(4);
	// Whitespace strippers.
	function trimLeft(s) {
	    return s.replace(/^\s+/g, '');
	}
	exports.trimLeft = trimLeft;
	function trimRight(s) {
	    return s.replace(/\s+$/g, '');
	}
	exports.trimRight = trimRight;
	function trim(s) {
	    return s.replace(/^\s+|\s+$/g, '');
	}
	exports.trim = trim;
	// http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
	function escapeRegExp(s) {
	    return s.replace(/[\-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');
	}
	exports.escapeRegExp = escapeRegExp;
	function replaceSpecialChars(s) {
	    return s.replace(/&/g, '&amp;')
	        .replace(/>/g, '&gt;')
	        .replace(/</g, '&lt;');
	}
	exports.replaceSpecialChars = replaceSpecialChars;
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
	exports.replaceMatch = replaceMatch;
	// Replace the inline elements specified in options in text and return the result.
	function replaceInline(text, expansionOptions) {
	    if (expansionOptions.macros) {
	        text = macros.render(text);
	        text = text === null ? '' : text;
	    }
	    // Spans also expand special characters.
	    if (expansionOptions.spans) {
	        return spans.render(text);
	    }
	    else if (expansionOptions.specials) {
	        return replaceSpecialChars(text);
	    }
	    else {
	        return text;
	    }
	}
	exports.replaceInline = replaceInline;
	// Inject HTML attributes from LineBlocks.htmlAttributes into the opening tag.
	// Consume LineBlocks.htmlAttributes unless the 'tag' argument is blank.
	function injectHtmlAttributes(tag) {
	    if (!tag) {
	        return tag;
	    }
	    if (lineBlocks.htmlClasses) {
	        if (/class="\S.*"/.test(tag)) {
	            // Inject class names into existing class attribute.
	            tag = tag.replace(/class="(\S.*?)"/, 'class="' + lineBlocks.htmlClasses + ' $1"');
	        }
	        else {
	            // Prepend new class attribute to HTML attributes.
	            lineBlocks.htmlAttributes = trim('class="' + lineBlocks.htmlClasses + '" ' + lineBlocks.htmlAttributes);
	        }
	    }
	    if (lineBlocks.htmlAttributes) {
	        var match = tag.match(/^<([a-zA-Z]+|h[1-6])(?=[ >])/);
	        if (match) {
	            var before = tag.slice(0, match[0].length);
	            var after = tag.slice(match[0].length);
	            tag = before + ' ' + lineBlocks.htmlAttributes + after;
	        }
	    }
	    // Consume the attributes.
	    lineBlocks.htmlClasses = '';
	    lineBlocks.htmlAttributes = '';
	    return tag;
	}
	exports.injectHtmlAttributes = injectHtmlAttributes;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/* tslint:disable */
	var options = __webpack_require__(2);
	exports.defs = [
	    // Begin match with \\? to allow the replacement to be escaped.
	    // Global flag must be set on match re's so that the RegExp lastIndex property is set.
	    // Replacements and special characters are expanded in replacement groups ($1..).
	    // Replacement order is important.
	    // Character entity.
	    {
	        match: /\\?(&[\w#][\w]+;)/g,
	        replacement: '',
	        filter: function (match) {
	            return match[1]; // Pass the entity through verbatim.
	        }
	    },
	    // Line-break (space followed by \ at end of line).
	    {
	        match: /[\\ ]\\(\n|$)/g,
	        replacement: '<br>$1'
	    },
	    // DEPRECATED as of 3.4.0.
	    // Anchor: <<#id>>
	    {
	        match: /\\?<<#([a-zA-Z][\w\-]*)>>/g,
	        replacement: '<span id="$1"></span>'
	    },
	    // Image: <image:src|alt>
	    // src = $1, alt = $2
	    {
	        match: /\\?<image:([^\s\|]+)\|([\s\S]*?)>/g,
	        replacement: '<img src="$1" alt="$2">'
	    },
	    // Image: <image:src>
	    // src = $1, alt = $1
	    {
	        match: /\\?<image:([^\s\|]+?)>/g,
	        replacement: '<img src="$1" alt="$1">'
	    },
	    // Image: ![alt](url)
	    // alt = $1, url = $2
	    {
	        match: /\\?!\[([\s\S]*?)\]\s*\((\S+?)\)/g,
	        replacement: '<img src="$2" alt="$1">'
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
	            return options.safeModeFilter(match[1]);
	        }
	    },
	    // Link: <url|caption>
	    // url = $1, caption = $2
	    {
	        match: /\\?<(\S+?)\|([\s\S]*?)>/g,
	        replacement: '<a href="$1">$2</a>'
	    },
	    // Link: <url>
	    // url = $1
	    {
	        match: /\\?<(\S+?)>/g,
	        replacement: '<a href="$1">$1</a>'
	    },
	    // Link: [caption](url)
	    // caption = $1, url = $2
	    {
	        match: /\\?\[([\s\S]*?)\]\s*\((\S+?)\)/g,
	        replacement: '<a href="$2">$1</a>'
	    },
	    // Auto-encode (most) raw HTTP URLs as links.
	    {
	        match: /(^|[^<])\b((?:http|https):\/\/[^\s"']*[^\s"',.;?)])/g,
	        replacement: '$1<a href="$2">$2</a>'
	    },
	];
	// Update existing or add new replacement definition.
	function setDefinition(regexp, flags, replacement) {
	    if (!/g/.test(flags)) {
	        flags += 'g';
	    }
	    for (var i in exports.defs) {
	        if (exports.defs[i].match.source === regexp) {
	            // Update existing definition.
	            // Flag properties are read-only so have to create new RegExp.
	            exports.defs[i].match = new RegExp(regexp, flags);
	            exports.defs[i].replacement = replacement;
	            return;
	        }
	    }
	    // Add new definition at start of defs list.
	    exports.defs.unshift({ match: new RegExp(regexp, flags), replacement: replacement });
	}
	exports.setDefinition = setDefinition;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	// Matches macro invocation. $1 = name, $2 = params.
	var MATCH_MACRO = /\{([\w\-]+)([!=|?](?:|[\s\S]*?[^\\]))?\}/;
	// Matches all macro invocations. $1 = name, $2 = params.
	var MATCH_MACROS = RegExp('\\\\?' + MATCH_MACRO.source, 'g');
	// Matches a line starting with a macro invocation.
	exports.MACRO_LINE = RegExp('^' + MATCH_MACRO.source + '.*$');
	// Match multi-line macro definition open delimiter. $1 is first line of macro.
	exports.MACRO_DEF_OPEN = /^\\?\{[\w\-]+\}\s*=\s*'(.*)$/;
	// Match multi-line macro definition open delimiter. $1 is last line of macro.
	exports.MACRO_DEF_CLOSE = /^(.*)'$/;
	// Match single-line macro definition. $1 = name, $2 = value.
	exports.MACRO_DEF = /^\\?\{([\w\-]+)\}\s*=\s*'(.*)'$/;
	exports.defs = [];
	// Return named macro value or null if it doesn't exist.
	function getValue(name) {
	    for (var i in exports.defs) {
	        if (exports.defs[i].name === name) {
	            return exports.defs[i].value;
	        }
	    }
	    return null;
	}
	exports.getValue = getValue;
	// Set named macro value or add it if it doesn't exist.
	function setValue(name, value) {
	    for (var i in exports.defs) {
	        if (exports.defs[i].name === name) {
	            exports.defs[i].value = value;
	            return;
	        }
	    }
	    exports.defs.push({ name: name, value: value });
	}
	exports.setValue = setValue;
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
	        var name = args[0];
	        /* $1 */
	        var params = args[1] || '';
	        /* $2 */
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
	            case '!': // Inclusion macro.
	            case '=':
	                var pattern = params.slice(1);
	                var skip = !RegExp('^' + pattern + '$').test(value || '');
	                if (params[0] === '!') {
	                    skip = !skip;
	                }
	                return skip ? '\0' : ''; // '\0' flags line for deletion.
	            default:
	                return value || ''; // Undefined macro replaced by empty string.
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
	exports.render = render;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

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
	/* tslint:disable */
	var utils = __webpack_require__(8);
	var quotes = __webpack_require__(3);
	var replacements = __webpack_require__(9);
	function render(source) {
	    var fragments = [{ text: source, done: false }];
	    fragQuotes(fragments);
	    fragReplacements(fragments);
	    fragSpecials(fragments);
	    return defrag(fragments);
	}
	exports.render = render;
	// Converts fragments to a string.
	function defrag(fragments) {
	    var result = [];
	    for (var i in fragments) {
	        result.push(fragments[i].text);
	    }
	    return result.join('');
	}
	function fragQuotes(fragments) {
	    var findRe = quotes.findRe;
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
	            // Restart search after opening quote.
	            findRe.lastIndex = match.index + match[1].length + 1;
	            continue;
	        }
	        // Arrive here if we have a matched quote.
	        var def = quotes.getDefinition(match[1]);
	        if (def.verify && !def.verify(match, findRe)) {
	            // Restart search after opening quote.
	            findRe.lastIndex = match.index + match[1].length + 1;
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
	            fragment.text = quotes.unescape(fragment.text);
	            fragment.text = utils.replaceSpecialChars(fragment.text);
	            fragment.done = true;
	            // Move to 'after' fragment.
	            fragmentIndex += 2;
	            fragment = fragments[fragmentIndex];
	        }
	        findRe.lastIndex = 0;
	    }
	    // Strip backlash from escaped quotes in non-done fragments.
	    for (var i in fragments) {
	        fragment = fragments[i];
	        if (!fragment.done) {
	            fragment.text = quotes.unescape(fragment.text);
	        }
	    }
	}
	function fragReplacements(fragments) {
	    for (var i in replacements.defs) {
	        fragReplacement(fragments, replacements.defs[i]);
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
	            fragment.text = utils.replaceSpecialChars(fragment.text);
	        }
	        else {
	            if (!def.filter) {
	                fragment.text = utils.replaceMatch(match, def.replacement, { specials: true });
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
	            fragment.text = utils.replaceSpecialChars(fragment.text);
	        }
	    }
	}


/***/ }
/******/ ]);