// deno-lint-ignore-file no-explicit-any

/*
 * Drakefile for Rimu Markup (http://github.com/srackham/rimu).
 */

import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import {
  abort,
  desc,
  env,
  glob,
  quote,
  readFile,
  remove,
  run,
  sh,
  task,
  updateFile,
  writeFile,
} from "https://deno.land/x/drake@v1.7.0/mod.ts";

const isWindows = Deno.build.os === "windows";

/* Inputs and outputs */

const ALL_TS_SRC = glob("*.ts", "src/**/*.ts", "test/*.ts");
const GALLERY_INDEX_DST = "docs/gallery.html";
const GALLERY_INDEX_SRC = "docsrc/gallery.rmu";
const DOCS_INDEX = "docs/index.html";
const DOCS_SRC = glob("README.md", "docsrc/*.rmu", "src/**/*.rmu");
const MANPAGE_RMU = "docsrc/manpage.rmu";
const MANPAGE_TXT = "src/resources/manpage.txt";
const PKG_FILE = "package.json";
const RESOURCE_FILES = glob("src/resources/*");
const DENO_RESOURCES_TS = "src/deno/resources.ts";
const NODE_RIMUC_TS = "src/node/rimuc.ts";
const NODE_RIMUC_BIN = "lib/cjs/rimuc.js";
const NODE_TS_SRC = glob("src/node/*.ts");
const DENO_TS_SRC = glob("src/deno/*.ts");
const DENO_RIMUC_TS = "src/deno/rimuc.ts";
const ESM_RIMU_JS = "lib/esm/rimu.js";
const MIN_RIMU_JS = "lib/esm/rimu.min.js";
const RIMUC_EXE = `deno run -A ${DENO_RIMUC_TS}`;
const TEST_EXE = `deno test -A`;
const TSC_EXE = "./node_modules/.bin/tsc";
const TERSER_EXE = "./node_modules/.bin/terser";
const ROLLUP_EXE = "./node_modules/.bin/rollup";

const DOCS = [
  {
    src: "README.md",
    dst: "docs/index.html",
    title: "Rimu Markup",
    rimucOptions: "--highlightjs",
  },
  {
    src: "docsrc/changelog.rmu",
    dst: "docs/changelog.html",
    title: "Rimu Change Log",
    rimucOptions: "--highlightjs",
  },
  {
    src: "docsrc/reference.rmu",
    dst: "docs/reference.html",
    title: "Rimu Reference",
    rimucOptions:
      "--highlightjs --prepend \"{generate-examples}='yes'\" --prepend-file " +
      MANPAGE_RMU,
  },
  {
    src: "docsrc/tips.rmu",
    dst: "docs/tips.html",
    title: "Rimu Tips",
    rimucOptions:
      "--highlightjs --mathjax --prepend \"{generate-examples}='yes'\"",
  },
  {
    src: "docsrc/rimuplayground.rmu",
    dst: "docs/rimuplayground.html",
    title: "Rimu Playground",
    rimucOptions: "--prepend \"{generate-examples}='yes'\"",
  },
  {
    src: GALLERY_INDEX_SRC,
    dst: GALLERY_INDEX_DST,
    title: "Rimu layout and themes gallery",
    rimucOptions: "",
  },
];
const HTML = DOCS.map((doc) => doc.dst);

/*
 Tasks
 */

desc(
  "build and test Rimu modules and CLIs for Deno and Node.js; build Rimu documentation",
);
task("build", [
  "lint",
  "fmt",
  "build-resources",
  "build-node",
  "build-libs",
  "build-docs",
]);

