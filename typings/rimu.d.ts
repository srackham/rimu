// Type definitions for Rimu Markup
// Project: https://github.com/srackham/rimu

export interface Options {
  safeMode?: number;
  htmlReplacement?: string;
  macroMode?: number;
  reset?: boolean;
  callback?: CallbackFunction;
}
export type CallbackFunction = (message: CallbackMessage) => void;
export interface CallbackMessage {
  type: string;
  text: string;
}
export function render(source: string, options?: Options): string;
