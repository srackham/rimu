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

  // Same as render() but does not reset macros or update options.
  export function renderSource(source: string): string {
    var reader = new Reader(source);
    var writer = new Writer();
    while (!reader.eof()) {
      reader.skipBlankLines();
      if (reader.eof()) break;
      if (Macros.renderInclusions(reader)) continue;
      if (LineBlocks.render(reader, writer)) continue;
      if (Lists.render(reader, writer)) continue;
      if (DelimitedBlocks.render(reader, writer)) continue;
      // We should never arrive here because a normal paragraph (the last
      // delimited block) should catch all.
    }
    return writer.toString();
  }

}

// CommonJS module exports.
declare var exports: any;
if (typeof exports !== 'undefined') {
  exports.render = Rimu.render;
}

this.Rimu = Rimu; // Fix Meteor 0.6.0 var scope incompatibility.
