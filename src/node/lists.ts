import * as DelimitedBlocks from "./delimitedblocks";
import * as Io from "./io";
import * as LineBlocks from "./lineblocks";
import * as Options from "./options";
import * as Utils from "./utils";
import { BlockAttributes } from "./utils";

interface Definition {
  match: RegExp;
  listOpenTag: string;
  listCloseTag: string;
  itemOpenTag: string;
  itemCloseTag: string;
  termOpenTag?: string; // Definition lists only.
  termCloseTag?: string; // Definition lists only.
}

// Information about a matched list item element.
interface ItemInfo {
  match: RegExpExecArray;
  def: Definition;
  id: string; // List ID.
}

const defs: Definition[] = [
  // Prefix match with backslash to allow escaping.

  // Unordered lists.
  // $1 is list ID $2 is item text.
  {
    match: /^\\?\s*(-|\+|\*{1,4})\s+(.*)$/,
    listOpenTag: "<ul>",
    listCloseTag: "</ul>",
    itemOpenTag: "<li>",
    itemCloseTag: "</li>",
  },
  // Ordered lists.
  // $1 is list ID $2 is item text.
  {
    match: /^\\?\s*(?:\d*)(\.{1,4})\s+(.*)$/,
    listOpenTag: "<ol>",
    listCloseTag: "</ol>",
    itemOpenTag: "<li>",
    itemCloseTag: "</li>",
  },
  // Definition lists.
  // $1 is term, $2 is list ID, $3 is definition.
  {
    match: /^\\?\s*(.*[^:])(:{2,4})(|\s+.*)$/,
    listOpenTag: "<dl>",
    listCloseTag: "</dl>",
    itemOpenTag: "<dd>",
    itemCloseTag: "</dd>",
    termOpenTag: "<dt>",
    termCloseTag: "</dt>",
  },
];

let ids: string[] // Stack of open list IDs.
;

export function render(reader: Io.Reader, writer: Io.Writer): boolean {
  if (reader.eof()) Options.panic("premature eof");
  let startItem: ItemInfo | null;
  if (!(startItem = matchItem(reader))) {
    return false;
  }
  ids = [];
  renderList(startItem, reader, writer);
  // ids should now be empty.
  if (ids.length !== 0) Options.panic("list stack failure");
  return true;
}

function renderList(
  item: ItemInfo,
  reader: Io.Reader,
  writer: Io.Writer,
): ItemInfo | null {
  ids.push(item.id);
  writer.write(BlockAttributes.inject(item.def.listOpenTag));
  let nextItem: ItemInfo | null;
  while (true) {
    nextItem = renderListItem(item, reader, writer);
    if (!nextItem || nextItem.id !== item.id) {
      // End of list or next item belongs to parent list.
      writer.write(item.def.listCloseTag);
      ids.pop();
      return nextItem;
    }
    item = nextItem;
  }
}

// Render the current list item, return the next list item or null if there are no more items.
function renderListItem(
  item: ItemInfo,
  reader: Io.Reader,
  writer: Io.Writer,
): ItemInfo | null {
  const def = item.def;
  const match = item.match;
  let text: string;
  if (match.length === 4) { // 3 match groups => definition list.
    writer.write(BlockAttributes.inject(def.termOpenTag as string, false));
    BlockAttributes.id = ""; // Only applied to term tag.
    text = Utils.replaceInline(match[1], { macros: true, spans: true });
    writer.write(text);
    writer.write(def.termCloseTag as string);
  }
  writer.write(BlockAttributes.inject(def.itemOpenTag));
  // Process item text from first line.
  const itemLines = new Io.Writer();
  text = match[match.length - 1];
  itemLines.write(text + "\n");
  // Process remainder of list item i.e. item text, optional attached block, optional child list.
  reader.next();
  const attachedLines = new Io.Writer();
  let blankLines: number;
  let attachedDone = false;
  let nextItem: ItemInfo | null;
  while (true) {
    blankLines = consumeBlockAttributes(reader, attachedLines);
    if (blankLines >= 2 || blankLines === -1) {
      // EOF or two or more blank lines terminates list.
      nextItem = null;
      break;
    }
    nextItem = matchItem(reader);
    if (nextItem) {
      if (ids.indexOf(nextItem.id) !== -1) {
        // Next item belongs to current list or a parent list.
      } else {
        // Render child list.
        nextItem = renderList(nextItem, reader, attachedLines);
      }
      break;
    }
    if (attachedDone) {
      break; // Multiple attached blocks are not permitted.
    }
    if (blankLines === 0) {
      const savedIds = ids;
      ids = [];
      if (
        DelimitedBlocks.render(
          reader,
          attachedLines,
          ["comment", "code", "division", "html", "quote"],
        )
      ) {
        attachedDone = true;
      } else {
        // Item body line.
        itemLines.write(reader.cursor + "\n");
        reader.next();
      }
      ids = savedIds;
    } else if (blankLines === 1) {
      if (
        DelimitedBlocks.render(
          reader,
          attachedLines,
          ["indented", "quote-paragraph"],
        )
      ) {
        attachedDone = true;
      } else {
        break;
      }
    }
  }
  // Write item text.
  text = itemLines.toString().trim();
  text = Utils.replaceInline(text, { macros: true, spans: true });
  writer.write(text);
  // Write attachment and child list.
  writer.buffer = [...writer.buffer, ...attachedLines.buffer];
  // Close list item.
  writer.write(def.itemCloseTag);
  return nextItem;
}

// Consume blank lines and Block Attributes.
// Return number of blank lines read or -1 if EOF.
function consumeBlockAttributes(reader: Io.Reader, writer: Io.Writer): number {
  let blanks = 0;
  while (true) {
    if (reader.eof()) {
      return -1;
    }
    if (LineBlocks.render(reader, writer, ["attributes"])) {
      continue;
    }
    if (reader.cursor !== "") {
      return blanks;
    }
    blanks++;
    reader.next();
  }
}

// Check if the line at the reader cursor matches a list related element.
// Unescape escaped list items in reader.
// If it does not match a list related element return null.
function matchItem(reader: Io.Reader): ItemInfo | null {
  // Check if the line matches a List definition.
  if (reader.eof()) return null;
  const item = {} as ItemInfo; // ItemInfo factory.
  // Check if the line matches a list item.
  for (const def of defs) {
    const match = def.match.exec(reader.cursor);
    if (match) {
      if (match[0][0] === "\\") {
        reader.cursor = reader.cursor.slice(1); // Drop backslash.
        return null;
      }
      item.match = match;
      item.def = def;
      item.id = match[match.length - 2]; // The second to last match group is the list ID.
      return item;
    }
  }
  return null;
}
