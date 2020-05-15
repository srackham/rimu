import { assert, assertEquals, createRequire, env, readFile } from "./deps.ts";

env("--abort-exits", false);

interface RenderOptions {
  safeMode?: number;
  htmlReplacement?: string;
  reset?: boolean;
  callback?: CallbackFunction;
}

interface CallbackMessage {
  type: string;
  text: string;
}

type CallbackFunction = (message: CallbackMessage) => void;

const require_ = createRequire(import.meta.url);
const rimu = require_("../lib/rimu.js");

type RimuTest = {
  description: string;
  input: string;
  expectedOutput: string;
  expectedCallback: string;
  options: { reset: boolean; callback: CallbackFunction };
};

function catchLint(message: CallbackMessage): never { // Should never be called.
  console.log(message.type + ": " + message.text);
  throw new Error();
}

Deno.test("rimuApiTest", function (): void {
  assert(
    rimu.render.constructor === Function,
    "Rimu.render is a function",
  );
});

Deno.test("rimuTest", function (): void {
  // Execute tests specified in JSON file.
  const data = readFile("./test/rimu-tests.json");
  const tests: RimuTest[] = JSON.parse(data);
  for (const test of tests) {
    let msg = "";
    if (test.expectedCallback === "") {
      test.options.callback = catchLint;
    } else {
      test.options.callback = function (message: CallbackMessage): void {
        msg += message.type + ": " + message.text + "\n";
      };
    }
    let rendered = rimu.render(test.input, test.options);
    assertEquals(
      rendered,
      test.expectedOutput,
      `${test.description}: actual: "${rendered}": expected: "${test.expectedOutput}"`,
    );
    if (test.expectedCallback !== "") {
      assertEquals(
        msg.trim(),
        test.expectedCallback,
        `${test.description}: actual: "${msg.trimEnd()}": expected: "${test.expectedCallback}"`,
      );
    }
  }
});
