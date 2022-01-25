#!/usr/bin/env -S deno run --allow-all

import { existsSync } from "https://deno.land/std@0.122.0/fs/exists.ts";
import * as path from "https://deno.land/std@0.122.0/path/mod.ts";
import {
  abort,
  env,
  glob,
  makeDir,
  readFile,
  sh,
} from "https://deno.land/x/drake@v1.5.0/lib.ts";

env("--abort-exits", true);

const ktDir = "../rimu-kt";
const goDir = "../go-rimu";
const dartDir = "../rimu-dart";
const pyDir = "../rimu-py";

if (Deno.args.includes("--help") || Deno.args.includes("-h")) {
  console.log(`
NAME
validate-rimu-ports - verify all Rimu ports are congruent.

SYNOPSIS
validate-rimu-ports.ts [--update-fixtures] [--skip-fixtures] [--skip-tests] [--help] [PORTID]

DESCRIPTION
This script is used to test and verify all Rimu ports are congruent.

- Builds, tests and benchmarks all Rimu ports or just one if the PORTID is specified
  (\`ts\`, \`deno\`, \`go\`, \`kt\`, \`dart\` or \`py\`)
- Compiles the Rimu documentation with each port and checks they are identical.
- If any errors or differences in the common test fixtures and resource files
  are detected it exits immediately.

OPTIONS
- If invoked with \`--update-fixtures\` argument it copies common test fixtures
  and resource files from the Rimu TypeScript implementation to the other ports.
- If invoked with \`--skip-fixtures\` argument the resources and fixtures
  comparison tests are skipped.
- If invoked with \`--skip-tests\` argument both the resources and fixtures
  comparison and the tests are skipped.
`);
  Deno.exit();
}

const isWindows = Deno.build.os === "windows";

type PortId = "ts" | "go" | "kt" | "dart" | "py" | "deno";
const portIds: PortId[] = ["ts", "deno", "go", "kt", "dart", "py"];
interface Port {
  name: string;
  projectDir: string;
  fixtures: string[];
  resourcesDir: string;
  make: () => void;
  rimucExe: string;
}

type Ports = {
  [id in PortId]: Port;
};

const ports: Ports = {
  "ts": {
    name: "TypeScript",
    projectDir: ".",
    fixtures: [
      "test/rimu-tests.json",
      "test/rimuc-tests.json",
      "examples/example-rimurc.rmu",
    ],
    resourcesDir: `src/node/resources`,
    make: async function () {
      await sh("deno run -A Drakefile.ts test");
    },
    rimucExe: "node lib/cjs/rimuc.js",
  },

  "deno": {
    name: "Deno",
    projectDir: ".",
    fixtures: [],
    resourcesDir: "",
    make: function () {
      sh("deno run -A Drakefile.ts install-deno");
    },
    rimucExe: "deno run -A src/deno/rimuc.ts",
  },

  "go": {
    name: "Go",
    projectDir: goDir,
    fixtures: [
      "rimu/testdata/rimu-tests.json",
      "rimugo/testdata/rimuc-tests.json",
      "rimugo/testdata/example-rimurc.rmu",
    ],
    resourcesDir: "rimugo/resources",
    make: async function () {
      Deno.chdir("rimugo");
      await sh("go-bindata -o bindata.go resources");
      Deno.chdir("..");
      await sh("go install ./...");
      await sh("go test ./...");
    },
    rimucExe: "rimugo",
  },

  "kt": {
    name: "Kotlin",
    projectDir: ktDir,
    fixtures: [
      "src/test/resources/rimu-tests.json",
      "src/test/resources/rimuc-tests.json",
      "src/test/fixtures/example-rimurc.rmu",
    ],
    resourcesDir: "src/main/resources/org/rimumarkup",
    make: async function () {
      await sh("./gradlew --console plain test installDist");
    },
    rimucExe: path.join(ktDir, "build/install/rimu-kt/bin/rimukt"),
  },

  "dart": {
    name: "Dart",
    projectDir: dartDir,
    fixtures: [
      "test/rimu-tests.json",
      "test/rimuc-tests.json",
      "test/fixtures/example-rimurc.rmu",
    ],
    resourcesDir: "lib/resources",
    make: async function () {
      makeDir("build");
      await sh(
        `dart2native bin/rimuc.dart -o build/${
          isWindows ? "rimuc.exe" : "rimuc"
        }`,
      );
      await sh("pub run test test/");
    },
    rimucExe: path.join(dartDir, "build/rimuc"),
  },

  "py": {
    name: "Python",
    projectDir: pyDir,
    fixtures: [
      "tests/rimu-tests.json",
      "tests/rimuc-tests.json",
      "tests/fixtures/example-rimurc.rmu",
    ],
    resourcesDir: "src/rimuc/resources",
    make: async function () {
      await sh("source .venv/bin/activate");
      await sh("source .venv/bin/activate; pylint src tests");
      await sh("source .venv/bin/activate; mypy src tests");
      await sh("source .venv/bin/activate; pytest tests");
    },
    rimucExe: path.join(pyDir, ".venv/bin/rimupy"),
  },
};

