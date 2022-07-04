// deno-lint-ignore-file no-explicit-any

import * as Macros from "./macros";
import * as Options from "./options";
import * as Spans from "./spans";

export interface ExpansionOptions {
  [key: string]: boolean | undefined;

  // Processing priority (highest to lowest): container, skip, spans and specials.
  // If spans is true then both spans and specials are processed.
  // They are assumed false if they are not explicitly defined.
  // If a custom filter is specified their use depends on the filter.
  macros?: boolean;
  container?: boolean;
  skip?: boolean;
  spans?: boolean; // Span substitution also expands special characters.
  specials?: boolean;
}

// http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
export function escapeRegExp(s: string): string {
  return s.replace(/[\-\/\\^$*+?.()|\[\]{}]/g, "\\$&");
}

export function replaceSpecialChars(s: string): string {
  return s.replace(/&/g, "&amp;")
    .replace(/>/g, "&gt;")
    .replace(/</g, "&lt;");
}

// Replace pattern '$1' or '$$1', '$2' or '$$2'... in `replacement` with corresponding match groups
// from `match`. If pattern starts with one '$' character add specials to `expansionOptions`,
// if it starts with two '$' characters add spans to `expansionOptions`.
export function replaceMatch(
  match: RegExpExecArray,
  replacement: string,
  expansionOptions: ExpansionOptions = {},
): string {
  return replacement.replace(/(\${1,2})(\d)/g, function (): string {
    // Replace $1, $2 ... with corresponding match groups.
    if (arguments[1] === "$$") {
      expansionOptions.spans = true;
    } else {
      expansionOptions.specials = true;
    }
    const i = Number(arguments[2]); // match group number.
    const result = match[i]; // match group text.
    if (result === undefined) {
      Options.errorCallback("undefined replacement group: " + arguments[0]);
      return "";
    }
    return replaceInline(result, expansionOptions);
  });
}

// Shallow object clone.
export function copy(source: any): any {
  const result: any = {};
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key];
    }
  }
  return result;
}

// Copy properties in source object to target object.
export function merge(target: any, source: any): void {
  for (const key in source) {
    target[key] = source[key];
  }
}

// Replace the inline elements specified in options in text and return the result.
export function replaceInline(
  text: string,
  expansionOptions: ExpansionOptions,
): string {
  if (expansionOptions.macros) {
    text = Macros.render(text);
  }
  // Spans also expand special characters.
  if (expansionOptions.spans) {
    text = Spans.render(text);
  } else if (expansionOptions.specials) {
    text = replaceSpecialChars(text);
  }
  return text;
}
