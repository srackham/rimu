import * as Api from "./api.ts";
import * as Utils from "./utils.ts";

/**
 * An object with zero or more optional properties to control Rimu Markup
 * translation in the render() API.
 */
export interface RenderOptions {
  safeMode?: number;
  htmlReplacement?: string;
  reset?: boolean;
  callback?: CallbackFunction;
}

export interface CallbackMessage {
  type: string;
  text: string;
}

export type CallbackFunction = (message: CallbackMessage) => void;

// Global option values.
let safeMode: number;
let htmlReplacement: string;
let callback: CallbackFunction | undefined;

// Reset options to default values.
export function init(): void {
  safeMode = 0;
  htmlReplacement = "<mark>replaced HTML</mark>";
  callback = undefined;
}

// Return true if safeMode is non-zero.
export function isSafeModeNz(): boolean {
  return safeMode !== 0;
}

export function getSafeMode(): number {
  return safeMode;
}

// Return true if Macro Definitions are ignored.
export function skipMacroDefs(): boolean {
  /* tslint:disable:no-bitwise */
  return safeMode !== 0 && (safeMode & 0x8) === 0;
  /* tslint:enable:no-bitwise */
}

// Return true if Block Attribute elements are ignored.
export function skipBlockAttributes(): boolean {
  /* tslint:disable:no-bitwise */
  return (safeMode & 0x4) !== 0;
  /* tslint:enable:no-bitwise */
}

function setSafeMode(value: number | string | undefined): void {
  let n = Number(value);
  if (isNaN(n) || n < 0 || n > 15) {
    errorCallback("illegal safeMode API option value: " + value);
    return;
  }
  safeMode = n;
}

function setHtmlReplacement(value: string | undefined): void {
  if (value === undefined) return;
  htmlReplacement = value;
}

function setReset(value: boolean | string | undefined): void {
  if (value === false || value === "false") {
    return;
  } else if (value === true || value === "true") {
    Api.init();
  } else {
    errorCallback("illegal reset API option value: " + value);
  }
}

export function updateOptions(options: RenderOptions): void {
  for (let key in options) {
    switch (key) {
      case "reset":
      case "safeMode":
      case "htmlReplacement":
      case "callback":
        break;
      default:
        errorCallback("illegal API option name: " + key);
        return;
    }
  }
  if ("callback" in options) callback = options.callback; // Install callback first to ensure option errors are logged.
  if ("reset" in options) setReset(options.reset); // Reset takes priority.
  if ("callback" in options) callback = options.callback; // Install callback again in case it has been reset.
  if ("safeMode" in options) setSafeMode(options.safeMode);
  if ("htmlReplacement" in options) {
    setHtmlReplacement(
      options.htmlReplacement,
    );
  }
}

// Set named option value.
export function setOption(name: string, value: any): void {
  let option: any = {};
  option[name] = value;
  updateOptions(option);
}

// Filter HTML based on current safeMode.
export function htmlSafeModeFilter(html: string): string {
  /* tslint:disable:no-bitwise */
  switch (safeMode & 0x3) {
    /* tslint:enable:no-bitwise */
    case 0: // Raw HTML (default behavior).
      return html;
    case 1: // Drop HTML.
      return "";
    case 2: // Replace HTML with 'htmlReplacement' option string.
      return htmlReplacement;
    case 3: // Render HTML as text.
      return Utils.replaceSpecialChars(html);
    default:
      return "";
  }
}

export function errorCallback(message: string): void {
  if (callback) {
    callback({ type: "error", text: message });
  }
}

// Called when an unexpected program error occurs.
export function panic(message: string): void {
  let msg = "panic: " + message;
  console.error(msg);
  errorCallback(msg);
}
