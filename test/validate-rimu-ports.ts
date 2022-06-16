#!/usr/bin/env -S deno run --allow-all

import { existsSync } from "https://deno.land/std@0.140.0/fs/exists.ts";
import * as path from "https://deno.land/std@0.140.0/path/mod.ts";
import {
  abort,
  env,
  glob,
  makeDir,
  readFile,
  sh,
} from "https://deno.land/x/drake@v1.5.2/lib.ts";

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
validate-rimu-ports.ts [--update-resources] [--nocheck-resources] [--benchmark] [--help] [PORTID]

DESCRIPTION
This script is used to test and verify all Rimu ports are congruent.

- Builds, tests and benchmarks all Rimu ports or just one if the PORTID is specified
  (\`ts\`, \`deno\`, \`go\`, \`kt\`, \`dart\` or \`py\`)
- Compares common resource files and test fixture files with those of the canonical
  rimu TypeScript port. If they don't compare there is an immediate error exit.
- Compiles the Rimu documentation with each port and checks they are identical.

OPTIONS
- If invoked with \`--update-resources\` argument it copies common resource files
  and test fixtures from the Rimu TypeScript implementation to the other ports.
- If invoked with \`--nocheck-resources\` argument the resources and test fixtures
  comparison is skipped.
- If invoked with \`--benchmark\` argument then only the documentation compilation
  is executed (projects are not built or tested).
`);
  Deno.exit();
}

const isWindows = Deno.build.os === "windows";

const tmpDir = Deno.makeTempDirSync({ prefix: "rimu-validate-" });

type PortId = "ts" | "go" | "kt" | "dart" | "py" | "deno";
const portIds: PortId[] = ["ts", "deno", "go", "kt", "dart", "py"];
interface Port {
  name: string;
  projectDir: string;
  fixtures: string[];
  resourcesDir: string;
  make: () => void;
  rimucExe: () => string;
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
    rimucExe: () => "node lib/cjs/rimuc.js",
  },

  "deno": {
    name: "Deno",
    projectDir: ".",
    fixtures: [],
    resourcesDir: "",
    make: function () {
      sh("deno run -A Drakefile.ts install-deno");
    },
    rimucExe: () => "deno run -A src/deno/rimuc.ts",
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
      await sh("go install ./...");
      await sh("go test ./...");
    },
    rimucExe: () => "rimugo",
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
    rimucExe: () => path.join(ktDir, "build/install/rimu-kt/bin/rimukt"),
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
        `dart compile exe -o build/${
          isWindows ? "rimuc.exe" : "rimuc"
        } bin/rimuc.dart`,
      );
      await sh("dart test test/*.dart");
    },
    rimucExe: () => path.join(dartDir, "build/rimuc"),
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
      const distFile = path.join(tmpDir, "rimu-latest-py3-none-any.whl");
      await sh(
        // Rebuild image.
        "docker build --tag rimu-py .",
      );
      await sh(
        // Run tests and build distribution.
        "docker run -it --name rimu-py rimu-py make build",
      );
      await sh(
        // Copy distribution to /tmp on host machine.
        `docker cp rimu-py:/workspaces/rimu-py/dist/rimu-latest-py3-none-any.whl ${distFile}`,
      );
      await sh(
        // Delete container.
        "docker rm rimu-py",
      );
      await sh(
        // Install distribution on host machine.
        `python3 -m pip install --upgrade --target ${
          path.join(tmpDir, "rimu-py")
        } ${distFile}`,
      );
    },
    rimucExe: () =>
      `PYTHONPATH=${path.join(tmpDir, "rimu-py")} ${
        path.join(tmpDir, "rimu-py", "bin", "rimupy")
      }`,
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
  if (Deno.args.includes("--update-resources")) {
    Deno.copyFileSync(srcFile, dstFile);
  } else if (!Deno.args.includes("--nocheck-resources")) {
    if (readFile(srcFile) !== readFile(dstFile)) {
      abort(`file contents differ: ${dstFile} ${srcFile}`);
    }
  }
}

if (!Deno.args.includes("--benchmark")) {
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

// Compile and compare documentation.
let srcCount = 0;
Deno.chdir(ports["ts"].projectDir);
for (const id of portIds) {
  const port = ports[id];
  const startTime = new Date().getTime();
  for (const doc of ["reference", "tips", "changelog"]) {
    const srcFile = path.join("docsrc", `${doc}.rmu`);
    const dstFile = path.join(tmpDir, `${doc}-${id}.html`);
    const cmpFile = path.join(tmpDir, `${doc}-ts.html`);
    const args =
      `--no-rimurc --theme legend --custom-toc --header-links --layout sequel --lang en --title "Rimu Reference" --highlightjs --prepend "{generate-examples}='yes'"  ./examples/example-rimurc.rmu ./docsrc/manpage.rmu ./docsrc/doc-header.rmu`;
    const cmd = `${port.rimucExe()} --output ${dstFile} ${args} ${srcFile}`;
    await sh(cmd);
    if (id === "ts") {
      srcCount += readFile(srcFile).split("\n").length - 1;
    } else {
      if (!Deno.args.includes("--benchmark")) {
        if (readFile(cmpFile) !== readFile(dstFile)) {
          abort(`file contents differ: ${cmpFile}: ${dstFile}`);
        }
      }
    }
  }
  if (id === "ts") {
    console.log(
      `Compiling ${srcCount} lines of Rimu Markup...`,
    );
  }
  console.log(
    `${port.name.padEnd(12)} ${new Date().getTime() - startTime}ms`,
  );
}
