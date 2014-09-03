// Type definitions for Rimu Markup 1.0.0+ (readable-text markup language).
// Project: https://github.com/srackham/rimu

declare module Rimu {
    interface Options {
        safeMode?: number;
        htmlReplacement?: string;
    }
    function render(source: string, options?: Options): string;
}
