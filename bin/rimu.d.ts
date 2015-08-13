// Type definitions for Rimu Markup
// Project: https://github.com/srackham/rimu

declare namespace Rimu {
  interface Options {
    safeMode?: number;
    htmlReplacement?: string;
    macroMode?: number;
    reset?: boolean;
    callback?: CallbackFunction;
  }
  type CallbackFunction = (message: CallbackMessage) => void;
  interface CallbackMessage {
    type: string;
    text: string;
  }

  function render(source: string, options?: Options): string;
}

export = Rimu;
