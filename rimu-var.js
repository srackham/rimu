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
	var api = __webpack_require__(1);
	var options = __webpack_require__(2);
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
	    if (typeof source !== 'string') {
	        throw new TypeError('render(): source argument is not a string');
	    }
	    if (opts !== undefined && typeof opts !== 'object') {
	        throw new TypeError('render(): options argument is not an object');
	    }
	    options.updateOptions(opts);
	    return api.render(source);
	}
	exports.render = render;
	// Load-time initialization.
	api.reset();


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var io = __webpack_require__(4);
	var lineBlocks = __webpack_require__(3);
	var delimitedBlocks = __webpack_require__(5);
	var lists = __webpack_require__(6);
	var macros = __webpack_require__(7);
	var options = __webpack_require__(2);
	var quotes = __webpack_require__(8);
	var replacements = __webpack_require__(9);
	function render(source) {
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
	exports.render = render;
	// Set API to default state.
	function reset() {
	    options.setDefaults();
	    delimitedBlocks.reset();
	    macros.reset();
	    quotes.reset();
	    replacements.reset();
	}
	exports.reset = reset;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(10);
	var api = __webpack_require__(1);
	// Global option values.
	exports.safeMode;
	exports.htmlReplacement;
	exports.macroMode;
	// Reset options to default values.
	function setDefaults() {
	    exports.safeMode = 0;
	    exports.htmlReplacement = '<mark>replaced HTML</mark>';
	    exports.macroMode = 4;
	}
	exports.setDefaults = setDefaults;
	// Return true if set to a safe mode.
	function isSafe() {
	    return exports.safeMode !== 0;
	}
	exports.isSafe = isSafe;
	function setSafeMode(value) {
	    var n = Number(value);
	    if (!isNaN(n) && n >= 0 && n <= 3) {
	        exports.safeMode = n;
	    }
	}
	function setMacroMode(value) {
	    var n = Number(value);
	    if (!isNaN(n) && n >= 0 && n <= 4) {
	        exports.macroMode = n;
	    }
	}
	function setHtmlReplacement(value) {
	    exports.htmlReplacement = value;
	}
	function setReset(value) {
	    if (value === true || value === 'true') {
	        api.reset();
	    }
	}
	function updateOptions(options) {
	    if ('reset' in options)
	        setReset(options.reset); // Reset takes priority.
	    if ('safeMode' in options)
	        setSafeMode(options.safeMode);
	    if ('htmlReplacement' in options)
	        setHtmlReplacement(options.htmlReplacement);
	    if ('macroMode' in options)
	        setMacroMode(options.macroMode);
	}
	exports.updateOptions = updateOptions;
	// Set named option value.
	function setOption(name, value) {
	    var option = {};
	    option[name] = value;
	    updateOptions(option);
	}
	exports.setOption = setOption;
	// Filter HTML based on current safeMode.
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
	    }
	}
	exports.safeModeFilter = safeModeFilter;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(10);
	var options = __webpack_require__(2);
	var delimitedBlocks = __webpack_require__(5);
	var quotes = __webpack_require__(8);
	var replacements = __webpack_require__(9);
	var macros = __webpack_require__(7);
	var defs = [
	    // Prefix match with backslash to allow escaping.
	    // Delimited Block definition.
	    // name = $1, definition = $2
	    {
	        match: /^\\?\|([\w\-]+)\|\s*=\s*'(.*)'$/,
	        replacement: '',
	        expansionOptions: {},
	        filter: function (match) {
	            if (options.isSafe()) {
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
	            if (options.isSafe()) {
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
	            if (options.isSafe()) {
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
	            if (options.isSafe()) {
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
	            if (value === match[0]) {
	                // Escape macro to prevent infinite recursion if the value is the same as the invocation.
	                value = '\\' + value;
	            }
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
	            match = /^\\?\.((?:\s*[a-zA-Z][\w\-]*)+)*(?:\s*)?(#[a-zA-Z][\w\-]*\s*)?(?:\s*)?(\[.+\])?(?:\s*)?([+-][ \w+-]+)?$/.exec(text);
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
	            if (match[3] && !options.isSafe()) {
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
	    // API Option.
	    // name = $1, value = $2
	    {
	        match: /^\\?\.(safeMode|htmlReplacement|macroMode|reset)\s*=\s*'(.*)'$/,
	        replacement: '',
	        expansionOptions: {
	            macros: true
	        },
	        filter: function (match) {
	            if (!options.isSafe()) {
	                options.setOption(match[1], match[2]);
	            }
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
	    for (var _i = 0; _i < defs.length; _i++) {
	        var def = defs[_i];
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
	            var text = void 0;
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
	// Return line block definition or undefined if not found.
	function getDefinition(name) {
	    return defs.filter(function (def) { return def.name === name; })[0];
	}
	exports.getDefinition = getDefinition;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var Reader = (function () {
	    function Reader(text) {
	        // Split lines on newline boundaries.
	        // http://stackoverflow.com/questions/1155678/javascript-string-newline-character
	        // Split is broken on IE8 e.g. 'X\n\nX'.split(/\n/g).length) returns 2 but should return 3.
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
	                if (match[1] !== undefined) {
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
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var api = __webpack_require__(1);
	var utils = __webpack_require__(10);
	var options = __webpack_require__(2);
	var macros = __webpack_require__(7);
	var lineBlocks = __webpack_require__(3);
	var defs; // Mutable definitions initialized by DEFAULT_DEFS.
	var DEFAULT_DEFS = [
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
	        delimiterFilter: delimiterTextFilter,
	        contentfilter: function (text, match, expansionOptions) {
	            // Process macro definition.
	            var name = match[0].match(/^\{([\w\-]+)\}/)[1]; // Get the macro name from opening delimiter.
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
	        openMatch: /^\\?(\.{2,})([\w\s-]*)$/,
	        openTag: '<div>',
	        closeTag: '</div>',
	        expansionOptions: {
	            container: true,
	            specials: true // Fall-back if container is disabled.
	        },
	        delimiterFilter: classInjectionFilter
	    },
	    // Quote block.
	    {
	        name: 'quote',
	        openMatch: /^\\?("{2,})([\w\s-]*)$/,
	        openTag: '<blockquote>',
	        closeTag: '</blockquote>',
	        expansionOptions: {
	            container: true,
	            specials: true // Fall-back if container is disabled.
	        },
	        delimiterFilter: classInjectionFilter
	    },
	    // Code block.
	    {
	        name: 'code',
	        // Backtick hex literal \x60 to work arount eslint problem.
	        // See https://github.com/palantir/tslint/issues/357.
	        openMatch: /^\\?(\-{2,}|\x60{2,})([\w\s-]*)$/,
	        openTag: '<pre><code>',
	        closeTag: '</code></pre>',
	        expansionOptions: {
	            macros: false,
	            specials: true
	        },
	        delimiterFilter: classInjectionFilter
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
	        delimiterFilter: delimiterTextFilter,
	        contentfilter: options.safeModeFilter
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
	        delimiterFilter: delimiterTextFilter,
	        contentfilter: function (text) {
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
	        delimiterFilter: delimiterTextFilter,
	        contentfilter: function (text) {
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
	        },
	        delimiterFilter: delimiterTextFilter
	    },
	];
	// Reset definitions to defaults.
	function reset() {
	    defs = DEFAULT_DEFS.map(function (def) { return utils.copy(def); });
	}
	exports.reset = reset;
	// If the next element in the reader is a valid delimited block render it
	// and return true, else return false.
	function render(reader, writer) {
	    if (reader.eof())
	        throw 'premature eof';
	    for (var _i = 0; _i < defs.length; _i++) {
	        var def = defs[_i];
	        var match = reader.cursor().match(def.openMatch);
	        if (match) {
	            // Escape non-paragraphs.
	            if (match[0][0] === '\\' && def.name !== 'paragraph') {
	                // Drop backslash escape and continue.
	                reader.cursor(reader.cursor().slice(1));
	                continue;
	            }
	            // Process opening delimiter.
	            var delimiterText = def.delimiterFilter ? def.delimiterFilter(match) : '';
	            // Read block content into lines.
	            var lines = [];
	            if (delimiterText) {
	                lines.push(delimiterText);
	            }
	            // Read content up to the closing delimiter.
	            reader.next();
	            var content = reader.readTo(def.closeMatch);
	            if (content) {
	                lines = lines.concat(content);
	            }
	            // Calculate block expansion options.
	            var expansionOptions = {
	                macros: false,
	                spans: false,
	                specials: false,
	                container: false,
	                skip: false
	            };
	            utils.merge(expansionOptions, def.expansionOptions);
	            utils.merge(expansionOptions, lineBlocks.blockOptions);
	            // Translate block.
	            if (!expansionOptions.skip) {
	                var text = lines.join('\n');
	                if (def.contentfilter) {
	                    text = def.contentfilter(text, match, expansionOptions);
	                }
	                writer.write(utils.injectHtmlAttributes(def.openTag));
	                if (expansionOptions.container) {
	                    delete lineBlocks.blockOptions.container; // Consume before recursion.
	                    text = api.render(text);
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
	// Return block definition or undefined if not found.
	function getDefinition(name) {
	    return defs.filter(function (def) { return def.name === name; })[0];
	}
	exports.getDefinition = getDefinition;
	// Parse block-options string into blockOptions.
	function setBlockOptions(blockOptions, optionsString) {
	    if (optionsString) {
	        var opts = optionsString.trim().split(/\s+/);
	        for (var _i = 0; _i < opts.length; _i++) {
	            var opt = opts[_i];
	            if (options.isSafe() && opt === '-specials') {
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
	// delimiterFilter that returns opening delimiter line text from match group $1.
	function delimiterTextFilter(match) {
	    return match[1];
	}
	// delimiterFilter for code, division and quote blocks.
	// Inject $2 into block class attribute, set close delimiter to $1.
	function classInjectionFilter(match) {
	    if (match[2]) {
	        var p1;
	        if ((p1 = utils.trim(match[2]))) {
	            lineBlocks.htmlClasses = p1;
	        }
	    }
	    this.closeMatch = RegExp('^' + utils.escapeRegExp(match[1]) + '$');
	    return '';
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(10);
	var io = __webpack_require__(4);
	var delimitedBlocks = __webpack_require__(5);
	var defs = [
	    // Prefix match with backslash to allow escaping.
	    // Unordered lists.
	    // $1 is list ID $2 is item text.
	    {
	        match: /^\\?\s*(-|\+|\*{1,4})\s+(.*)$/,
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
	// identity information or null if there are no more list elements.
	function readToNext(reader, writer) {
	    // The reader should be at the line following the first line of the list
	    // item (or EOF).
	    var next;
	    while (true) {
	        if (reader.eof())
	            return null;
	        if (reader.cursor() === '') {
	            // Encountered blank line.
	            reader.next();
	            if (reader.cursor() === '') {
	                // A second blank line terminates the list.
	                return null;
	            }
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
	// Check if the line at the reader cursor matches a list related element.
	// If it does return list item information else return null.  It matches
	// list item elements but 'options' can be included to also match delimited
	// blocks or indented paragraphs.
	function matchItem(reader, options) {
	    if (options === void 0) { options = {}; }
	    // Check if the line matches a List definition.
	    var line = reader.cursor();
	    var item = {}; // ItemState factory.
	    for (var _i = 0; _i < defs.length; _i++) {
	        var def_1 = defs[_i];
	        var match = def_1.match.exec(line);
	        if (match) {
	            if (match[0][0] === '\\') {
	                reader.cursor(reader.cursor().slice(1)); // Drop backslash.
	                return null;
	            }
	            item.match = match;
	            item.def = def_1;
	            item.id = match[match.length - 2];
	            item.isListItem = true;
	            return item;
	        }
	    }
	    // Check if the line matches a Delimited Block definition.
	    var def;
	    if (options.delimited) {
	        for (var _a = 0, _b = ['quote', 'code', 'division']; _a < _b.length; _a++) {
	            var name_1 = _b[_a];
	            def = delimitedBlocks.getDefinition(name_1);
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
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var options = __webpack_require__(2);
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
	// Reset definitions to defaults.
	function reset() {
	    exports.defs = [];
	}
	exports.reset = reset;
	// Return named macro value or null if it doesn't exist.
	function getValue(name) {
	    for (var _i = 0; _i < exports.defs.length; _i++) {
	        var def = exports.defs[_i];
	        if (def.name === name) {
	            return def.value;
	        }
	    }
	    return null;
	}
	exports.getValue = getValue;
	// Set named macro value or add it if it doesn't exist.
	function setValue(name, value) {
	    for (var _i = 0; _i < exports.defs.length; _i++) {
	        var def = exports.defs[_i];
	        if (def.name === name) {
	            def.value = value;
	            return;
	        }
	    }
	    exports.defs.push({ name: name, value: value });
	}
	exports.setValue = setValue;
	// Render all macro invocations in text string.
	function render(text) {
	    text = text.replace(MATCH_MACROS, function (match) {
	        var submatches = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            submatches[_i - 1] = arguments[_i];
	        }
	        if (match[0] === '\\') {
	            return match.slice(1);
	        }
	        var name = submatches[0];
	        var params = submatches[1] || '';
	        var value = getValue(name); // Macro value is null if macro is undefined.
	        switch (options.macroMode) {
	            case 0:
	                return match;
	            case 1:
	                break;
	            case 2:
	                if (value === null) {
	                    return match;
	                }
	                break;
	            case 3:
	                if (!/^--/.test(name)) {
	                    return match;
	                }
	                break;
	            case 4:
	                if (value === null && !/^--/.test(name)) {
	                    return match;
	                }
	                break;
	        }
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
	                    var param = paramsList[Number(match.slice(1)) - 1];
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
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(10);
	var defs; // Mutable definitions initialized by DEFAULT_DEFS.
	var DEFAULT_DEFS = [
	    {
	        quote: '**',
	        openTag: '<strong>',
	        closeTag: '</strong>',
	        spans: true
	    },
	    {
	        quote: '*',
	        openTag: '<em>',
	        closeTag: '</em>',
	        spans: true
	    },
	    {
	        quote: '__',
	        openTag: '<strong>',
	        closeTag: '</strong>',
	        spans: true
	    },
	    {
	        quote: '_',
	        openTag: '<em>',
	        closeTag: '</em>',
	        spans: true
	    },
	    {
	        quote: '``',
	        openTag: '<code>',
	        closeTag: '</code>',
	        spans: false
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
	exports.quotesRe; // Searches for quoted text.
	var unescapeRe; // Searches for escaped quotes.
	// Reset definitions to defaults.
	function reset() {
	    defs = DEFAULT_DEFS.map(function (def) { return utils.copy(def); });
	    initializeRegExps();
	}
	exports.reset = reset;
	// Synthesise re's to find and unescape quotes.
	function initializeRegExps() {
	    var quotes = defs.map(function (def) { return utils.escapeRegExp(def.quote); });
	    // $1 is quote character(s), $2 is quoted text.
	    // Quoted text cannot begin or end with whitespace.
	    // Quoted can span multiple lines.
	    // Quoted text cannot end with a backslash.
	    exports.quotesRe = RegExp('\\\\?(' + quotes.join('|') + ')([^\\s\\\\]|\\S[\\s\\S]*?[^\\s\\\\])\\1', 'g');
	    // $1 is quote character(s).
	    unescapeRe = RegExp('\\\\(' + quotes.join('|') + ')', 'g');
	}
	exports.initializeRegExps = initializeRegExps;
	// Return the quote definition corresponding to 'quote' character, return undefined if not found.
	function getDefinition(quote) {
	    return defs.filter(function (def) { return def.quote === quote; })[0];
	}
	exports.getDefinition = getDefinition;
	// Strip backslashes from quote characters.
	function unescape(s) {
	    return s.replace(unescapeRe, '$1');
	}
	exports.unescape = unescape;
	// Update existing or add new quote definition.
	function setDefinition(def) {
	    for (var _i = 0; _i < defs.length; _i++) {
	        var d = defs[_i];
	        if (d.quote === def.quote) {
	            // Update existing definition.
	            d.openTag = def.openTag;
	            d.closeTag = def.closeTag;
	            d.spans = def.spans;
	            return;
	        }
	    }
	    // Double-quote definitions are prepended to the array so they are matched
	    // before single-quote definitions (which are appended to the array).
	    if (def.quote.length === 2) {
	        defs.unshift(def);
	    }
	    else {
	        defs.push(def);
	    }
	    initializeRegExps();
	}
	exports.setDefinition = setDefinition;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var options = __webpack_require__(2);
	var utils = __webpack_require__(10);
	exports.defs; // Mutable definitions initialized by DEFAULT_DEFS.
	var DEFAULT_DEFS = [
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
	    // Link: <url>
	    // url = $1
	    {
	        match: /\\?<([^|]+?)>/g,
	        replacement: '<a href="$1">$1</a>'
	    },
	    // Link: <url|caption>
	    // url = $1, caption = $2
	    {
	        match: /\\?<(.+?)\|([\s\S]*?)>/g,
	        replacement: '<a href="$1">$2</a>'
	    },
	    // Link: [caption](url)
	    // caption = $1, url = $2
	    {
	        match: /\\?\[([\s\S]*?)\]\s*\((.+?)\)/g,
	        replacement: '<a href="$2">$1</a>'
	    },
	    // Auto-encode (most) raw HTTP URLs as links.
	    {
	        match: /\\?((?:http|https):\/\/[^\s"']*[A-Za-z0-9/#])/g,
	        replacement: '<a href="$1">$1</a>'
	    },
	    // This hack ensures backslashes immediately preceding closing code quotes are rendered
	    // verbatim (Markdown behaviour).
	    // Works by finding escaped closing code quotes and replacing the backslash and the character
	    // preceding the closing quote with itself.
	    {
	        match: /(\S\\)(?=`)/g,
	        replacement: '$1'
	    },
	    // This hack ensures underscores within words rendered verbatim and are not treated as
	    // underscore emphasis quotes (GFM behaviour).
	    {
	        match: /([a-zA-Z0-9]_)(?=[a-zA-Z0-9])/g,
	        replacement: '$1'
	    },
	];
	// Reset definitions to defaults.
	function reset() {
	    exports.defs = DEFAULT_DEFS.map(function (def) { return utils.copy(def); });
	}
	exports.reset = reset;
	// Update existing or add new replacement definition.
	function setDefinition(regexp, flags, replacement) {
	    if (!/g/.test(flags)) {
	        flags += 'g';
	    }
	    for (var _i = 0; _i < exports.defs.length; _i++) {
	        var def = exports.defs[_i];
	        if (def.match.source === regexp) {
	            // Update existing definition.
	            // Flag properties are read-only so have to create new RegExp.
	            def.match = new RegExp(regexp, flags);
	            def.replacement = replacement;
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

	var macros = __webpack_require__(7);
	var spans = __webpack_require__(11);
	var lineBlocks = __webpack_require__(3);
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
	        var i = Number(arguments[0][1]); // match group number.
	        var text = match[i]; // match group text.
	        return replaceInline(text, expansionOptions);
	    });
	}
	exports.replaceMatch = replaceMatch;
	// Shallow object clone.
	function copy(source) {
	    var result = {};
	    for (var key in source) {
	        if (source.hasOwnProperty(key)) {
	            result[key] = source[key];
	        }
	    }
	    return result;
	}
	exports.copy = copy;
	// Copy properties in source object to target object.
	function merge(target, source) {
	    for (var key in source) {
	        target[key] = source[key];
	    }
	}
	exports.merge = merge;
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
	        text = replaceSpecialChars(text);
	    }
	    return text;
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
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 This module renders inline text containing Quote and Replacement elements.

	 Quote and replacement processing involves splitting the source text into
	 fragments where at the points where quotes and replacements occur then splicing fragments
	 containing output markup into the breaks. A fragment is flagged as 'done' to
	 exclude it from further processing.

	 Once all quotes and replacements are processed fragments not yet flagged as
	 'done' have special characters (&, <, >) replaced with corresponding special
	 character entities. The fragments are then reassembled (defraged) into a
	 resultant HTML string.
	 */
	var utils = __webpack_require__(10);
	var quotes = __webpack_require__(8);
	var replacements = __webpack_require__(9);
	function render(source) {
	    var result;
	    result = preReplacements(source);
	    var fragments = [{ text: result, done: false }];
	    fragments = fragQuotes(fragments);
	    fragSpecials(fragments);
	    result = defrag(fragments);
	    return postReplacements(result);
	}
	exports.render = render;
	// Converts fragments to a string.
	function defrag(fragments) {
	    return fragments.reduce(function (result, fragment) { return result + fragment.text; }, '');
	}
	// Fragment quotes in all fragments and return resulting fragments array.
	function fragQuotes(fragments) {
	    var result;
	    result = [];
	    fragments.forEach(function (fragment) {
	        result.push.apply(result, fragQuote(fragment));
	    });
	    // Strip backlash from escaped quotes in non-done fragments.
	    result
	        .filter(function (fragment) { return !fragment.done; })
	        .forEach(function (fragment) { return fragment.text = quotes.unescape(fragment.text); });
	    return result;
	}
	// Fragment quotes in a single fragment and return resulting fragments array.
	function fragQuote(fragment) {
	    if (fragment.done) {
	        return [fragment];
	    }
	    var quotesRe = quotes.quotesRe;
	    var match;
	    quotesRe.lastIndex = 0;
	    while (true) {
	        match = quotesRe.exec(fragment.text);
	        if (!match) {
	            return [fragment];
	        }
	        // Check if quote is escaped.
	        if (match[0][0] === '\\') {
	            // Restart search after escaped opening quote.
	            quotesRe.lastIndex = match.index + match[1].length + 1;
	            continue;
	        }
	        break;
	    }
	    var result = [];
	    // Arrive here if we have a matched quote.
	    // The quote splits the input fragment into 5 or more output fragments:
	    // Text before the quote, left quote tag, quoted text, right quote tag and text after the quote.
	    var def = quotes.getDefinition(match[1]);
	    // Check for same closing quote one character further to the right.
	    while (fragment.text[quotesRe.lastIndex] === match[1][0]) {
	        // Move to closing quote one character to right.
	        match[2] += match[1][0];
	        quotesRe.lastIndex += 1;
	    }
	    var before = match.input.slice(0, match.index);
	    var quoted = match[2];
	    var after = match.input.slice(quotesRe.lastIndex);
	    result.push({ text: before, done: false });
	    result.push({ text: def.openTag, done: true });
	    if (!def.spans) {
	        // Spans are disabled so render the quoted text verbatim.
	        quoted = utils.replaceSpecialChars(quoted);
	        quoted = quoted.replace(/\u0000/g, '\u0001'); // Substitute verbatim replacement placeholder.
	        result.push({ text: quoted, done: true });
	    }
	    else {
	        // Recursively process the quoted text.
	        result.push.apply(result, fragQuote({ text: quoted, done: false }));
	    }
	    result.push({ text: def.closeTag, done: true });
	    // Recursively process the following text.
	    result.push.apply(result, fragQuote({ text: after, done: false }));
	    return result;
	}
	// Stores placeholder replacement fragments saved by `preReplacements()` and restored by `postReplacements()`.
	var savedReplacements;
	// Return text with replacements replaced with placeholders (see `postReplacements()`).
	function preReplacements(text) {
	    savedReplacements = [];
	    var fragments = fragReplacements([{ text: text, done: false }]);
	    // Reassemble text with replacement placeholders.
	    return fragments.reduce(function (result, fragment) {
	        if (fragment.done) {
	            savedReplacements.push(fragment); // Save replaced text.
	            return result + '\u0000'; // Placeholder for replaced text.
	        }
	        else {
	            return result + fragment.text;
	        }
	    }, '');
	}
	// Replace replacements placeholders with replacements text from savedReplacements[].
	function postReplacements(text) {
	    return text.replace(/\u0000|\u0001/g, function (match) {
	        var fragment = savedReplacements.shift();
	        return (match === '\u0000') ? fragment.text : utils.replaceSpecialChars(fragment.verbatim);
	    });
	}
	// Fragment replacements in all fragments and return resulting fragments array.
	function fragReplacements(fragments) {
	    var result;
	    replacements.defs.forEach(function (def) {
	        result = [];
	        fragments.forEach(function (fragment) {
	            result.push.apply(result, fragReplacement(fragment, def));
	        });
	        fragments = result;
	    });
	    return result;
	}
	// Fragment replacements in a single fragment for a single replacement definition.
	// Return resulting fragments array.
	function fragReplacement(fragment, def) {
	    if (fragment.done) {
	        return [fragment];
	    }
	    var replacementRe = def.match;
	    var match;
	    replacementRe.lastIndex = 0;
	    match = replacementRe.exec(fragment.text);
	    if (!match) {
	        return [fragment];
	    }
	    var result = [];
	    // Arrive here if we have a matched replacement.
	    // The replacement splits the input fragment into 3 output fragments:
	    // Text before the replacement, replaced text and text after the replacement.
	    var before = match.input.slice(0, match.index);
	    result.push({ text: before, done: false });
	    var replacement;
	    if (match[0][0] === '\\') {
	        // Remove leading backslash.
	        replacement = utils.replaceSpecialChars(match[0].slice(1));
	    }
	    else {
	        if (!def.filter) {
	            replacement = utils.replaceMatch(match, def.replacement, { specials: true });
	        }
	        else {
	            replacement = def.filter(match);
	        }
	    }
	    result.push({ text: replacement, done: true, verbatim: match[0] });
	    var after = match.input.slice(replacementRe.lastIndex);
	    // Recursively process the remaining text.
	    result.push.apply(result, fragReplacement({ text: after, done: false }, def));
	    return result;
	}
	function fragSpecials(fragments) {
	    // Replace special characters in all non-done fragments.
	    fragments
	        .filter(function (fragment) { return !fragment.done; })
	        .forEach(function (fragment) { return fragment.text = utils.replaceSpecialChars(fragment.text); });
	}


/***/ }
/******/ ]);