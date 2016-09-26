import {BlockAttributes} from './utils'
import * as DelimitedBlocks from './delimitedblocks'
import * as Io from './io'
import * as LineBlocks from './lineblocks'
import * as Lists from './lists'
import * as Macros from './macros'
import * as Options from './options'
import * as Quotes from './quotes'
import * as Replacements from './replacements'

export function render(source: string): string {
  let reader = new Io.Reader(source)
  let writer = new Io.Writer()
  while (!reader.eof()) {
    reader.skipBlankLines()
    if (reader.eof()) break
    if (LineBlocks.render(reader, writer)) continue
    if (Lists.render(reader, writer)) continue
    if (DelimitedBlocks.render(reader, writer)) continue
    // This code should never be executed (normal paragraphs should match anything).
    throw 'unexpected error: no matching delimited block found'
  }
  return writer.toString()
}

// Set API to default state.
export function reset(): void {
  BlockAttributes.init()
  Options.setDefaults()
  DelimitedBlocks.reset()
  Macros.reset()
  Quotes.reset()
  Replacements.reset()
}
