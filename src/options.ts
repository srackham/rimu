import * as utils from './utils'
import * as api from './api'

/**
 * An object with zero or more optional properties to control Rimu Markup
 * translation in the render() API.
 */
export interface RenderOptions {
  safeMode?: number
  htmlReplacement?: string
  macroMode?: number
  reset?: boolean
}

// Global option values.
export let safeMode: number
export let htmlReplacement: string
export let macroMode: number

// Reset options to default values.
export function setDefaults(): void {
  safeMode = 0
  htmlReplacement = '<mark>replaced HTML</mark>'
  macroMode = 4
}

// Return true if set to a safe mode.
export function isSafe(): boolean {
  return safeMode !== 0
}

function setSafeMode(value: number|string): void {
  let n = Number(value)
  if (!isNaN(n) && n >= 0 && n <= 3) {
    safeMode = n
  }
}

function setMacroMode(value: number|string): void {
  let n = Number(value)
  if (!isNaN(n) && n >= 0 && n <= 4) {
    macroMode = n
  }
}

function setHtmlReplacement(value: string): void {
  htmlReplacement = value
}

function setReset(value: boolean|string): void {
  if (value === true || value === 'true') {
    api.reset()
  }
}

export function updateOptions(options: RenderOptions): void {
  if ('reset' in options) setReset(options.reset) // Reset takes priority.
  if ('safeMode' in options) setSafeMode(options.safeMode)
  if ('htmlReplacement' in options) setHtmlReplacement(options.htmlReplacement)
  if ('macroMode' in options) setMacroMode(options.macroMode)
}

// Set named option value.
export function setOption(name: string, value: any): void {
  let option: any = {}
  option[name] = value
  updateOptions(option)
}

// Filter HTML based on current safeMode.
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
  }
}

