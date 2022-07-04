import { BlockAttributes } from "./blockattributes.ts";
import * as DelimitedBlocks from "./delimitedblocks.ts";
import * as Io from "./io.ts";
import * as LineBlocks from "./lineblocks.ts";
import * as Lists from "./lists.ts";
import * as Macros from "./macros.ts";
import * as Options from "./options.ts";
import * as Quotes from "./quotes.ts";
import * as Replacements from "./replacements.ts";

export function render(source: string): string {
  const reader = new Io.Reader(source);
  const writer = new Io.Writer();
  while (!reader.eof()) {
    reader.skipBlankLines();
    if (reader.eof()) break;
    if (LineBlocks.render(reader, writer)) continue;
    if (Lists.render(reader, writer)) continue;
    if (DelimitedBlocks.render(reader, writer)) continue;
    // This code should never be executed (normal paragraphs should match anything).
    Options.panic("no matching delimited block found");
  }
  return writer.toString();
}

// Set API to default state.
export function init(): void {
  BlockAttributes.init();
  Options.init();
  DelimitedBlocks.init();
  Macros.init();
  Quotes.init();
  Replacements.init();
}
