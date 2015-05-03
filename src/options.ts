/* tslint:disable */
import * as helpers from './helpers'
/* tslint:enable */

/**
 * An object with zero or more optional properties to control Rimu Markup
 * translation in the [[render]] API.
 */
export interface RenderOptions {
  /**
   * This option is an integer value that controls how Rimu
   * renders embedded HTML.
   *
   * Allowed values:
   *
   * _0_: Render the raw HTML (default behavior).<br>
   * _1_: Delete the HTML.<br>
   * _2_: Replace the HTML with the 'htmlReplacement' option string.<br>
   * _3_: Render HTML as text.
   *
   */
  safeMode?: number;
  /**
   * A string that replaces embedded HTML in the output when
   * _safeMode_ has the value _2_. Defaults to `<mark>replaced HTML</mark>`.
   *
   */
  htmlReplacement?: string;
}

// Option values.
export var safeMode: number;
export var htmlReplacement: string;

/**
 * Set options to values in 'options', those not in 'options' are set to their default value.
 *
 * @param options
 */
export function update(options: RenderOptions): void {
  safeMode = ('safeMode' in options) ? options.safeMode : 0;
  htmlReplacement = ('htmlReplacement' in options) ? options.htmlReplacement : '<mark>replaced HTML</mark>';
}

/**
 * Filter HTML based on current [[safeMode]].
 */
export function safeModeFilter(html: string): string {
  switch (safeMode) {
    case 0:   // Raw HTML (default behavior).
      return html;
    case 1:   // Drop HTML.
      return '';
    case 2:   // Replace HTML with 'htmlReplacement' option string.
      return htmlReplacement;
    case 3:   // Render HTML as text.
      return helpers.replaceSpecialChars(html);
    default:
      throw 'illegal safeMode value';
  }
}

update({});   // Initialize options to default values.

