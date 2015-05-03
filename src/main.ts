/**
 * ### Rimu Modularization
 * TODO
 *
 * - This application uses Internal TypeScript modules and is compiled to a single rimu.js
 *   JavaScript file.
 * - `rimu.js` can be used in the browser using a script tag or can be used in Nodejs using require().
 * - Rimu API functions are explicitly exported to Nodejs with the exportCommonjs() helper.
 * - Other internal objects are exported to Nodejs for use by nodeunit unit tests.
 * - To minimize browser global namespace pollution and to disallow run-time access to internal
 *   objects all source is enveloped in a single open module named [[Rimu]].
 *
 * See [Building heterogeneous TypeScript libraries](http://srackham.wordpress.com/2012/11/20/building-heterogeneous-typescript-libraries/)
 *
 */

import {renderSource} from './render'
import * as options from './options'
import * as quotes from './quotes'

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
 *     Rimu.render('Hello *Rimu*!', {safeMode: 1});
 *
 * See `rimuc.js` and `rimuplayground.html` for examples of [[render]]  in action.
 *
 */
export function render(source: string, opts: options.RenderOptions = {}): string {
  options.update(opts);
  return renderSource(source);
}

// Load-time initializations.
quotes.initialize();

