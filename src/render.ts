import * as io from './io'
import * as lineBlocks from './lineblocks'
import * as delimitedBlocks from './delimitedblocks'
import * as lists from './lists'

export function renderSource(source: string): string {
  var reader = new io.Reader(source);
  var writer = new io.Writer();
  while (!reader.eof()) {
    reader.skipBlankLines();
    if (reader.eof()) break;
    if (lineBlocks.render(reader, writer)) continue;
    if (lists.render(reader, writer)) continue;
    if (delimitedBlocks.render(reader, writer)) continue;
    throw 'no matching delimited block found';
  }
  return writer.toString();
}