desc(
  "Compile Node TypeScript source to CommonJS (for Node.js), ES modules and bundled ES modules (for browser)",
);
task("build-libs", [NODE_RIMUC_BIN]);
task(
  NODE_RIMUC_BIN,
  NODE_TS_SRC,
  async function () {
    remove("./lib/cjs/*", "./lib/esm/*");
    // Compile to JavaScript ES modules and CommonJS modules.
    await sh(
      [`${TSC_EXE} -p tsconfig.json`, `${TSC_EXE} -p tsconfig-cjs.json`],
    );
    // Add .js extension to ES module path names.
    // See https://stackoverflow.com/questions/45932526/how-to-make-typescript-output-valid-es6-module-import-statements
    for (const f of glob("lib/esm/*.js")) {
      addModulePathExt(f, f, ".js");
    }
    // Add shebang line to Node.js rimuc executable.
    const src = readFile(NODE_RIMUC_BIN);
    writeFile(NODE_RIMUC_BIN, `#!/usr/bin/env node\n${src}`);
    if (!isWindows) {
      Deno.chmodSync(NODE_RIMUC_BIN, 0o755);
    }
    // Bundle and minimise Rimu web browser ES module.
    await sh(
      `${ROLLUP_EXE} --silent --format esm  --file ${MIN_RIMU_JS} ${ESM_RIMU_JS}`,
    );
    await sh(`${TERSER_EXE} ${MIN_RIMU_JS} --output ${MIN_RIMU_JS}`);
  },
);

