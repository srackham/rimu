module Rimu {
    function render(source: string, options?: Options.Values): string;
    function renderSource(source: string): string;
}
module Rimu {
    function trimLeft(s: string): string;
    function trimRight(s: string): string;
    function trim(s: string): string;
    function escapeRegExp(s: string): string;
    function replaceSpecialChars(s: string): string;
    function replaceMatch(match: RegExpExecArray, replacement: string, options?: {}): string;
    function replaceOptions(text: string, options: {
            variables?: bool;
            spans?: bool;
            specials?: bool;
        }): string;
    function injectAttributes(tag: string): string;
}
module Rimu.Options {
    interface Values {
        safeMode?: number;
        htmlReplacement?: string;
    }
    var safeMode: number;
    var htmlReplacement: string;
    function update(options: Values): void;
    function safeModeFilter(text: string): string;
}
module Rimu {
    class Reader {
        public lines: string[];
        public pos: number;
        constructor(text: string);
        public cursor(value?: string): string;
        public eof(): bool;
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
module Rimu.Variables {
    interface Variable {
        name: string;
        value: string;
    }
    var list: Variable[];
    function reset(): void;
    function get(name: string): string;
    function set(name: string, value: string): void;
    function render(text: string): string;
}
module Rimu.LineBlocks {
    interface Definition {
        id?: string;
        filter: (match: RegExpExecArray, block: Definition) => string;
        match: RegExp;
        replacement: string;
        variables?: bool;
        spans?: bool;
        specials?: bool;
    }
    var htmlAttributes: string;
    function render(reader: Reader, writer: Writer): bool;
    function getDefinition(id: string): Definition;
}
module Rimu.DelimitedBlocks {
    interface Definition {
        id?: string;
        openMatch: RegExp;
        closeMatch: RegExp;
        openTag: string;
        closeTag: string;
        variables: bool;
        filter?: (text: string, match: RegExpExecArray) => string;
        verify?: (match: string[]) => bool;
        container?: bool;
        skip?: bool;
        spans?: bool;
        specials?: bool;
    }
    function render(reader: Reader, writer: Writer): bool;
    function getDefinition(id: string): Definition;
}
module Rimu.Lists {
    function render(reader: Reader, writer: Writer): bool;
}
module Rimu.Spans {
    function render(source: string): string;
}
module Rimu.Quotes {
    interface Definition {
        quote: string;
        openTag: string;
        closeTag: string;
        spans: bool;
        verify?: (match: RegExpExecArray, re: RegExp) => bool;
    }
    var findRe: RegExp;
    function find(quote: string): Definition;
    function unescape(s: string): string;
}
module Rimu.Replacements {
    interface Definition {
        filter: (match: RegExpExecArray, replacement: Definition) => string;
        match: RegExp;
        replacement: string;
        specials: bool;
    }
    var defs: Definition[];
}
