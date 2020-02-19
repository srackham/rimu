/*
 * Drakefile for Rimu Markup (http://github.com/srackham/rimu).
 */
import { abort, desc, env, glob, quote, readFile, run, sh, task, updateFile, writeFile } from "file:///home/srackham/local/projects/drake/mod.ts"

env["--default-task"] = "test";

/* Inputs and outputs */

const PKG_FILE = "package.json";
const RIMU_LIB = "lib/rimu.js";
const RIMU_LIB_MIN = "lib/rimu.min.js";
const RIMU_SRC = glob("src/rimu/*.ts");
const RIMU_TSD = "typings/rimu.d.ts";
const TESTS = glob("test/*-tests.js");
const DOCS_DIR = "docs/";
const RIMUC_JS = "bin/rimuc.js";
const RIMUC_TS = "src/rimuc/rimuc.ts";
const RIMUC_EXE = "node " + RIMUC_JS;
const MANPAGE_RMU = DOCS_DIR + "manpage.rmu";
const MANPAGE_TXT = "src/rimuc/resources/manpage.txt";
const RESOURCES_SRC = "src/rimuc/resources.ts";
const RESOURCE_FILES = glob("src/rimuc/resources/*");
const GALLERY_INDEX_SRC = DOCS_DIR + "gallery.rmu";
const GALLERY_INDEX_DST = DOCS_DIR + "gallery.html";

const DOCS = [
  {
    src: "README.md",
    dst: DOCS_DIR + "index.html",
    title: "Rimu Markup",
    rimucOptions: "--highlightjs"
  },
  {
    src: DOCS_DIR + "changelog.rmu",
    dst: DOCS_DIR + "changelog.html",
    title: "Rimu Change Log",
    rimucOptions: ""
  },
  {
    src: DOCS_DIR + "reference.rmu",
    dst: DOCS_DIR + "reference.html",
    title: "Rimu Reference",
    rimucOptions:
      "--highlightjs --prepend \"{generate-examples}='yes'\" --prepend-file " +
        MANPAGE_RMU
  },
  {
    src: DOCS_DIR + "tips.rmu",
    dst: DOCS_DIR + "tips.html",
    title: "Rimu Tips",
    rimucOptions:
      "--highlightjs --mathjax --prepend \"{generate-examples}='yes'\""
  },
  {
    src: DOCS_DIR + "rimuplayground.rmu",
    dst: DOCS_DIR + "rimuplayground.html",
    title: "Rimu Playground",
    rimucOptions: "--prepend \"{generate-examples}='yes'\""
  },
  {
    src: GALLERY_INDEX_SRC,
    dst: GALLERY_INDEX_DST,
    title: "Rimu layout and themes gallery",
    rimucOptions: ""
  }
];
const HTML = DOCS.map(doc => doc.dst);

/*
 Tasks
 */

desc(
  "build, lint and test rimu and tools, build documentation, validate HTML. Use vers=x.y.z argument to set a new version number."
);
task("build", ["test", "lint", "version", "build-docs", "validate-html"]);

desc(
  "Update version number, tag and push to Github and npm. Use vers=x.y.z argument to set a new version number. Finally, rebuild and publish docs website."
);
task("release", ["build", "tag", "publish"]);

desc("Lint TypeScript, Javascript and JSON files.");
task("lint", [], async function() {
  const commands = ([] as string[])
    .concat(
      RIMU_SRC.concat([RIMUC_TS, RIMU_TSD]).map(
        file => `tslint ${file} >/dev/null 2>&1`
      )
    )
    .concat(TESTS.map(file => "jshint " + file))
    .concat(["jsonlint --quiet package.json"]);
  console.log(commands);
  await sh(commands);
});

desc("Run tests (rebuild if necessary).");
task("test", ["build-rimu", "build-rimuc"], async function() {
  const commands = TESTS.map(file => `tape ${file} | faucet`);
  await sh(commands);
});

desc("Compile and bundle rimu.js and rimu.min.js libraries.map files.");
task("build-rimu", [RIMU_LIB]);

task(RIMU_LIB, RIMU_SRC, async function() {
  await sh("webpack --mode production --config ./src/rimu/webpack.config.js");
});

desc("Compile rimuc to JavaScript executable and generate .map file.");
task("build-rimuc", [RESOURCES_SRC], async function() {
  await sh("webpack --mode production --config ./src/rimuc/webpack.config.js");
  await sh(`chmod +x ${RIMUC_JS}`);
});

desc("Generate manpage.rmu");
task(MANPAGE_RMU, [MANPAGE_TXT], function() {
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
`
  );
});

desc("Generate resources.ts");
task(RESOURCES_SRC, RESOURCE_FILES, function() {
  let res = `// Generated automatically by DrakeFile.ts, do not edit.
export let resources: { [name: string]: string } = {
`;
  RESOURCE_FILES.forEach(f => {
    res += `  '${f.replace(/^.*[\\\/]/, "")}': String.raw\``;
    res += readFile(f).replace(/`/g, "\\x60"); // Escape backticks (unescaped at runtime).
    res += "`,\n";
  });
  res += "};\n";
  writeFile(RESOURCES_SRC, res);
});

