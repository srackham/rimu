/*
 This is the main module, it exports the 'render' API.

 The compiled modules are bundled by Webpack into 'var' (script tag) and 'commonjs' (npm)
 formatted libraries.
 */

import * as Document from "./document.ts";
import * as Options from "./options.ts";

export type {
  CallbackFunction,
  CallbackMessage,
  RenderOptions as Options,
} from "./options.ts";

/*
  The single public API which translates Rimu Markup to HTML:

    render(source [, options])
 */
export function render(
  source: string,
  opts: Options.RenderOptions = {},
): string {
  Options.updateOptions(opts);
  return Document.render(source);
}

// Load-time initialization.
Document.init();
