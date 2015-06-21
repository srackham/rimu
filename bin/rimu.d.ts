// Type definitions for Rimu Markup
// Project: https://github.com/srackham/rimu

declare module Rimu {
    interface Options {
        safeMode?: number;
        htmlReplacement?: string;
        macroMode?: number;
        reset?: boolean;
    }
    function render(source: string, options?: Rimu.Options): string;
}

export = Rimu;