desc("Generate documentation");
task(
  "build-docs",
  [MANPAGE_RMU, "build-rimu", "build-gallery"],
  async function() {
    await sh(`cp -f ${RIMU_LIB_MIN} ${DOCS_DIR}`);
    const commands = DOCS.map(doc => RIMUC_EXE +
      " --no-rimurc --theme legend --custom-toc --header-links" +
      " --layout sequel" +
      ' --output "' + doc.dst + '"' +
      " --lang en" +
      ' --title "' + doc.title + '"' +
      " " + doc.rimucOptions + " " +
      " ./src/examples/example-rimurc.rmu " + DOCS_DIR + "doc-header.rmu " +
      doc.src);
    await sh(commands);
  }
);

function forEachGalleryDocument(
  documentCallback: any,
  layoutCallback: any,
  themeCallback: any
) {
  ["sequel", "classic", "flex", "plain"].forEach(function(layout) {
    if (layoutCallback) layoutCallback(layout);
    if (layout === "plain") {
      documentCallback("--layout plain --no-toc", "plain-example.html");
      return;
    }
    ["legend", "vintage", "graystone"].forEach(function(theme) {
      if (themeCallback) themeCallback(layout, theme);
      ["", "dropdown-toc", "no-toc"].forEach(function(variant) {
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

desc("Generate gallery documentation examples");
task("build-gallery", ["build-rimu", "gallery-index"], async function() {
  let commands: any[] = [];
  forEachGalleryDocument(
    function(options: any, outfile: any, _: any, __: any) {
      let command = RIMUC_EXE +
        " --custom-toc" +
        " --no-rimurc" +
        " " + options +
        " --output " + DOCS_DIR + outfile +
        " --prepend \"{gallery-options}='" +
        options.replace(/(["{])/g, "\\$1") +
        "'\"" +
        " ./src/examples/example-rimurc.rmu" +
        " " + DOCS_DIR + "doc-header.rmu" +
        " " + DOCS_DIR + "gallery-example-template.rmu";
      commands.push(command);
    },
    null,
    null
  );
  await sh(commands);
});

desc("Generate gallery index Rimu markup " + GALLERY_INDEX_SRC);
task("gallery-index", [], function() {
  let text = `# Rimu Gallery

Here are some examples of styled HTML documents generated using the
{rimuc} command \`--layout\` option.

Click the options links to view the generated documents.

See [Built-in layouts]({reference}#built-in-layouts) for more information.`;
  forEachGalleryDocument(
    function(options: any, outfile: any, _: any, __: any) {
      const link = "[`" + options.replace(/{/g, "\\{") + "`](" + outfile + ")";
      text += "\n- " + link;
    },
    function(layout: any) {
      text += "\n\n\n## " + layout + " layout";
    },
    function(_: any, theme: any) {
      text += "\n\n### " + theme + " theme";
    }
  );
  text += "\n\n"
  writeFile(GALLERY_INDEX_SRC, text);
});

desc("Validate HTML documents.");
task("validate-html", [], async function() {
  const commands = HTML
    .// 2018-11-09: Skip files with style tags in the body as Nu W3C validator treats style tags in the body as an error.
    filter(
      file => !["reference", "tips", "rimuplayground"].map(
        file => `${DOCS_DIR}${file}.html`
      ).includes(file)
    )
    .map(file => `html-validator --verbose --format=text --file=${file}`);
  await sh(commands);
});

function getPackageVers(): string {
  const match = readFile(PKG_FILE).match(/^\s*"version": "(\d+\.\d+\.\d+)"/m);
  if (match === null) {
    abort(`unable to find semantic version number in ${PKG_FILE}`);
  }
  return (match as RegExpMatchArray)[1];
}

desc(
  "Display or update the project version number e.g. 'drake version', 'drake version vers=1.0.0'"
);
task("version", [], async function() {
  const vers = env.vers;
  if (!vers) {
    console.log(`version: ${getPackageVers()}`);
  } else {
    if (!vers.match(/^\d+\.\d+\.\d+$/)) {
      abort(`invalid version number: ${vers}`);
    }
    updateFile(
      "package.json",
      /(\s*"version"\s*:\s*)"\d+\.\d+\.\d+"/,
      `$1"${vers}"`
    );
    updateFile(
      "./src/rimuc/rimuc.ts",
      /(const VERSION = )'\d+\.\d+\.\d+'/,
      `$1'${vers}'`
    );
    env.vers = vers;
    await sh('git commit --all -m "Bump version number."');
  }
});

desc("Create Git version tag using version number from package.json.");
task("tag", ["test"], async function() {
  const vers = getPackageVers();
  console.log(`tag: ${vers}`);
  await sh(`git tag -a -m "Tag ${vers}" ${vers}`);
});

desc("Commit changes to local Git repo.");
task("commit", ["test"], async function() {
  await sh("git commit -a");
});

desc("Push to Github and publish to npm.");
task("publish", ["push", "publish-npm"]);

desc("Push changes to Github");
task("push", ["test"], async function() {
  await sh("git push -u --tags origin master");
});

desc("Publish to npm.");
task("publish-npm", ["test", "build-rimu"], async function() {
  await sh("npm publish");
});

desc("Format source files");
task("fmt", [], async function() {
  await sh(`deno fmt ${quote(RIMU_SRC)}`);
});

run();
