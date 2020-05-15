export { existsSync } from "https://deno.land/std@v0.51.0/fs/exists.ts";
export { readFileStrSync } from "https://deno.land/std@v0.51.0/fs/read_file_str.ts";
export { walkSync } from "https://deno.land/std@v0.51.0/fs/walk.ts";
export { writeFileStrSync } from "https://deno.land/std@v0.51.0/fs/write_file_str.ts";
export { createRequire } from "https://deno.land/std@v0.51.0/node/module.ts";
export * as path from "https://deno.land/std@v0.51.0/path/mod.ts";
export {
  assert,
  assertEquals,
  assertNotEquals,
  assertStrContains,
  assertThrows,
  assertThrowsAsync,
} from "https://deno.land/std@v0.51.0/testing/asserts.ts";
export {
  abort,
  env,
  glob,
  log,
  quote,
  readFile,
  sh,
  shCapture,
  ShOutput,
  updateFile,
  writeFile,
} from "https://deno.land/x/drake@v1.0.0/lib/utils.ts";
