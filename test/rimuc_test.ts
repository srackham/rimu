import {
  assert,
  assertEquals,
  assertNotEquals
} from "https://deno.land/std@v0.41.0/testing/asserts.ts";
import {
  env,
  readFile,
  shCapture,
  ShOutput
} from "https://raw.github.com/srackham/drake/master/mod.ts";

type RimucTest = {
  description: string;
  args: string;
  input: string;
  expectedOutput: string;
  exitCode?: number;
  predicate: string;
  layouts?: boolean;
};

env("--abort-exits", false);

type BuiltTarget = "deno" | "node" | undefined;

async function runTest(test: RimucTest, buildTarget: BuiltTarget): Promise<
  void
> {
  let shout: ShOutput;
  if (!buildTarget || buildTarget === "node") {
    shout = await shCapture(
      `node ./bin/rimuc.js --no-rimurc ${test.args ?? ""}`,
      { input: test.input, stderr: "piped" },
    );
    testShOut(shout, test);
  }
  if (!buildTarget || buildTarget === "deno") {
    shout = await shCapture(
      `deno --allow-env --allow-read src/deno/rimuc.ts --no-rimurc ${test
        .args ?? ""}`,
      { input: test.input, stderr: "piped" },
    );
    testShOut(shout, test);
  }
}

function testShOut(
  shout: ShOutput,
  test: RimucTest,
): void {
  const out = shout.output + shout.error;
  const msg = `${test.description}: ${JSON.stringify(test)}: ${JSON.stringify(
    shout,
  )}`;
  switch (test.predicate) {
    case "equals":
      assertEquals(out, test.expectedOutput, msg);
      break;
    case "!equals":
      assertNotEquals(out, test.expectedOutput, msg);
      break;
    case "contains":
      assert(out.indexOf(test.expectedOutput) >= 0, msg);
      break;
    case "!contains":
      assert(out.indexOf(test.expectedOutput) === -1, msg);
      break;
    case "startsWith":
      assert(out.startsWith(test.expectedOutput), msg);
      break;
    case "exitCode":
      assertEquals(out, test.expectedOutput, msg);
      assert(shout.code === test.exitCode, msg);
      break;
    default:
      assert(
        false,
        `${test.description}: illegal predicate: ${test.predicate}`,
      );
  }
}

Deno.test(
  async function rimucTest(): Promise<void> {
    const buildTarget: BuiltTarget = Deno.env(
      "RIMU_BUILD_TARGET",
    ) as BuiltTarget;
    console.log(`platform: ${buildTarget ?? "deno, node"}`);
    // Execute tests specified in JSON file.
    const data = readFile("./test/rimuc-tests.json");
    const tests: RimucTest[] = JSON.parse(data);
    for (const test of tests) {
      if (test.layouts) {
        // Run the test on built-in layouts.
        const t = { ...test };
        for (const layout of ["classic", "flex", "sequel"]) {
          t.args = `--layout ${layout} ${test.args}`;
          t.description = `${layout} layout: ${test.description}`;
          await runTest(t, buildTarget);
        }
      } else {
        await runTest(test, buildTarget);
      }
    }
  },
);
