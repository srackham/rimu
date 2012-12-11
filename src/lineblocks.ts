module Rimu.LineBlocks {

  export interface Definition {
    id?: string;  // Optional unique identifier.
    filter: (match: RegExpExecArray, block: Definition) => string;
    match: RegExp;
    replacement: string;
    variables?: bool;
    // spans and specials properties are mutually exclusive,
    // they are assumed false if they are not explicitly defined.
    spans?: bool;
    specials?: bool;
  }

  var defs: Definition[] = [
    // Prefix match with backslash to allow escaping.

    // Variable assignment.
    // name = $1, value = $2
    {
      match: /^\\?\{([\w\-]+)\}\s*=\s*'(.*)'$/,
      replacement: '',
      variables: true,
      filter: function (match, block) {
        var name = match[1];
        var value = match[2];
        value = replaceOptions(value, block);
        Variables.set(name, value);
        return '';
      },
    },
    // Variable reference.
    // name = $1
    {
      match: /^\\?\{([\w\-]+)\}$/,
      replacement: '',
      filter: function (match, block, reader) {
        var name = match[1];
        var value = Variables.get(name);
        if (!value) {
          // Variable does not exists so pass it through.
          value = '\\{' + name + '}';
        }
        // Insert the variable value into the reader just ahead of the cursor.
        reader.lines = [].concat(
            reader.lines.slice(0, reader.pos + 1),
            value.split('\n'),
            reader.lines.slice(reader.pos + 1));
        return '';
      },
    },
    // Headers.
    // $1 is ID, $2 is header text.
    {
      match: /^\\?((?:#|=){1,6})\s+(.+?)(?:\s+(?:#|=){1,6})?$/,
      replacement: '<h$1>$2</h$1>',
      variables: true,
      spans: true,
      filter: function (match, block) {
        match[1] = match[1].length.toString(); // Replace $1 with header number.
        return replaceMatch(match, block.replacement, block);
      },
    },
    // Comment line.
    {
      match: /^\/{2}(.*)$/,
      replacement: '',
    },
    // Block image: <image:src|alt>
    // src = $1, alt = $2
    {
      match: /^\\?<image:([^\s\|]+)\|([\s\S]+?)>$/,
      replacement: '<img src="$1" alt="$2">',
      variables: true,
      specials: true,
    },
    // Block image: <image:src>
    // src = $1, alt = $1
    {
      match: /^\\?<image:([^\s\|]+?)>$/,
      replacement: '<img src="$1" alt="$1">',
      variables: true,
      specials: true,
    },
    // Block anchor: <<#id>>
    // id = $1
    {
      match: /^\\?<<#([a-zA-Z][\w\-]*)>>$/,
      replacement: '<div id="$1"></div>',
      variables: true,
      specials: true,
    },
    // HTML attributes.
    // Syntax: .[class names][#id][[attributes]]
    // class names = $1, id = $2, attributes = $3
    {
      id: 'attributes',
      match: /^\\?\.([a-zA-Z][\w\- ]*)?(#[a-zA-Z][\w\-]*)?(?:\s*)?(\[.+\])?$/,
      replacement: '',
      filter: function (match, block) {
        htmlAttributes = '';
        if (match[1]) { // Class names.
          htmlAttributes += 'class="' + trim(match[1]) + '"';
        }
        if (match[2]) { // id.
          htmlAttributes += ' id="' + trim(match[2]).slice(1) + '"';
        }
        if (match[3] && Options.safeMode === 0) { // Atributes.
          htmlAttributes += ' ' + trim(match[3].slice(1, match[3].length - 1));
        }
        htmlAttributes = trim(htmlAttributes);
        return '';
      },
    },
  ];

  export var htmlAttributes: string = '';

  export function render(reader: Reader, writer: Writer): bool {
    if (reader.eof()) throw 'premature eof';
    for (var i in defs) {
      var def = defs[i];
      var match = def.match.exec(reader.cursor());
      if (match) {
        if (match[0][0] === '\\') {
          // Drop backslash escape and continue.
          reader.cursor(reader.cursor().slice(1));
          continue;
        }
        var text: string;
        if (!def.filter) {
          text = replaceMatch(match, def.replacement, def);
        }
        else {
          text = def.filter(match, def, reader);
        }
        text = injectAttributes(text);
        writer.write(text);
        reader.next();
        if (text && !reader.eof()) {
          writer.write('\n'); // Add a trailing '\n' if there are more lines.
        }
        return true;
      }
    }
    return false;
  }

  // Return block definition or null if not found.
  export function getDefinition(id: string): Definition {
    for (var i in defs) {
      if (defs[i].id === id) {
        return defs[i]
      }
    }
    return null;
  }

  // CommonJS module exports.
  declare var exports: any;
  if (typeof exports !== 'undefined') {
    exports.LineBlocks = Rimu.LineBlocks;
  }

}
