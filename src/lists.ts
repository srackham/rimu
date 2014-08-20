module Rimu.Lists {

  interface Definition {
    match: RegExp;
    listOpenTag: string;
    listCloseTag: string;
    itemOpenTag: string;
    itemCloseTag: string;
    termOpenTag?: string;   // Definition lists only.
    termCloseTag?: string;  // Definition lists only.
  }

  // Information about a matched list item element.
  interface ItemState {
    match: RegExpExecArray;
    def: Definition;
    id: string;
    isListItem: boolean;
    isDelimited: boolean;
    isIndented: boolean;
  }

  var defs: Definition[] = [
    // Prefix match with backslash to allow escaping.

    // Unordered lists.
    // $1 is list ID $2 is item text.
    {
      match: /^\\?\s*(-|\*{1,4})\s+(.*)$/,
      listOpenTag: '<ul>',
      listCloseTag: '</ul>',
      itemOpenTag: '<li>',
      itemCloseTag: '</li>',
    },
    // Ordered lists.
    // $1 is list ID $2 is item text.
    {
      match: /^\\?\s*(?:\d*)(\.{1,4})\s+(.*)$/,
      listOpenTag: '<ol>',
      listCloseTag: '</ol>',
      itemOpenTag: '<li>',
      itemCloseTag: '</li>',
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
      termCloseTag: '</dt>',
    },
  ];

  var ids: string[];  // Stack of open list IDs.

  export function render(reader: Reader, writer: Writer): boolean {
    if (reader.eof()) throw 'premature eof';
    var startItem: ItemState;
    if (!(startItem = matchItem(reader))) {
      return false;
    }
    ids = [];
    renderList(startItem, reader, writer);
    // ids should now be empty.
    return true;
  }

  function renderList(startItem: ItemState, reader: Reader, writer: Writer): ItemState {
    ids.push(startItem.id);
    writer.write(injectHtmlAttributes(startItem.def.listOpenTag));
    var nextItem: ItemState;
    while (true) {
      nextItem = renderListItem(startItem, reader, writer);
      if (!nextItem || nextItem.id !== startItem.id) {
        // End of list or next item belongs to ancestor.
        writer.write(startItem.def.listCloseTag);
        ids.pop();
        return nextItem;
      }
      startItem = nextItem;
    }
  }

  function renderListItem(startItem: ItemState, reader: Reader, writer: Writer): ItemState {
    var def = startItem.def;
    var match = startItem.match;
    var text: string;
    if (match.length === 4) { // 3 match groups => definition list.
      writer.write(def.termOpenTag);
      text = replaceInline(match[1], {macros: true, spans: true});
      writer.write(text);
      writer.write(def.termCloseTag);
    }
    writer.write(def.itemOpenTag);
    // Process of item text.
    var lines = new Writer();
    lines.write(match[match.length - 1]); // Item text from first line.
    lines.write('\n');
    reader.next();
    var nextItem: ItemState;
    nextItem = readToNext(reader, lines);
    text = lines.toString();
    text = replaceInline(text, {macros: true, spans: true});
    writer.write(text);
    while (true) {
      if (!nextItem) {
        // EOF or non-list related item.
        writer.write(def.itemCloseTag);
        return null;
      }
      else if (nextItem.isListItem) {
        if (ids.indexOf(nextItem.id) !== -1) {
          // Item belongs to current list or an ancestor list.
          writer.write(def.itemCloseTag);
          return nextItem;
        }
        else {
          // Render new child list.
          nextItem = renderList(nextItem, reader, writer);
          writer.write(def.itemCloseTag);
          return nextItem;
        }
      }
      else if (nextItem.isDelimited || nextItem.isIndented) {
        // Delimited blocks and Indented blocks attach to list items.
        var savedIds = ids;
        ids = [];
        DelimitedBlocks.render(reader, writer);
        ids = savedIds;
        reader.skipBlankLines();
        if (reader.eof()) {
          writer.write(def.itemCloseTag);
          return null;
        }
        else {
          nextItem = matchItem(reader);
        }
      }
    }
    // Should never arrive here.
  }

  // Translate the list item in the reader to the writer until the next element
  // is encountered. Return 'next' containing the next element's match and
  // identity information.
  function readToNext(reader: Reader, writer: Writer): ItemState {
    // The reader should be at the line following the first line of the list
    // item (or EOF).
    var next: ItemState;
    while (true) {
      if (reader.eof()) return null;
      if (reader.cursor() === '') {
        // Encountered blank line.
        // Can be followed by new list item or attached indented paragraph.
        reader.skipBlankLines();
        if (reader.eof()) return null;
        return matchItem(reader, {indented: true});
      }
      next = matchItem(reader, {delimited: true});
      if (next) {
        // Encountered new list item or attached quote, code or division
        // delimited block.
        return next;
      }
      writer.write(reader.cursor());
      writer.write('\n');
      reader.next();
    }
  }

  // Check if the line at the reader cursor matches a list related element. If
  // does return list item information else return null.  It matches
  // list item elements but 'options' can be included to also match delimited
  // blocks or indented paragraphs.
  function matchItem(reader: Reader,
      options: {delimited?: boolean; indented?: boolean;} = {}): ItemState
  {
    // Check if the line matches a List definition.
    var line = reader.cursor();
    var item = <ItemState>{};   // ItemState factory.
    for (var i in defs) {
      var match = defs[i].match.exec(line);
      if (match) {
        if (match[0][0] === '\\') {
          reader.cursor(reader.cursor().slice(1));  // Drop backslash.
          return null;
        }
        item.match = match;
        item.def = defs[i];
        item.id = match[match.length - 2];
        item.isListItem = true;
        return item;
      }
    }
    // Check if the line matches a Delimited Block definition.
    var def: DelimitedBlocks.Definition;
    if (options.delimited) {
      for (var id in {quote:0, code:0, division:0}) {
        def = DelimitedBlocks.getDefinition(id);
        if (def.openMatch.test(line)) {
          item.isDelimited = true;
          return item;
        }
      }
    }
    // Check if the line matches an Indented Paragraph definition.
    if (options.indented) {
      def = DelimitedBlocks.getDefinition('indented');
      if (def.openMatch.test(line)) {
        item.isIndented = true;
        return item;
      }
    }
    return null;
  }

  // CommonJS module exports.
  declare var exports: any;
  if (typeof exports !== 'undefined') {
    exports.Lists = Lists;
  }

}
