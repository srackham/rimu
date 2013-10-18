declare module Rimu {
    function render(source: string, options?: Options.Values): string;
    function renderSource(source: string): string;
}
declare module Rimu {
    interface ExpansionOptions {
        macros?: boolean;
        spans?: boolean;
        specials?: boolean;
        container?: boolean;
        skip?: boolean;
    }
    function trimLeft(s: string): string;
    function trimRight(s: string): string;
    function trim(s: string): string;
    function escapeRegExp(s: string): string;
    function replaceSpecialChars(s: string): string;
    function replaceMatch(match: RegExpExecArray, replacement: string, expansionOptions: ExpansionOptions): string;
    function replaceInline(text: string, expansionOptions: ExpansionOptions): string;
    function injectHtmlAttributes(tag: string): string;
}
declare module Rimu.Options {
    interface Values {
        safeMode?: number;
        htmlReplacement?: string;
    }
    var safeMode: number;
    var htmlReplacement: string;
    function update(options: Values): void;
    function safeModeFilter(text: string): string;
}
declare module Rimu {
    class Reader {
        public lines: string[];
        public pos: number;
        constructor(text: string);
        public cursor(value?: string): string;
        public eof(): boolean;
        public next(): string;
        public readTo(find: RegExp): string[];
        public skipBlankLines(): void;
    }
    class Writer {
        public buffer: string[];
        constructor();
        public write(s: string): void;
        public toString(): string;
    }
}
declare module Rimu.Macros {
    var MACRO_LINE: RegExp;
    var MACRO_DEF_OPEN: RegExp;
    var MACRO_DEF_CLOSE: RegExp;
    var MACRO_DEF: RegExp;
    interface Macro {
        name: string;
        value: string;
    }
    var defs: Macro[];
    function getValue(name: string): string;
    function setValue(name: string, value: string): void;
    function render(text: string): string;
}
declare module Rimu.LineBlocks {
    interface Definition {
        name?: string;
        filter?: (match: RegExpExecArray, reader?: Rimu.Reader) => string;
        verify?: (match: string[]) => boolean;
        match: RegExp;
        replacement: string;
        macros?: boolean;
        spans?: boolean;
        specials?: boolean;
    }
    var htmlAttributes: string;
    var blockOptions: Rimu.ExpansionOptions;
    function render(reader: Rimu.Reader, writer: Rimu.Writer): boolean;
    function getDefinition(name: string): Definition;
}
declare module Rimu.DelimitedBlocks {
    interface Definition {
        name?: string;
        openMatch: RegExp;
        closeMatch: RegExp;
        openTag: string;
        closeTag: string;
        filter?: (text: string, match: string[], expansionOptions: Rimu.ExpansionOptions) => string;
        verify?: (match: string[]) => boolean;
        macros?: boolean;
        container?: boolean;
        skip?: boolean;
        spans?: boolean;
        specials?: boolean;
    }
    function render(reader: Rimu.Reader, writer: Rimu.Writer): boolean;
    function getDefinition(name: string): Definition;
}
declare module Rimu.Lists {
    function render(reader: Rimu.Reader, writer: Rimu.Writer): boolean;
}
declare module Rimu.Spans {
    function render(source: string): string;
}
declare module Rimu.Quotes {
    interface Definition {
        quote: string;
        openTag: string;
        closeTag: string;
        spans: boolean;
        verify?: (match: RegExpExecArray, re: RegExp) => boolean;
    }
    var defs: Definition[];
    var findRe: RegExp;
    function find(quote: string): Definition;
    function unescape(s: string): string;
    function set(def: Definition): void;
}
declare module Rimu.Replacements {
    interface Definition {
        match: RegExp;
        replacement: string;
        filter?: (match: RegExpExecArray) => string;
    }
    var defs: Definition[];
    function set(regexp: string, flags: string, replacement: string): void;
}
