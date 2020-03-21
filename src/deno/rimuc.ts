/*
  Command-lne app to convert Rimu source to HTML.
*/

import {
  existsSync,
  readFileStrSync,
  writeFileStrSync
} from "https://deno.land/std@v0.36.0/fs/mod.ts";
import { resolve } from "https://deno.land/std@v0.36.0/path/mod.ts";
import { resources } from "./resources.ts";
import * as rimu from "./rimu.ts";

const VERSION = "11.1.8";
const STDIN = "/dev/stdin";
const HOME_DIR = Deno.env(Deno.build.os === "win" ? "USERPROFILE" : "HOME");
const RIMURC = resolve(HOME_DIR || "", ".rimurc");

/*
 * Helpers.
 */

function die(message: string): void {
  console.error(message);
  Deno.exit(1);
}

function readResourceFile(name: string): string {
  if (!(name in resources)) {
    die(`missing resource: ${name}`);
  }
  // Restore all backticks.
  let result = resources[name].split("\\x60").join("`");
  // Restore all backslashes.
  result = resources[name].split("\\x5C").join("\\");
  return result;
}

let safe_mode = 0;
let html_replacement: string | undefined;
let layout = "";
let no_rimurc = false;
let prepend_files: string[] = [];
let pass = false;

// Parse command-line options.
let prepend = "";
let outfile: string | undefined;
let arg: string | undefined;
let argv = [...Deno.args];
outer:
while (!!(arg = argv.shift())) {
  switch (arg) {
    case "--": // Ignore this option (see https://github.com/denoland/deno/issues/3795).
      break;
    case "--help":
    case "-h":
      console.log("\n" + readResourceFile("manpage.txt"));
      Deno.exit();
      break;
    case "--version":
      console.log(VERSION);
      Deno.exit();
      break;
    case "--lint": // Deprecated in Rimu 10.0.0
    case "-l":
      break;
    case "--output":
    case "-o":
      outfile = argv.shift();
      if (!outfile) {
        die("missing --output file name");
      }
      break;
    case "--pass":
      pass = true;
      break;
    case "--prepend":
    case "-p":
      prepend += argv.shift() + "\n";
      break;
    case "--prepend-file":
      let prepend_file = argv.shift();
      if (!prepend_file) {
        die("missing --prepend-file file name");
      }
      prepend_files.push(prepend_file!);
      break;
    case "--no-rimurc":
      no_rimurc = true;
      break;
    case "--safe-mode":
    case "--safeMode": // Deprecated in Rimu 7.1.0.
      safe_mode = parseInt(argv.shift() || "99", 10);
      if (safe_mode < 0 || safe_mode > 15) {
        die("illegal --safe-mode option value");
      }
      break;
    case "--html-replacement":
    case "--htmlReplacement": // Deprecated in Rimu 7.1.0.
      html_replacement = argv.shift();
      break;
    // Styling macro definitions shortcut options.
    case "--highlightjs":
    case "--mathjax":
    case "--section-numbers":
    case "--theme":
    case "--title":
    case "--lang":
    case "--toc": // Deprecated in Rimu 8.0.0
    case "--no-toc":
    case "--sidebar-toc": // Deprecated in Rimu 10.0.0
    case "--dropdown-toc": // Deprecated in Rimu 10.0.0
    case "--custom-toc":
    case "--header-ids":
    case "--header-links":
      let macro_value = ["--lang", "--title", "--theme"].indexOf(arg) > -1
        ? argv.shift()
        : "true";
      prepend += "{" + arg + "}='" + macro_value + "'\n";
      break;
    case "--layout":
    case "--styled-name": // Deprecated in Rimu 10.0.0
      layout = argv.shift() || "";
      if (!layout) {
        die("missing --layout");
      }
      prepend += "{--header-ids}='true'\n";
      break;
    case "--styled":
    case "-s":
      prepend += "{--header-ids}='true'\n";
      prepend += "{--no-toc}='true'\n";
      layout = "sequel";
      break;
    default:
      argv.unshift(arg); // argv contains source file names.
      break outer;
  }
}
// argv contains the list of source files.
let files = argv;
if (files.length === 0) {
  files.push(STDIN);
} else if (
  files.length === 1 &&
  layout !== "" &&
  files[0] !== "-" &&
  !outfile
) {
  // Use the source file name with .html extension for the output file.
  outfile = files[0].substr(0, files[0].lastIndexOf(".")) + ".html";
}
const RESOURCE_TAG = "resource:"; // Tag for resource files.
const PREPEND = "--prepend options";
if (layout !== "") {
  // Envelope source files with header and footer.
  files.unshift(`${RESOURCE_TAG}${layout}-header.rmu`);
  files.push(`${RESOURCE_TAG}${layout}-footer.rmu`);
}
// Prepend $HOME/.rimurc file if it exists.
if (!no_rimurc && existsSync(RIMURC)) {
  prepend_files.unshift(RIMURC);
}
if (prepend !== "") {
  prepend_files.push(PREPEND);
}
files = prepend_files.concat(files);
// Convert Rimu source files to HTML.
let output = "";
let errors = 0;
let options: rimu.Options = {};
if (html_replacement !== undefined) {
  options.htmlReplacement = html_replacement;
}
for (let infile of files) {
  if (infile === "-") {
    infile = STDIN;
  }
  let source = "";
  if (infile.startsWith(RESOURCE_TAG)) {
    infile = infile.substr(RESOURCE_TAG.length);
    source = readResourceFile(infile);
    options.safeMode = 0; // Resources are trusted.
  } else if (infile === PREPEND) {
    source = prepend;
    options.safeMode = 0; // --prepend options are trusted.
  } else {
    if (infile === STDIN) {
      try {
        source = new TextDecoder().decode(Deno.readAllSync(Deno.stdin));
      } catch (e) {
        die(`error reading stdin: ${e.message}`);
      }
    } else {
      if (!existsSync(infile)) {
        die("source file does not exist: " + infile);
      }
      try {
        source = readFileStrSync(infile);
      } catch (e) {
        die("source file permission denied: " + infile);
      }
    }
    // Prepended and ~/.rimurc files are trusted.
    options.safeMode = prepend_files.indexOf(infile) > -1 ? 0 : safe_mode;
  }
  let ext = infile.split(".").pop();
  // Skip .html and pass-through inputs.
  if (!(ext === "html" || (pass && infile === STDIN))) {
    options.callback = function(message): void {
      let msg = message.type + ": " + infile + ": " + message.text;
      if (msg.length > 120) {
        msg = msg.slice(0, 117) + "...";
      }
      console.error(msg);
      if (message.type === "error") {
        errors += 1;
      }
    };
    source = rimu.render(source, options);
  }
  source = source.trim();
  if (source !== "") {
    output += source + "\n";
  }
}
output = output.trim();
if (!outfile || outfile === "-") {
  Deno.stdout.writeSync(new TextEncoder().encode(output));
} else {
  writeFileStrSync(outfile, output);
}
if (errors) {
  Deno.exit(1);
}
