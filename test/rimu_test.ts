import * as rimu from "../mod.ts";
import { assert, assertEquals, env, readFile } from "./deps.ts";

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

type RimuTest = {
  description: string;
  input: string;
  expectedOutput: string;
  expectedCallback: string;
  options: { reset: boolean; callback: CallbackFunction };
};

function catchLint(message: CallbackMessage): never {
  // Should never be called.
  console.log(message.type + ": " + message.text);
  throw new Error();
}

Deno.test("rimuApiTest", function (): void {
  assert(rimu.render.constructor === Function, "Rimu.render is a function");
});

Deno.test("rimuTest", function (): void {
  // Execute tests specified in JSON file.
  const data = readFile("./test/rimu-tests.json");
  const tests: RimuTest[] = JSON.parse(data);
  let i = 0;
  for (const test of tests) {
    i++;
    const msg = `${i}: ${test.description}`;
    console.log(msg);
    let callbackMsg = "";
    if (test.expectedCallback === "") {
      test.options.callback = catchLint;
    } else {
      test.options.callback = function (message: CallbackMessage): void {
        callbackMsg += message.type + ": " + message.text + "\n";
      };
    }
    const rendered = rimu.render(test.input, test.options);
    assertEquals(
      rendered,
      test.expectedOutput,
      `${test.description}: actual: "${rendered}": expected: "${test.expectedOutput}"`,
    );
    if (test.expectedCallback !== "") {
      assertEquals(
        callbackMsg.trim(),
        test.expectedCallback,
        `${test.description}: actual: "${callbackMsg.trimEnd()}": expected: "${test.expectedCallback}"`,
      );
    }
  }
});
