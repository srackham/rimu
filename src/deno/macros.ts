import * as Options from "./options.ts";
import * as Spans from "./spans.ts";

// Matches a line starting with a macro invocation. $1 = macro invocation.
export const MATCH_LINE = /^({(?:[\w\-]+)(?:[!=|?](?:|.*?[^\\]))?}).*$/;
// Match single-line macro definition. $1 = name, $2 = delimiter, $3 = value.
export const LINE_DEF = /^\\?{([\w\-]+\??)}\s*=\s*(['`])(.*)\2$/;
// Match multi-line macro definition literal value open delimiter. $1 is first line of macro.
export const LITERAL_DEF_OPEN = /^\\?{[\w\-]+\??}\s*=\s*'(.*)$/;
export const LITERAL_DEF_CLOSE = /^(.*)'$/;
// Match multi-line macro definition expression value open delimiter. $1 is first line of macro.
export const EXPRESSION_DEF_OPEN = /^\\?{[\w\-]+\??}\s*=\s*`(.*)$/;
export const EXPRESSION_DEF_CLOSE = /^(.*)`$/;

export interface Macro {
  name: string;
  value: string;
}

export let defs: Macro[] = [];

// Reset definitions to defaults.
export function init(): void {
  // Initialize predefined macros.
  defs = [
    { name: "--", value: "" },
    { name: "--header-ids", value: "" }
  ];
}

// Return named macro value or null if it doesn't exist.
export function getValue(name: string): string | null {
  for (let def of defs) {
    if (def.name === name) {
      return def.value;
    }
  }
  return null;
}

// Set named macro value or add it if it doesn't exist.
// If the name ends with '?' then don't set the macro if it already exists.
// `quote` is a single character: ' if a literal value, ` if an expression value.
export function setValue(name: string, value: string, quote: string): void {
  if (Options.skipMacroDefs()) {
    return; // Skip if a safe mode is set.
  }
  let existential = false;
  if (name.slice(-1) === "?") {
    name = name.slice(0, -1);
    existential = true;
  }
  if (name === "--" && value !== "") {
    Options.errorCallback(
      "the predefined blank '--' macro cannot be redefined"
    );
    return;
  }
  if (quote === "`") {
    try {
      value = eval(value); // tslint:disable-line no-eval
    } catch (e) {
      Options.errorCallback(
        `illegal macro expression: ${e.message}: ${value}`
      );
    }
  }
  for (let def of defs) {
    if (def.name === name) {
      if (!existential) {
        def.value = value;
      }
      return;
    }
  }
  defs.push({ name: name, value: value });
}

// Render macro invocations in text string.
// Render Simple invocations first, followed by Parametized, Inclusion and Exclusion invocations.
export function render(text: string, silent: boolean = false): string {
  const MATCH_COMPLEX = /\\?{([\w\-]+)([!=|?](?:|[^]*?[^\\]))}/g; // Parametrized, Inclusion and Exclusion invocations.
  const MATCH_SIMPLE = /\\?{([\w\-]+)()}/g; // Simple macro invocation.
  let result = text;
  [MATCH_SIMPLE, MATCH_COMPLEX].forEach(find => {
    result = result.replace(
      find,
      function(match: string, ...submatches: string[]): string {
        if (match[0] === "\\") {
          return match.slice(1);
        }
        let name = submatches[0];
        let params = submatches[1] || "";
        if (params[0] === "?") { // DEPRECATED: Existential macro invocation.
          if (!silent) {
            Options.errorCallback(
              "existential macro invocations are deprecated: " + match
            );
          }
          return match;
        }
        let value = getValue(name); // Macro value is null if macro is undefined.
        if (value === null) {
          if (!silent) {
            Options.errorCallback("undefined macro: " + match + ": " + text);
          }
          return match;
        }
        if (find === MATCH_SIMPLE) {
          return value;
        }
        params = params.replace(/\\}/g, "}"); // Unescape escaped } characters.
        switch (params[0]) {
          case "|": // Parametrized macro.
            let paramsList = params.slice(1).split("|");
            // Substitute macro parameters.
            // Matches macro definition formal parameters [$]$<param-number>[[\]:<default-param-value>$]
            // [$]$ = 1st match group; <param-number> (1, 2..) = 2nd match group;
            // :[\]<default-param-value>$ = 3rd match group; <default-param-value> = 4th match group.
            const PARAM_RE = /\\?(\$\$?)(\d+)(\\?:(|[^]*?[^\\])\$)?/g;
            value = (value || "").replace(
              PARAM_RE,
              function(
                match: string,
                p1: string,
                p2: string,
                p3: string | undefined,
                p4: string
              ): string {
                if (match[0] === "\\") { // Unescape escaped macro parameters.
                  return match.slice(1);
                }
                if (Number(p2) === 0) {
                  return match; // $0 is not a valid parameter name.
                }
                let param: string | undefined = paramsList[Number(p2) - 1];
                param = param === undefined ? "" : param; // Unassigned parameters are replaced with a blank string.
                if (p3 !== undefined) {
                  if (p3[0] === "\\") { // Unescape escaped default parameter.
                    param += p3.slice(1);
                  } else {
                    if (param === "") {
                      param = p4; // Assign default parameter value.
                      param = param.replace(/\\\$/g, "$"); // Unescape escaped $ characters in the default value.
                    }
                  }
                }
                if (p1 === "$$") {
                  param = Spans.render(param);
                }
                return param;
              }
            );
            return value;
          case "!": // Exclusion macro.
          case "=": // Inclusion macro.
            let pattern = params.slice(1);
            let skip = false;
            try {
              skip = !RegExp("^" + pattern + "$").test(value || "");
            } catch {
              if (!silent) {
                Options.errorCallback(
                  "illegal macro regular expression: " + pattern + ": " + text
                );
              }
              return match;
            }
            if (params[0] === "!") {
              skip = !skip;
            }
            return skip ? "\u0002" : ""; // Flag line for deletion.
          default:
            Options.errorCallback("illegal macro syntax: " + match[0]);
            return "";
        }
      }
    );
  });
  // Delete lines flagged by Inclusion/Exclusion macros.
  if (result.indexOf("\u0002") !== -1) {
    result = result.split("\n")
      .filter(line => line.indexOf("\u0002") === -1)
      .join("\n");
  }
  return result;
}
