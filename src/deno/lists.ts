import * as DelimitedBlocks from "./delimitedblocks.ts";
import * as Io from "./io.ts";
import * as LineBlocks from "./lineblocks.ts";
import * as Options from "./options.ts";
import * as Utils from "./utils.ts";
import { BlockAttributes } from "./utils.ts";

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

let defs: Definition[] = [
  // Prefix match with backslash to allow escaping.

  // Unordered lists.
  // $1 is list ID $2 is item text.
  {
    match: /^\\?\s*(-|\+|\*{1,4})\s+(.*)$/,
    listOpenTag: "<ul>",
    listCloseTag: "</ul>",
    itemOpenTag: "<li>",
    itemCloseTag: "</li>"
  },
  // Ordered lists.
  // $1 is list ID $2 is item text.
  {
    match: /^\\?\s*(?:\d*)(\.{1,4})\s+(.*)$/,
    listOpenTag: "<ol>",
    listCloseTag: "</ol>",
    itemOpenTag: "<li>",
    itemCloseTag: "</li>"
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
    termCloseTag: "</dt>"
  }
];

let ids: string[] // Stack of open list IDs.
;

export function render(reader: Io.Reader, writer: Io.Writer): boolean {
  if (reader.eof()) Options.panic("premature eof");
  let start_item: ItemInfo | null;
  if (!(start_item = matchItem(reader))) {
    return false;
  }
  ids = [];
  renderList(start_item, reader, writer);
  // ids should now be empty.
  if (ids.length !== 0) Options.panic("list stack failure");
  return true;
}

function renderList(
  item: ItemInfo,
  reader: Io.Reader,
  writer: Io.Writer
): ItemInfo | null {
  ids.push(item.id);
  writer.write(BlockAttributes.inject(item.def.listOpenTag));
  let next_item: ItemInfo | null;
  while (true) {
    next_item = renderListItem(item, reader, writer);
    if (!next_item || next_item.id !== item.id) {
      // End of list or next item belongs to parent list.
      writer.write(item.def.listCloseTag);
      ids.pop();
      return next_item;
    }
    item = next_item;
  }
}

// Render the current list item, return the next list item or null if there are no more items.
function renderListItem(
  item: ItemInfo,
  reader: Io.Reader,
  writer: Io.Writer
): ItemInfo | null {
  let def = item.def;
  let match = item.match;
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
  let item_lines = new Io.Writer();
  text = match[match.length - 1];
  item_lines.write(text + "\n");
  // Process remainder of list item i.e. item text, optional attached block, optional child list.
  reader.next();
  let attached_lines = new Io.Writer();
  let blank_lines: number;
  let attached_done = false;
  let next_item: ItemInfo | null;
  while (true) {
    blank_lines = consumeBlockAttributes(reader, attached_lines);
    if (blank_lines >= 2 || blank_lines === -1) {
      // EOF or two or more blank lines terminates list.
      next_item = null;
      break;
    }
    next_item = matchItem(reader);
    if (next_item) {
      if (ids.indexOf(next_item.id) !== -1) {
        // Next item belongs to current list or a parent list.
      } else {
        // Render child list.
        next_item = renderList(next_item, reader, attached_lines);
      }
      break;
    }
    if (attached_done) {
      break; // Multiple attached blocks are not permitted.
    }
    if (blank_lines === 0) {
      let savedIds = ids;
      ids = [];
      if (
        DelimitedBlocks.render(
          reader,
          attached_lines,
          ["comment", "code", "division", "html", "quote"]
        )
      ) {
        attached_done = true;
      } else {
        // Item body line.
        item_lines.write(reader.cursor + "\n");
        reader.next();
      }
      ids = savedIds;
    } else if (blank_lines === 1) {
      if (
        DelimitedBlocks.render(
          reader,
          attached_lines,
          ["indented", "quote-paragraph"]
        )
      ) {
        attached_done = true;
      } else {
        break;
      }
    }
  }
  // Write item text.
  text = item_lines.toString().trim();
  text = Utils.replaceInline(text, { macros: true, spans: true });
  writer.write(text);
  // Write attachment and child list.
  writer.buffer = writer.buffer.concat(attached_lines.buffer);
  // Close list item.
  writer.write(def.itemCloseTag);
  return next_item;
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
  let item = {} as ItemInfo; // ItemInfo factory.
  // Check if the line matches a list item.
  for (let def of defs) {
    let match = def.match.exec(reader.cursor);
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