if (Deno.args.length > 0) {
  const port = Deno.args[Deno.args.length - 1] as PortId;
  if (portIds.includes(port)) {
    // Populate portIds with "ts" (the canonical implementation) and the command-line port.
    portIds.length = 0;
    portIds.push("ts"); // Always process TypeScript
    if (port !== "ts") {
      portIds.push(port);
    }
  }
}

// Don't process Python port on Windows platform.
// TODO: Drop this once python build has been ported from Make.
if (isWindows) {
  const pyIdx = portIds.indexOf("py");
  if (pyIdx !== -1) {
    console.warn("WARNING: python port is excluded from validation on Windows");
    portIds.splice(pyIdx, 1);
  }
}

// Check for project directories for all ports.
for (const id of portIds) {
  const port = ports[id];
  if (
    !existsSync(port.projectDir) || !Deno.statSync(port.projectDir).isDirectory
  ) {
    abort(
      `rimu ${port.name}: missing project directory is missing or is not a directory: ${port.projectDir}`,
    );
  }
}

// Copy and validate test fixture and resource files.
function copyAndCompare(srcFile: string, dstFile: string): void {
  if (Deno.args.includes("--update-fixtures")) {
    Deno.copyFileSync(srcFile, dstFile);
  } else if (!Deno.args.includes("--skip-fixtures")) {
    if (readFile(srcFile) !== readFile(dstFile)) {
      abort(`file contents differ: ${srcFile}: ${dstFile}`);
    }
  }
}

const srcPort = ports["ts"];
for (const id of portIds) {
  const dstPort = ports[id];
  if (id === "ts" || id == "deno") {
    continue;
  }

  // Copy and compare test fixtures.
  for (const i in srcPort.fixtures) {
    const srcFile = path.join(srcPort.projectDir, srcPort.fixtures[i]);
    const dstFile = path.join(dstPort.projectDir, dstPort.fixtures[i]);
    copyAndCompare(srcFile, dstFile);
  }

  // Copy and compare resources.
  for (const srcFile of glob(`${srcPort.resourcesDir}/*`)) {
    const dstFile = path.join(
      dstPort.projectDir,
      dstPort.resourcesDir,
      path.basename(srcFile),
    );
    copyAndCompare(srcFile, dstFile);
  }
}

// Build and test all ports.
if (!Deno.args.includes("--skip-tests")) {
  for (const id of portIds) {
    const port = ports[id];
    const savedCwd = Deno.cwd();
    Deno.chdir(port.projectDir);
    try {
      await port.make();
    } finally {
      Deno.chdir(savedCwd);
    }
  }
}

// Compile and compare documentation."
const tmpDir = Deno.makeTempDirSync({ prefix: "rimu-validate-" });
let srcCount = 0;
Deno.chdir(ports["ts"].projectDir);
for (const id of portIds) {
  const port = ports[id];
  const startTime = new Date().getTime();
  for (const doc of ["reference", "tips", "changelog"]) {
    const srcFile = path.join("docs", `${doc}.rmu`);
    const dstFile = path.join(tmpDir, `${doc}-${id}.html`);
    const cmpFile = path.join(tmpDir, `${doc}-ts.html`);
    const args =
      `--no-rimurc --theme legend --custom-toc --header-links --layout sequel --lang en --title "Rimu Reference" --highlightjs --prepend "{generate-examples}='yes'"  ./examples/example-rimurc.rmu ./docs/manpage.rmu ./docs/doc-header.rmu`;
    const cmd = `${port.rimucExe} --output ${dstFile} ${args} ${srcFile}`;
    await sh(cmd);
    if (id === "ts") {
      srcCount += readFile(srcFile).split("\n").length - 1;
    } else {
      if (readFile(cmpFile) !== readFile(dstFile)) {
        abort(`file contents differ: ${cmpFile}: ${dstFile}`);
      }
    }
  }
  if (id === "ts") {
    console.log(
      `Compiling and verifying ${srcCount} lines of Rimu Markup...`,
    );
  }
  console.log(
    `${port.name.padEnd(12)} ${new Date().getTime() - startTime}ms`,
  );
}
