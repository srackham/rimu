//
// Rimu
//
// By: Stuart Rackham
// https://github.com/srackham/rimu
//

module Rimu {

  // Rimu public API.
  export function render(source: string, options: Options.Values = {}): string {
    Options.update(options);
    return renderSource(source);
  }

  // Same as render() but does not update options.
  export function renderSource(source: string): string {
    var reader = new Reader(source);
    var writer = new Writer();
    while (!reader.eof()) {
      reader.skipBlankLines();
      if (reader.eof()) break;
      if (LineBlocks.render(reader, writer)) continue;
      if (Lists.render(reader, writer)) continue;
      if (DelimitedBlocks.render(reader, writer)) continue;
      throw 'no matching delimited block found';
    }
    return writer.toString();
  }

}

// Export Rimu API.
Rimu.nodeExport({render: Rimu.render});

this.Rimu = Rimu; // Fix Meteor 0.6.0 var scope incompatibility.
