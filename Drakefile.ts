/*
 * Drakefile for Rimu Markup (http://github.com/srackham/rimu).
 */

import * as path from "https://deno.land/std@v0.51.0/path/mod.ts";
import {
  abort,
  desc,
  env,
  glob,
  log,
  quote,
  readFile,
  run,
  sh,
  task,
  updateFile,
  writeFile,
} from "https://deno.land/x/drake@v1.0.0/mod.ts";

env("--default-task", "build");

const isWindows = Deno.build.os === "windows";

/* Inputs and outputs */

const GALLERY_INDEX_DST = "docs/gallery.html";
const GALLERY_INDEX_SRC = "docs/gallery.rmu";
const DOCS_INDEX = "docs/index.html";
const DOCS_SRC = glob("README.md", "docs/*.rmu", "src/**/*.rmu");
const MANPAGE_RMU = "docs/manpage.rmu";
const MANPAGE_TXT = "src/rimuc/resources/manpage.txt";
const PKG_FILE = "package.json";
const RESOURCE_FILES = glob("src/rimuc/resources/*");
const RESOURCES_SRC = "src/rimuc/resources.ts";
const RIMUC_JS = "bin/rimuc.js";
const RIMUC_TS_SRC = "src/rimuc/rimuc.ts";
const RIMU_JS = "lib/rimu.js";
const RIMU_MIN_JS = "lib/rimu.min.js";
const RIMU_TS_SRC = glob("src/rimu/*.ts");
const DENO_TS_SRC = RIMU_TS_SRC.map((f) =>
  path.join("src/deno", path.basename(f))
);
const DENO_RESOURCES_SRC = "src/deno/resources.ts";
const DENO_RIMUC_TS = "src/deno/rimuc.ts";
const RIMUC_EXE = "deno run -A " + DENO_RIMUC_TS;

