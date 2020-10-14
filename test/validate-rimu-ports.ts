#!/usr/bin/env -S deno run --allow-all

/*

NAME
validate-rimu-ports - verify all Rimu ports are congruent.

SYNOPSIS
validate-rimu-ports.ts [--update-fixtures] [--skip-fixtures] [--skip-tests]

DESCRIPTION
This script is used to test and verify all Rimu ports are congruent.

- Tests and builds all Rimu ports.
- Compiles the Rimu documentation with all three ports and checks they are
  identical.
- If any errors or differences in the common test fixtures and resource files
  are detected it exits immediately.

OPTIONS
- If invoked with `--update-fixtures` argument it copies common test fixtures
  and resource files from the Rimu TypeScript implementation to the other ports.
- If invoked with `--skip-fixtures` argument the resources and fixtures
  comparison tests are skipped.
- If invoked with `--skip-tests` argument both the resources and fixtures
  comparison and the tests are skipped.

*/

import { existsSync } from "https://deno.land/std@0.74.0/fs/exists.ts";
import * as path from "https://deno.land/std@0.74.0/path/mod.ts";
import {
  abort,
  glob,
  log,
  readFile,
  sh,
} from "https://deno.land/x/drake@v1.4.4/lib.ts";

const isWindows = Deno.build.os === "windows";

type PortName = "ts" | "go" | "kt" | "dart" | "py";

interface Port {
  name: PortName;
  dir: string;
}
// Project directories.
const RIMU_TS = "../rimu";
const RIMU_GO = "../go-rimu";
const RIMU_KT = "../rimu-kt";
const RIMU_DART = "../rimu-dart";
const RIMU_PY = "../rimu-py";

const ports: Array<Port> = [
  { name: "ts", dir: RIMU_TS },
  { name: "go", dir: RIMU_GO },
  { name: "kt", dir: RIMU_KT },
  { name: "dart", dir: RIMU_DART },
  { name: "py", dir: RIMU_PY },
];

// env("--abort-exits", true);

for (const port of ports) {
  if (!existsSync(port.dir)) {
    abort(`rimu ${port.name}: missing project directory: ${port.dir}`);
  }
}

// Copy test fixtures, resources and example rimurc file.
if (Deno.args.includes("--update-fixtures")) {
  log("Updating test fixtures and resources...");
  Deno.copyFileSync(
    `${RIMU_TS}/test/rimu-tests.json`,
    `${RIMU_GO}/rimu/testdata/rimu-tests.json`,
  );
  Deno.copyFileSync(
    `${RIMU_TS}/test/rimuc-tests.json`,
    `${RIMU_GO}/rimugo/testdata/rimuc-tests.json`,
  );
  Deno.copyFileSync(
    `${RIMU_TS}/examples/example-rimurc.rmu`,
    `${RIMU_GO}/rimugo/testdata/example-rimurc.rmu`,
  );

  Deno.copyFileSync(
    `${RIMU_TS}/test/rimu-tests.json`,
    `${RIMU_KT}/src/test/resources/rimu-tests.json`,
  );
  Deno.copyFileSync(
    `${RIMU_TS}/test/rimuc-tests.json`,
    `${RIMU_KT}/src/test/resources/rimuc-tests.json`,
  );
  Deno.copyFileSync(
    `${RIMU_TS}/examples/example-rimurc.rmu`,
    `${RIMU_KT}/src/test/fixtures/example-rimurc.rmu`,
  );

  Deno.copyFileSync(
    `${RIMU_TS}/test/rimu-tests.json`,
    `${RIMU_DART}/test/rimu-tests.json`,
  );
  Deno.copyFileSync(
    `${RIMU_TS}/test/rimuc-tests.json`,
    `${RIMU_DART}/test/rimuc-tests.json`,
  );
  Deno.copyFileSync(
    `${RIMU_TS}/examples/example-rimurc.rmu`,
    `${RIMU_DART}/test/fixtures/example-rimurc.rmu`,
  );

  Deno.copyFileSync(
    `${RIMU_TS}/test/rimu-tests.json`,
    `${RIMU_PY}/tests/rimu-tests.json`,
  );
  Deno.copyFileSync(
    `${RIMU_TS}/test/rimuc-tests.json`,
    `${RIMU_PY}/tests/rimuc-tests.json`,
  );
  Deno.copyFileSync(
    `${RIMU_TS}/examples/example-rimurc.rmu`,
    `${RIMU_PY}/tests/fixtures/example-rimurc.rmu`,
  );

  for (const f of glob("./src/node/resources/*")) {
    Deno.copyFileSync(f, `${RIMU_GO}/rimugo/resources/${path.basename(f)}`);
    Deno.copyFileSync(
      f,
      `${RIMU_KT}/src/main/resources/org/rimumarkup/${path.basename(f)}`,
    );
    Deno.copyFileSync(f, `${RIMU_DART}/lib/resources/${path.basename(f)}`);
    Deno.copyFileSync(f, `${RIMU_PY}/src/rimuc/resources/${path.basename(f)}`);
  }
}

