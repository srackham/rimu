import * as io from './io'
import * as lineBlocks from './lineblocks'
import * as delimitedBlocks from './delimitedblocks'
import * as lists from './lists'
import * as macros from './macros'
import * as options from './options'
import * as quotes from './quotes'
import * as replacements from './replacements'

export function render(source: string): string {
  let reader = new io.Reader(source)
  let writer = new io.Writer()
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
export function reset(): void {
  options.setDefaults()
  delimitedBlocks.reset()
  macros.reset()
  quotes.reset()
  replacements.reset()
}

