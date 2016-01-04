/*
 This is the main module, it exports the 'render' API.

 The compiled modules are bundled by Webpack into 'var' (script tag) and 'commonjs' (npm)
 formatted libraries.
 */

import * as api from './api'
import * as options from './options'

/*
  The single public API which translates Rimu Markup to HTML:

    render(source [, options])
 */
export function render(source: string, opts: options.RenderOptions = {}): string {
  if (typeof source !== 'string') {
    throw new TypeError('render(): source argument is not a string')
  }
  if (opts !== undefined && typeof opts !== 'object') {
    throw new TypeError('render(): options argument is not an object')
  }
  options.updateOptions(opts)
  return api.render(source)
}

// Load-time initialization.
api.reset()