const DOCS = [
  {
    src: "README.md",
    dst: "docs/index.html",
    title: "Rimu Markup",
    rimucOptions: "--highlightjs",
  },
  {
    src: "docs/changelog.rmu",
    dst: "docs/changelog.html",
    title: "Rimu Change Log",
    rimucOptions: "",
  },
  {
    src: "docs/reference.rmu",
    dst: "docs/reference.html",
    title: "Rimu Reference",
    rimucOptions:
      "--highlightjs --prepend \"{generate-examples}='yes'\" --prepend-file " +
      MANPAGE_RMU,
  },
  {
    src: "docs/tips.rmu",
    dst: "docs/tips.html",
    title: "Rimu Tips",
    rimucOptions:
      "--highlightjs --mathjax --prepend \"{generate-examples}='yes'\"",
  },
  {
    src: "docs/rimuplayground.rmu",
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

desc("build and test rimu, rimuc CLI for Deno and Nodejs and documentation");
task("build", ["build-rimu", "build-rimuc", "build-deno", "build-docs"]);

desc("Compile, bundle and test rimu.js and rimu.min.js UMD library modules");
task("build-rimu", [RIMU_JS]);
task(
  RIMU_JS,
  [...RIMU_TS_SRC, "src/rimu/webpack.config.js"],
  async function () {
    await sh(
      "webpack --silent --mode production --config src/rimu/webpack.config.js",
    );
    await sh("deno test -A --unstable test/rimu_test.ts");
  },
);

desc("Compile and test rimuc to JavaScript executable");
task("build-rimuc", [RIMUC_JS]);
task(
  RIMUC_JS,
  [RIMUC_TS_SRC, RIMU_JS, RESOURCES_SRC, "src/rimuc/webpack.config.js"],
  async function () {
    await sh(
      "webpack --silent --mode production --config src/rimuc/webpack.config.js",
    );
    if (!isWindows) {
      Deno.chmodSync(RIMUC_JS, 0o755);
    }
    await sh(
      "deno test -A --unstable test/rimuc_test.ts",
      { env: { RIMU_BUILD_TARGET: "node" } },
    );
  },
);

// Create tasks for Deno source files.
// Deno TypeScript module names must be specified with a .ts extension. Add a
// .ts extension to TypeScript module names and copy to Deno source directory.
for (const i in DENO_TS_SRC) {
  task(DENO_TS_SRC[i], [RIMU_TS_SRC[i]], function () {
    let text = readFile(this.prereqs[0]);
    text = text.replace(
      /^((import|export).*from ".*)";/gm,
      '$1.ts";',
    );
    text = text.replace(
      /^(} from ".*)";/gm,
      '$1.ts";',
    );
    writeFile(this.name, text);
    log(`updated "${this.name}"`);
  });
}

desc(
  "Build Rimu Deno code in src/deno/",
);
task("build-deno", [DENO_RESOURCES_SRC, ...DENO_TS_SRC]);

desc("Install executable wrapper for rimudeno CLI");
task("install-deno", ["build-deno"], async function () {
  await sh(
    `deno install -A --force --name rimudeno "${DENO_RIMUC_TS}"`,
  );
});

desc("Run all rimu and rimuc CLI tests");
task("test", [], async function () {
  await sh("deno test -A --unstable test/");
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

// Build resources.ts containing rimuc resource files.
task(RESOURCES_SRC, RESOURCE_FILES, async function () {
  log(`Building resources ${RESOURCES_SRC}`);
  let text = "// Generated automatically from resource files. Do not edit.\n";
  text += "export let resources: { [name: string]: string } = {";
  for (const f of RESOURCE_FILES) {
    text += `  '${path.basename(f)}': `;
    let data = readFile(f);
    data = data.replace(/\\/g, "\\x5C"); // Escape backslash (unescaped at runtime).
    data = data.replace(/`/g, "\\x60"); //  Escape backticks (unescaped at runtime).
    text += `String.raw\`${data}\`,\n`;
  }
  text += "};";
  writeFile(RESOURCES_SRC, text);
  await sh(`deno fmt "${RESOURCES_SRC}"`);
});

// Copy resources.ts to Deno source directory.
task(DENO_RESOURCES_SRC, [RESOURCES_SRC], function () {
  Deno.copyFileSync(RESOURCES_SRC, DENO_RESOURCES_SRC);
});

desc("Generate and validate documentation");
task("build-docs", [DOCS_INDEX]);
task(
  DOCS_INDEX,
  [
    MANPAGE_RMU,
    ...DOCS_SRC,
    GALLERY_INDEX_DST,
    RIMUC_JS,
    DENO_RIMUC_TS,
    ...DENO_TS_SRC,
  ],
  async function () {
    await Deno.copyFile(
      RIMU_MIN_JS,
      `docs/${path.basename(RIMU_MIN_JS)}`,
    );
    const commands = DOCS.map((doc) =>
      RIMUC_EXE +
      " --no-rimurc --theme legend --custom-toc --header-links" +
      " --layout sequel" +
      ' --output "' + doc.dst + '"' +
      " --lang en" +
      ' --title "' + doc.title + '"' +
      " " + doc.rimucOptions + " " +
      " src/examples/example-rimurc.rmu " + "docs/doc-header.rmu " +
      doc.src
    );
    await sh(commands);
    await validate_docs();
  },
);

// Generate gallery documentation examples.
task(
  GALLERY_INDEX_SRC,
  [
    RIMUC_JS,
    DENO_RIMUC_TS,
    ...DENO_TS_SRC,
    "src/examples/example-rimurc.rmu",
    "docs/doc-header.rmu",
    "docs/gallery-example-template.rmu",
  ],
  async function () {
    gallery_index();
    let commands: any[] = [];
    forEachGalleryDocument(
      function (options: any, outfile: any, _: any, __: any) {
        let command = RIMUC_EXE +
          " --custom-toc" +
          " --no-rimurc" +
          " " + options +
          " --output docs/" + outfile +
          " --prepend \"{gallery-options}='" +
          options.replace(/(["{])/g, "\\$1") +
          "'\"" +
          " src/examples/example-rimurc.rmu" +
          " " + "docs/doc-header.rmu" +
          " " + "docs/gallery-example-template.rmu";
        commands.push(command);
      },
      null,
      null,
    );
    await sh(commands);
  },
);

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
function gallery_index() {
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
async function validate_docs() {
  const commands = HTML
    // 2018-11-09: Skip files with style tags in the body as Nu W3C validator treats style tags in the body as an error.
    .filter((file) =>
      !["reference", "tips", "rimuplayground"].map((file) =>
        `docs/${file}.html`
      )
        .includes(file)
    )
    .map((file) => `html-validator --verbose --format=text --file=${file}`);
  await sh(commands);
}

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
task("version", [], async function () {
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
        "src/rimuc/rimuc.ts",
        /(const VERSION = )"\d+\.\d+\.\d+"/,
        `$1'${vers}'`,
      )
    ) {
      abort("version number not updated: src/rimuc/rimuc.ts");
    }
    if (
      !updateFile(
        "src/deno/rimuc.ts",
        /(const VERSION = )"\d+\.\d+\.\d+"/,
        `$1'${vers}'`,
      )
    ) {
      abort("version number not updated: src/deno/rimuc.ts");
    }
    env("vers", vers);
    await sh('git commit --all -m "Bump version number."');
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
task("push", ["test"], async function () {
  await sh("git push -u --tags origin master");
});

desc("Publish to npm");
task("publish-npm", ["test", "build-rimu"], async function () {
  await sh("npm publish");
});

desc("Format source files");
task("fmt", [], async function () {
  await sh(
    `deno fmt ${quote(glob("*.ts", "src/**/*.ts", "test/*.ts"))}`,
  );
});

run();