// Add a file extension to TypeScript/JavaScript import/export module paths.
function addModulePathExt(
  inFile: string,
  outFile: string,
  ext: string,
): void {
  let text = readFile(inFile);
  text = text.replace(
    /^((import|export).*from ".*)";/gm,
    `$1${ext}";`,
  );
  text = text.replace(
    /^(} from ".*)";/gm,
    `$1${ext}";`,
  );
  writeFile(outFile, text);
}

// Remove a file extension from TypeScript/JavaScript import/export module paths.
function removeModulePathExt(
  inFile: string,
  outFile: string,
): void {
  let text = readFile(inFile);
  text = text.replace(
    /^((import|export).*from ".*)\.ts";/gm,
    `$1";`,
  );
  text = text.replace(
    /^(} from ".*)\.ts";/gm,
    `$1";`,
  );
  writeFile(outFile, text);
}

// Create tasks for Node source files.
// Remove .ts extension from Deno TypeScript module paths and copy to Node source directory.
const NODE_BUILD_FILES: string[] = [];
for (const prereq of glob("src/deno/!(rimuc|deps).ts")) {
  const target = path.join("src/node", path.basename(prereq));
  task(target, [prereq], function () {
    removeModulePathExt(this.prereqs[0], this.name);
  });
  NODE_BUILD_FILES.push(target);
}

desc(
  "Copy Deno TypeScript source files to Node source directory removing .ts extensions from imported module names",
);
task("build-node", NODE_BUILD_FILES);

desc("Install executable wrapper for rimudeno CLI");
task("install-deno", [], async function () {
  await sh(
    `deno install -A --force --name rimudeno "${DENO_RIMUC_TS}"`,
  );
});

desc("Run rimu and rimuc CLI tests on Deno and NodeJS");
task("test", ["build"], async function () {
  await sh(`${TEST_EXE} test/`);
});

// Generate manpage.rmu
task(MANPAGE_RMU, [MANPAGE_TXT], function () {
  // Trailing apostrophes are escaped in MANPAGE_TXT.
  writeFile(
    MANPAGE_RMU,
    `// Generated automatically by DrakeFile.ts, do not edit.
.-macros
{manpage} = '
\`\`
${readFile(MANPAGE_TXT).replace(/^(.*)'$/gm, "$1'\\")}
\`\`
'
`,
  );
});

desc("Build /.src/deno/resources.ts containing rimuc resource files");
task("build-resources", [DENO_RESOURCES_TS]);
task(DENO_RESOURCES_TS, RESOURCE_FILES, async function () {
  let text = "// Generated automatically from resource files. Do not edit.\n";
  text += "export const resources: { [name: string]: string } = {";
  for (const f of RESOURCE_FILES) {
    text += `  '${path.basename(f)}': `;
    let data = readFile(f);
    data = data.replace(/\\/g, "\\x5C"); // Escape backslash (unescaped at runtime).
    data = data.replace(/`/g, "\\x60"); //  Escape backticks (unescaped at runtime).
    text += `String.raw\`${data}\`,\n`;
  }
  text += "};";
  writeFile(DENO_RESOURCES_TS, text);
  await sh(`deno fmt --quiet "${DENO_RESOURCES_TS}"`, { stdout: "null" });
});

desc("Generate documentation");
task("build-docs", ["build-libs", DOCS_INDEX]);
task(
  DOCS_INDEX,
  [
    ...DOCS_SRC,
    GALLERY_INDEX_DST,
    ...DENO_TS_SRC,
  ],
  async function () {
    await Deno.copyFile(
      MIN_RIMU_JS,
      `docs/${path.basename(MIN_RIMU_JS)}`,
    );
    await Deno.copyFile(
      "docsrc/image-1.jpg",
      `docs/image-1.jpg`,
    );
    await Deno.copyFile(
      "docsrc/image-2.jpg",
      `docs/image-2.jpg`,
    );
    let commands: any[] = [];
    commands = DOCS.map((doc) =>
      RIMUC_EXE +
      " --no-rimurc --theme legend --custom-toc --header-links" +
      " --layout sequel" +
      ' --output "' + doc.dst + '"' +
      " --lang en" +
      ' --title "' + doc.title + '"' +
      " " + doc.rimucOptions + " " +
      " examples/example-rimurc.rmu " + "docsrc/doc-header.rmu " +
      doc.src
    );
    if (isWindows) {
      commands = commands.map((cmd) => toPowerShellQuotes(cmd));
    }
    await sh(commands);
  },
);

// Generate gallery documentation examples.
task(
  GALLERY_INDEX_SRC,
  [
    ...DENO_TS_SRC,
    "examples/example-rimurc.rmu",
    "docsrc/doc-header.rmu",
    "docsrc/gallery-example-template.rmu",
  ],
  async function () {
    galleryIndex();
    let commands: any[] = [];
    forEachGalleryDocument(
      function (options: any, outfile: any, _: any, __: any) {
        const command = RIMUC_EXE +
          " --custom-toc" +
          " --no-rimurc" +
          " " + options +
          " --output docs/" + outfile +
          " --prepend \"{gallery-options}='" +
          options.replace(/(["{])/g, "\\$1") +
          "'\"" +
          " examples/example-rimurc.rmu" +
          " " + "docsrc/doc-header.rmu" +
          " " + "docsrc/gallery-example-template.rmu";
        commands.push(command);
      },
      null,
      null,
    );
    if (isWindows) {
      commands = commands.map((cmd) => toPowerShellQuotes(cmd));
    }
    await sh(commands);
  },
);

// Transform bash command-line quoting to PowerShell quoting.
// e.g.    "--prepend \"{--dropdown-toc}='yes'\""
// returns '--prepend "{--dropdown-toc}=''yes''"'
function toPowerShellQuotes(cmd: string): string {
  return cmd.replace(/'/g, "''")
    .replace(/\\"/g, "\u0000")
    .replace(/"/g, "'")
    // deno-lint-ignore no-control-regex
    .replace(/\u0000/g, '"');
}

function forEachGalleryDocument(
  documentCallback: any,
  layoutCallback: any,
  themeCallback: any,
) {
  ["sequel", "classic", "flex", "plain"].forEach(function (layout) {
    if (layoutCallback) layoutCallback(layout);
    if (layout === "plain") {
      documentCallback("--layout plain --no-toc", "plain-example.html");
      return;
    }
    ["legend", "vintage", "graystone"].forEach(function (theme) {
      if (themeCallback) themeCallback(layout, theme);
      ["", "dropdown-toc", "no-toc"].forEach(function (variant) {
        let option = variant;
        switch (variant) {
          case "dropdown-toc":
            if (layout !== "classic") return;
            else option = "--prepend \"{--dropdown-toc}='yes'\"";
            break;
          case "no-toc":
            option = "--no-toc";
            break;
        }
        let options = "--layout " + layout + " --theme " + theme + " " +
          option;
        options = options.trim();
        let outfile = layout + "-" + theme + "-" + variant + "-example.html";
        outfile = outfile.replace("--", "-");
        documentCallback(options, outfile, layout, theme);
      });
    });
  });
}

// Generate gallery index Rimu markup.
function galleryIndex() {
  let text = `# Rimu Gallery

Here are some examples of styled HTML documents generated using the
{rimuc} command \`--layout\` option.

Click the options links to view the generated documents.

See [Built-in layouts]({reference}#built-in-layouts) for more information.`;
  forEachGalleryDocument(
    function (options: any, outfile: any, _: any, __: any) {
      const link = "[`" + options.replace(/{/g, "\\{") + "`](" + outfile + ")";
      text += "\n- " + link;
    },
    function (layout: any) {
      text += "\n\n\n## " + layout + " layout";
    },
    function (_: any, theme: any) {
      text += "\n\n### " + theme + " theme";
    },
  );
  text += "\n\n";
  writeFile(GALLERY_INDEX_SRC, text);
}

// Validate HTML documents.
async function validateDocs() {
  const commands = HTML
    // 2018-11-09: Skip files with style tags in the body as Nu W3C validator treats style tags in the body as an error.
    .filter((f) =>
      !["reference", "tips", "rimuplayground"].map((f) => `docs/${f}.html`)
        .includes(f)
    )
    .map((file) => `html-validator --verbose --format=text --file=${file}`);
  await sh(commands, { stdout: env("--debug") ? "inherit" : "null" });
}

desc(
  "Validate HTML documentation",
);
task("validate-docs", [], async function () {
  await validateDocs();
});

function getPackageVers(): string {
  const match = readFile(PKG_FILE).match(/^\s*"version": "(\d+\.\d+\.\d+)"/m);
  if (match === null) {
    abort(`unable to find semantic version number in ${PKG_FILE}`);
  }
  return (match as RegExpMatchArray)[1];
}

desc(
  "Display or update the project version number. Set 'vers' to update version e.g. vers=1.0.0",
);
task("version", [], function () {
  const vers = env("vers");
  const currentVers = getPackageVers();
  if (!vers) {
    console.log(`version: ${currentVers}`);
  } else {
    if (!vers.match(/^\d+\.\d+\.\d+$/)) {
      abort(`invalid version number: ${vers}`);
    }
    if (vers === currentVers) {
      abort(`current version is ${vers}`);
    }
    if (
      !updateFile(
        "package.json",
        /(\s*"version"\s*:\s*)"\d+\.\d+\.\d+"/,
        `$1"${vers}"`,
      )
    ) {
      abort("version number not updated: package.json");
    }
    if (
      !updateFile(
        "package-lock.json",
        /(\s*"version"\s*:\s*)"\d+\.\d+\.\d+"/,
        `$1"${vers}"`,
      )
    ) {
      abort("version number not updated: package-lock.json");
    }
    if (
      !updateFile(
        NODE_RIMUC_TS,
        /(const VERSION = )"\d+\.\d+\.\d+"/,
        `$1"${vers}"`,
      )
    ) {
      abort(`version number not updated: ${NODE_RIMUC_TS}`);
    }
    if (
      !updateFile(
        DENO_RIMUC_TS,
        /(const VERSION = )"\d+\.\d+\.\d+"/,
        `$1"${vers}"`,
      )
    ) {
      abort(`version number not updated: ${DENO_RIMUC_TS}`);
    }
  }
});

desc("Create Git version tag using version number from package.json");
task("tag", ["test"], async function () {
  const vers = getPackageVers();
  console.log(`tag: ${vers}`);
  await sh(`git tag -a -m "Tag ${vers}" ${vers}`);
});

desc("Commit changes to local Git repo");
task("commit", ["test"], async function () {
  await sh("git commit -a");
});

desc("Push to Github and publish to npm");
task("publish", ["push", "publish-npm"]);

desc("Push changes to Github");
task("push", ["test", "validate-docs"], async function () {
  await sh("git push -u --tags origin master");
});

desc("Publish to npm");
task("publish-npm", ["test", "build-libs"], async function () {
  await sh("npm publish");
});

desc("Format source files with Deno");
task("fmt", [], async function () {
  await sh(
    `deno fmt --quiet ${quote(ALL_TS_SRC)}`,
  );
});

desc("Lint source files");
task("lint", [], async function () {
  await sh(`deno lint src/deno/ test/ Drakefile.ts`);
});

desc("Build and validate other Rimu ports");
task("validate-ports", [], async function () {
  await sh(`deno run -A ./test/validate-rimu-ports.ts`);
});

desc("Watch documentation source files and rebuild when they are updated");
task("docs-auto-build", [], async function () {
  await sh(`ls docsrc/* | entr deno run -A Drakefile.ts build-docs`);
});

run();
