declare module Rimu {
    function render(source: string, options?: Options.Values): string;
    function renderSource(source: string): string;
}
declare module Rimu {
    function trimLeft(s: string): string;
    function trimRight(s: string): string;
    function trim(s: string): string;
    function escapeRegExp(s: string): string;
    function replaceSpecialChars(s: string): string;
    function replaceMatch(match: RegExpExecArray, replacement: string, options: {
        macros?: boolean;
        spans?: boolean;
        specials?: boolean;
    }): string;
    function replaceInline(text: string, options: {
        macros?: boolean;
        spans?: boolean;
        specials?: boolean;
    }): string;
    function injectAttributes(tag: string): string;
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
    interface Macro {
        name: string;
        value: string;
    }
    var defs: Macro[];
    function get(name: string): string;
    function set(name: string, value: string): void;
    function render(text: string, options?: {
        inclusionsOnly?: boolean;
    }): string;
    function renderInclusions(reader: Rimu.Reader): boolean;
}
declare module Rimu.LineBlocks {
    interface Definition {
        id?: string;
        filter?: (match: RegExpExecArray, reader?: Rimu.Reader) => string;
        match: RegExp;
        replacement: string;
        macros?: boolean;
        spans?: boolean;
        specials?: boolean;
    }
    var htmlAttributes: string;
    function render(reader: Rimu.Reader, writer: Rimu.Writer): boolean;
    function getDefinition(id: string): Definition;
}
declare module Rimu.DelimitedBlocks {
    interface Definition {
        id?: string;
        openMatch: RegExp;
        closeMatch: RegExp;
        openTag: string;
        closeTag: string;
        macros?: boolean;
        filter?: (text: string, match: RegExpExecArray) => string;
        verify?: (match: string[]) => boolean;
        container?: boolean;
        skip?: boolean;
        spans?: boolean;
        specials?: boolean;
    }
    function render(reader: Rimu.Reader, writer: Rimu.Writer): boolean;
    function getDefinition(id: string): Definition;
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
