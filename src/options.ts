/* tslint:disable */
import * as utils from './utils'
/* tslint:enable */

/**
 * An object with zero or more optional properties to control Rimu Markup
 * translation in the render() API.
 */
export interface RenderOptions {
  safeMode?: number
  htmlReplacement?: string
  macroMode?: number
}

// Global ption values.
export var safeMode: number
export var htmlReplacement: string
export var macroMode: number

// Set options to values in 'options', those not in 'options' are set to their default value.
export function update(options: RenderOptions): void {
  safeMode = ('safeMode' in options) ? options.safeMode : 0
  htmlReplacement = ('htmlReplacement' in options) ? options.htmlReplacement : '<mark>replaced HTML</mark>'
  macroMode = ('macroMode' in options) ? options.macroMode : 4
}

// Set named option value.
export function setOptionValue(name: string, value: any): void {
  switch (name) {
    case 'safeMode':
      /* tslint:disable */
      isNaN(value = parseInt(value, 10)) || value < 0 || value > 3 || (safeMode = value)
      /* tslint:enable */
      break
    case 'macroMode':
      /* tslint:disable */
      isNaN(value = parseInt(value, 10)) || value < 0 || value > 4 || (macroMode = value)
      /* tslint:enable */
      break
    case 'htmlReplacement':
      htmlReplacement = value
      break
  }
}

// Filter HTML based on current [[safeMode]].
export function safeModeFilter(html: string): string {
  switch (safeMode) {
    case 0:   // Raw HTML (default behavior).
      return html
    case 1:   // Drop HTML.
      return ''
    case 2:   // Replace HTML with 'htmlReplacement' option string.
      return htmlReplacement
    case 3:   // Render HTML as text.
      return utils.replaceSpecialChars(html)
    default:
      throw 'illegal safeMode value'
  }
}

update({})    // Initialize options to default values.

