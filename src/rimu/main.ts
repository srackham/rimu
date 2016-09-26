/*
 This is the main module, it exports the 'render' API.

 The compiled modules are bundled by Webpack into 'var' (script tag) and 'commonjs' (npm)
 formatted libraries.
 */

import * as Api from './api'
import * as Options from './options'

/*
  The single public API which translates Rimu Markup to HTML:

    render(source [, options])
 */
export function render(source: string, opts: Options.RenderOptions = {}): string {
  if (typeof source !== 'string') {
    throw new TypeError('render(): source argument is not a string')
  }
  if (opts !== undefined && typeof opts !== 'object') {
    throw new TypeError('render(): options argument is not an object')
  }
  Options.updateOptions(opts)
  return Api.render(source)
}

// Load-time initialization.
Api.reset()

