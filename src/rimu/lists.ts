import * as DelimitedBlocks from './delimitedblocks'
import * as LineBlocks from './lineblocks'
import * as Io from './io'
import * as Options from './options'
import * as Utils from './utils'
import {BlockAttributes} from './utils';

interface Definition {
  match: RegExp
  listOpenTag: string
  listCloseTag: string
  itemOpenTag: string
  itemCloseTag: string
  termOpenTag?: string    // Definition lists only.
  termCloseTag?: string   // Definition lists only.
}

// Information about a matched list item element.
interface ItemState {
  match: RegExpExecArray
  def: Definition
  id: string  // List ID.
}

let defs: Definition[] = [
  // Prefix match with backslash to allow escaping.

  // Unordered lists.
  // $1 is list ID $2 is item text.
  {
    match: /^\\?\s*(-|\+|\*{1,4})\s+(.*)$/,
    listOpenTag: '<ul>',
    listCloseTag: '</ul>',
    itemOpenTag: '<li>',
    itemCloseTag: '</li>'
  },
  // Ordered lists.
  // $1 is list ID $2 is item text.
  {
    match: /^\\?\s*(?:\d*)(\.{1,4})\s+(.*)$/,
    listOpenTag: '<ol>',
    listCloseTag: '</ol>',
    itemOpenTag: '<li>',
    itemCloseTag: '</li>'
  },
  // Definition lists.
  // $1 is term, $2 is list ID, $3 is definition.
  {
    match: /^\\?\s*(.*[^:])(:{2,4})(|\s+.*)$/,
    listOpenTag: '<dl>',
    listCloseTag: '</dl>',
    itemOpenTag: '<dd>',
    itemCloseTag: '</dd>',
    termOpenTag: '<dt>',
    termCloseTag: '</dt>'
  },
]

let ids: string[]   // Stack of open list IDs.

export function render(reader: Io.Reader, writer: Io.Writer): boolean {
  if (reader.eof()) Options.panic('premature eof')
  let startItem: ItemState | null
  if (!(startItem = matchItem(reader))) {
    return false
  }
  ids = []
  renderList(startItem, reader, writer)
  // ids should now be empty.
  if (ids.length !== 0) Options.panic('list stack failure')
  return true
}

function renderList(startItem: ItemState, reader: Io.Reader, writer: Io.Writer): ItemState | null {
  ids.push(startItem.id)
  writer.write(BlockAttributes.inject(startItem.def.listOpenTag))
  let nextItem: ItemState | null
  while (true) {
    nextItem = renderListItem(startItem, reader, writer)
    if (!nextItem || nextItem.id !== startItem.id) {
      // End of list or next item belongs to ancestor.
      writer.write(startItem.def.listCloseTag)
      ids.pop()
      return nextItem
    }
    startItem = nextItem
  }
}

// Render the current list item, return the next list item or null if there are no more items.
function renderListItem(startItem: ItemState, reader: Io.Reader, writer: Io.Writer): ItemState | null {
  let def = startItem.def
  let match = startItem.match
  let text: string
  if (match.length === 4) { // 3 match groups => definition list.
    writer.write(BlockAttributes.inject(def.termOpenTag as string))
    text = Utils.replaceInline(match[1], {macros: true, spans: true})
    writer.write(text)
    writer.write(def.termCloseTag as string)
    writer.write(def.itemOpenTag)
  }
  else {
    writer.write(BlockAttributes.inject(def.itemOpenTag))
  }
  reader.next()
  // Process item text.
  let lines = new Io.Writer()
  lines.write(match[match.length - 1] + '\n') // Item text from first line.
  let nextItem: ItemState | null
  nextItem = readToNext(reader, lines)
  text = lines.toString().trim()
  text = Utils.replaceInline(text, {macros: true, spans: true})
  writer.write(text)
  while (nextItem) {
    if (nextItem.id) {
      // New list item.
      if (ids.indexOf(nextItem.id) === -1) {
        // Item does not belong to current list or an ancestor list.
        // Render new child list.
        nextItem = renderList(nextItem, reader, writer)
      }
      else {
        break // Encountered sibling or ancestor list item.
      }
    }
    else {
      // Delimited block.
      let savedIds = ids
      ids = []
      DelimitedBlocks.render(reader, writer)
      ids = savedIds
      if (reader.lines[reader.pos - 1] === '') {
        // If the Delimited Block ended with a blank line wind the cursor back one to that blank line.
        reader.pos = reader.pos - 1
      }
      nextItem = readToNext(reader, writer)
    }
  }
  writer.write(def.itemCloseTag)
  return nextItem
}

// Write the list item text from the reader to the writer.
// Consume Block Attributes.
// Return 'next' describing next list item or null if there are no more list
// releated elements.
function readToNext(reader: Io.Reader, writer: Io.Writer): ItemState | null {
  // The reader should be at the line following the first line of the list
  // item (or EOF).
  let next: ItemState | null
  while (true) {
    consumeBlockAttributes(reader, writer)
    if (reader.eof()) return null
    if (reader.cursor === '') {
      // Encountered blank line.
      reader.next()
      consumeBlockAttributes(reader, writer)
      if (reader.eof()) return null
      if (reader.cursor === '') {
        // A second blank line terminates the list.
        return null
      }
      // A single blank line separates list item from ensuing text.
      return matchItem(reader, ['indented', 'quote-paragraph'])
    }
    next = matchItem(reader, ['comment', 'code', 'division', 'html', 'quote'])
    if (next) {
      // Encountered list item or attached Delimited Block.
      return next
    }
    // Current line is list item text so write it to the output and move to the next input line.
    writer.write(reader.cursor + '\n')
    reader.next()
  }
}

function consumeBlockAttributes(reader: Io.Reader, writer: Io.Writer): void {
  let def = LineBlocks.getDefinition('attributes')
  while (true) {
    if (reader.eof()) return
    if (!def.match.test(reader.cursor)) return
    if (!LineBlocks.render(reader, writer)) return
  }
}

// Check if the line at the reader cursor matches a list related element.
// 'attachments' specifies the names of allowed Delimited Block elements (in addition to list items).
// If it matches a list item return ItemState.
// If it matches an attached Delimiter Block return {}.
// If it does not match a list related element return null.
function matchItem(reader: Io.Reader, attachments: string[] = []): ItemState | null {
  // Check if the line matches a List definition.
  if (reader.eof()) return null
  let line = reader.cursor
  let item = {} as ItemState    // ItemState factory.
  // Check if the line matches a list item.
  for (let def of defs) {
    let match = def.match.exec(line)
    if (match) {
      if (match[0][0] === '\\') {
        reader.cursor = reader.cursor.slice(1)   // Drop backslash.
        return null
      }
      item.match = match
      item.def = def
      item.id = match[match.length - 2] // The second to last match group is the list ID.
      return item
    }
  }
  // Check if the line matches an allowed attached Delimited block.
  for (let name of attachments) {
    let def: DelimitedBlocks.Definition
    def = DelimitedBlocks.getDefinition(name)
    if (def.openMatch.test(line)) {
      return item
    }
  }
  return null
}
