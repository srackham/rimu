#!/usr/bin/env -S deno run --allow-all

import { existsSync } from "https://deno.land/std@0.84.0/fs/exists.ts";
import * as path from "https://deno.land/std@0.84.0/path/mod.ts";
import {
  abort,
  env,
  glob,
  makeDir,
  readFile,
  sh,
} from "https://deno.land/x/drake@v1.4.6/lib.ts";

env("--abort-exits", true);

if (Deno.args.includes("--help") || Deno.args.includes("-h")) {
  console.log(`
NAME
validate-rimu-ports - verify all Rimu ports are congruent.

SYNOPSIS
validate-rimu-ports.ts [--update-fixtures] [--skip-fixtures] [--skip-tests] [--help]

DESCRIPTION
This script is used to test and verify all Rimu ports are congruent.

- Tests and builds all Rimu ports.
- Compiles the Rimu documentation with all three ports and checks they are
  identical.
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
if (isWindows) {
  // TODO: Drop this once python build has been ported from Make.
  console.warn("WARNING: python port is excluded from validation on Windows");
  portIds.splice(portIds.length - 1, 1);
}

interface Port {
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
    projectDir: ".",
    fixtures: [],
    resourcesDir: "",
    make: function () {
      sh("deno run -A Drakefile.ts install-deno");
    },
    rimucExe: "deno run -A src/deno/rimuc.ts",
  },

  "go": {
    projectDir: "../go-rimu",
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
    projectDir: "../rimu-kt",
    fixtures: [
      "src/test/resources/rimu-tests.json",
      "src/test/resources/rimuc-tests.json",
      "src/test/fixtures/example-rimurc.rmu",
    ],
    resourcesDir: "src/main/resources/org/rimumarkup",
    make: async function () {
      await sh("./gradlew --console plain test installDist");
    },
    rimucExe: "build/install/rimu-kt/bin/rimukt",
  },

  "dart": {
    projectDir: "../rimu-dart",
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
    rimucExe: "build/rimuc",
  },

  "py": {
    projectDir: "../rimu-py",
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
    rimucExe: ".venv/bin/rimupy",
  },
};

// Check for project directories for all ports.
for (const id of portIds) {
  const port = ports[id];
  if (!existsSync(port.projectDir)) {
    abort(`rimu ${id}: missing project directory: ${port.projectDir}`);
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
    const port = ports[id as PortId];
    const savedCwd = Deno.cwd();
    Deno.chdir(port.projectDir);
    try {
      await port.make();
    } finally {
      Deno.chdir(savedCwd);
    }
  }
}