// Proceed only if all test fixtures and resource files are identical.
function compare(source: string, to: string): void {
  if (readFile(source) !== readFile(to)) {
    abort(`file contents differ: ${source}: ${to}`);
  }
}

if (!Deno.args.includes("--skip-fixtures")) {
  log("Checking test fixtures and resources are up to date...");
  compare(
    `${RIMU_TS}/test/rimu-tests.json`,
    `${RIMU_GO}/rimu/testdata/rimu-tests.json`,
  );
  compare(
    `${RIMU_TS}/test/rimuc-tests.json`,
    `${RIMU_GO}/rimugo/testdata/rimuc-tests.json`,
  );
  compare(
    `${RIMU_TS}/examples/example-rimurc.rmu`,
    `${RIMU_GO}/rimugo/testdata/example-rimurc.rmu`,
  );

  compare(
    `${RIMU_TS}/test/rimu-tests.json`,
    `${RIMU_KT}/src/test/resources/rimu-tests.json`,
  );
  compare(
    `${RIMU_TS}/test/rimuc-tests.json`,
    `${RIMU_KT}/src/test/resources/rimuc-tests.json`,
  );
  compare(
    `${RIMU_TS}/examples/example-rimurc.rmu`,
    `${RIMU_KT}/src/test/fixtures/example-rimurc.rmu`,
  );

  compare(
    `${RIMU_TS}/test/rimu-tests.json`,
    `${RIMU_DART}/test/rimu-tests.json`,
  );
  compare(
    `${RIMU_TS}/test/rimuc-tests.json`,
    `${RIMU_DART}/test/rimuc-tests.json`,
  );
  compare(
    `${RIMU_TS}/examples/example-rimurc.rmu`,
    `${RIMU_DART}/test/fixtures/example-rimurc.rmu`,
  );

  compare(
    `${RIMU_TS}/test/rimu-tests.json`,
    `${RIMU_PY}/tests/rimu-tests.json`,
  );
  compare(
    `${RIMU_TS}/test/rimuc-tests.json`,
    `${RIMU_PY}/tests/rimuc-tests.json`,
  );
  compare(
    `${RIMU_TS}/examples/example-rimurc.rmu`,
    `${RIMU_PY}/tests/fixtures/example-rimurc.rmu`,
  );

  for (const f of glob("./src/node/resources/*")) {
    compare(f, `${RIMU_GO}/rimugo/resources/${path.basename(f)}`);
    compare(
      f,
      `${RIMU_KT}/src/main/resources/org/rimumarkup/${path.basename(f)}`,
    );
    compare(f, `${RIMU_DART}/lib/resources/${path.basename(f)}`);
    compare(f, `${RIMU_PY}/src/rimuc/resources/${path.basename(f)}`);
  }
}

// Build and test all ports.
if (!Deno.args.includes("--skip-tests")) {
  log("Running tests...");

  await sh(`deno run -A Drakefile.ts test`, { cwd: `${RIMU_TS}` });

  await sh(`make`, { cwd: `${RIMU_GO}` });

  await sh(`./gradlew --console plain test installDist`, { cwd: `${RIMU_KT}` });

  await sh(`make`, { cwd: `${RIMU_DART}` });

  await sh(
    `source .venv/bin/activate; make clean build install`,
    { cwd: `${RIMU_PY}` },
  );

  await sh(`deno run -A Drakefile.ts install-deno`, { cwd: `${RIMU_TS}` });
}
