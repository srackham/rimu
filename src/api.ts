/* tslint:disable */
import * as io from './io'
import * as lineBlocks from './lineblocks'
import * as delimitedBlocks from './delimitedblocks'
import * as lists from './lists'
import * as macros from './macros'
import * as options from './options'
import * as quotes from './quotes'
import * as replacements from './replacements'
/* tslint:enable */

export function render(source: string): string {
  var reader = new io.Reader(source)
  var writer = new io.Writer()
  while (!reader.eof()) {
    reader.skipBlankLines()
    if (reader.eof()) break
    if (lineBlocks.render(reader, writer)) continue
    if (lists.render(reader, writer)) continue
    if (delimitedBlocks.render(reader, writer)) continue
    throw 'no matching delimited block found'
  }
  return writer.toString()
}

// Set API to default state.
// TODO change all initialize()'s to reset()
export function initialize(): void {
  options.initialize()
  delimitedBlocks.initialize()
  macros.initialize()
  quotes.initialize()
  replacements.initialize()
}

