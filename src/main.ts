/*
 This is the main module, it exports the 'render' API.

 The compiled modules are bundled by Webpack into 'var' (script tag) and 'commonjs' (npm)
 formatted libraries.
 */

import * as api from './api'
import * as options from './options'

/*
  This is the single public API which translates Rimu Markup to HTML:

    render(source [, options] [, callback])
*/

export function render(source: string, ...args: any[]): string {
  if (typeof source !== 'string') {
    throw new TypeError('render(): first argument is not a string')
  }
  let arg: any
  let opts: options.RenderOptions = {}
  let callback: Function
  args = args.slice(0, 2)   // Only process first two.
  while (arg = args.shift()) {
    switch (typeof arg) {
      case 'object':
        opts = arg
        break
      case 'function':
        callback = arg
        break
      default:
        throw new TypeError('render(): optional second and third arguments must be an object or a function')
    }
  }
  api.callback = callback
  options.updateOptions(opts)
  return api.render(source)
}

// Load-time initialization.
api.reset()

