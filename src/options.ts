module Rimu.Options {

  export interface Values {
    safeMode?: number;
    htmlReplacement?: string;
  }

  // Option values.
  export var safeMode: number;
  export var htmlReplacement: string;

  // Set options to values in 'options', those not in 'options' are set to
  // their default value.
  export function update(options: Values): void {
    safeMode = ('safeMode' in options) ? options.safeMode : 0;
    htmlReplacement = ('htmlReplacement' in options) ? options.htmlReplacement : '<mark>replaced HTML<mark>';
  }

  export function safeModeFilter(text: string): string {
    switch (safeMode) {
      case 0:   // Raw HTML (default behavior).
        return text;
      case 1:   // Drop HTML.
        return '';
      case 2:   // Replace HTML with 'htmlReplacement' option string.
        return htmlReplacement;
      case 3:   // Render HTML as text.
        return replaceSpecialChars(text);
      default:
        throw 'illegal safeMode value';
    }
  }

  update({});   // Initialize options to default values.

}
