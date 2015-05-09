/*
  This is the main module, it exports the 'render' API.

  The compiled modules are bundled by Webpack into 'var' (script tag) and 'commonjs' (npm)
  formatted libraries.
 */

/* tslint:disable */
import {renderSource} from './render'
import * as options from './options'
import * as quotes from './quotes'
/* tslint:enable */

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
export function render(source: string, opts: options.RenderOptions = {}): string {
  if (typeof source !== 'string') {
    throw new TypeError('render(): source argument is not a string')
  }
  if (opts !== undefined && typeof opts !== 'object') {
    throw new TypeError('render(): options argument is not an object')
  }
  options.update(opts)
  return renderSource(source)
}

// Load-time initializations.
quotes.initialize()

