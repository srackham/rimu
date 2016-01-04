import * as utils from './utils'
import * as io from './io'
import * as delimitedBlocks from './delimitedblocks'

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
  id: string
  isListItem: boolean
  isDelimited: boolean
  isIndented: boolean
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

export function render(reader: io.Reader, writer: io.Writer): boolean {
  if (reader.eof()) throw 'premature eof'
  let startItem: ItemState
  if (!(startItem = matchItem(reader))) {
    return false
  }
  ids = []
  renderList(startItem, reader, writer)
  // ids should now be empty.
  return true
}

function renderList(startItem: ItemState, reader: io.Reader, writer: io.Writer): ItemState {
  ids.push(startItem.id)
  writer.write(utils.injectHtmlAttributes(startItem.def.listOpenTag))
  let nextItem: ItemState
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

function renderListItem(startItem: ItemState, reader: io.Reader, writer: io.Writer): ItemState {
  let def = startItem.def
  let match = startItem.match
  let text: string
  if (match.length === 4) { // 3 match groups => definition list.
    writer.write(def.termOpenTag)
    text = utils.replaceInline(match[1], {macros: true, spans: true})
    writer.write(text)
    writer.write(def.termCloseTag)
  }
  writer.write(def.itemOpenTag)
  // Process of item text.
  let lines = new io.Writer()
  lines.write(match[match.length - 1])  // Item text from first line.
  lines.write('\n')
  reader.next()
  let nextItem: ItemState
  nextItem = readToNext(reader, lines)
  text = lines.toString()
  text = utils.replaceInline(text, {macros: true, spans: true})
  writer.write(text)
  while (true) {
    if (!nextItem) {
      // EOF or non-list related item.
      writer.write(def.itemCloseTag)
      return null
    }
    else if (nextItem.isListItem) {
      if (ids.indexOf(nextItem.id) !== -1) {
        // Item belongs to current list or an ancestor list.
        writer.write(def.itemCloseTag)
        return nextItem
      }
      else {
        // Render new child list.
        nextItem = renderList(nextItem, reader, writer)
        writer.write(def.itemCloseTag)
        return nextItem
      }
    }
    else if (nextItem.isDelimited || nextItem.isIndented) {
      // Delimited blocks and Indented blocks attach to list items.
      let savedIds = ids
      ids = []
      delimitedBlocks.render(reader, writer)
      ids = savedIds
      reader.skipBlankLines()
      if (reader.eof()) {
        writer.write(def.itemCloseTag)
        return null
      }
      else {
        nextItem = matchItem(reader)
      }
    }
  }
  // Should never arrive here.
}

// Translate the list item in the reader to the writer until the next element
// is encountered. Return 'next' containing the next element's match and
// identity information or null if there are no more list elements.
function readToNext(reader: io.Reader, writer: io.Writer): ItemState {
  // The reader should be at the line following the first line of the list
  // item (or EOF).
  let next: ItemState
  while (true) {
    if (reader.eof()) return null
    if (reader.cursor() === '') {
      // Encountered blank line.
      reader.next()
      if (reader.cursor() === '') {
        // A second blank line terminates the list.
        return null
      }
      // Can be followed by new list item or attached indented paragraph.
      reader.skipBlankLines()
      if (reader.eof()) return null
      return matchItem(reader, {indented: true})
    }
    next = matchItem(reader, {delimited: true})
    if (next) {
      // Encountered new list item or attached quote, code or division
      // delimited block.
      return next
    }
    writer.write(reader.cursor())
    writer.write('\n')
    reader.next()
  }
}

// Check if the line at the reader cursor matches a list related element.
// If it does return list item information else return null.
// 'options' can be included to also match delimited blocks or indented paragraphs.
function matchItem(reader: io.Reader,
                   options: {delimited?: boolean; indented?: boolean; } = {}): ItemState {
  // Check if the line matches a List definition.
  let line = reader.cursor()
  let item = {} as ItemState    // ItemState factory.
  for (let def of defs) {
    let match = def.match.exec(line)
    if (match) {
      if (match[0][0] === '\\') {
        reader.cursor(reader.cursor().slice(1))   // Drop backslash.
        return null
      }
      item.match = match
      item.def = def
      item.id = match[match.length - 2]
      item.isListItem = true
      return item
    }
  }
  // Check if the line matches a Delimited Block definition.
  if (options.delimited) {
    let def: delimitedBlocks.Definition
    for (let name of ['quote', 'code', 'division']) {
      def = delimitedBlocks.getDefinition(name)
      if (def.openMatch.test(line)) {
        item.isDelimited = true
        return item
      }
    }
  }
  // Check if the line matches an Indented Paragraph definition.
  if (options.indented) {
    let def = delimitedBlocks.getDefinition('indented')
    if (def.openMatch.test(line)) {
      item.isIndented = true
      return item
    }
  }
  return null
}

