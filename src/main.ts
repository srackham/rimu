/*

Rimu

By: Stuart Rackham
https://github.com/srackham/rimu

*/

/*
## Modularization

- This application uses Internal TypeScript modules and is compiled to a single rimu.js
  JavaScript file.
 - rimu.js can be used in the browser using a script tag or can be used in Nodejs using require().
- Rimu API functions are explicitly exported to Nodejs with the exportCommonjs() helper.
- Similarly other internal objects are exported to Nodejs for use by nodeunit unit tests.
- To mimimize browser global namespace pollution all source is enveloped in a single open module
  named Rimu.
 - /// <reference path="..."/> directives are unnecessary because all files are included
 in the compile command.

See http://srackham.wordpress.com/2012/11/20/building-heterogeneous-typescript-libraries/
*/

/// <reference path="references.ts" />

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
Rimu.exportCommonjs({render: Rimu.render});

this.Rimu = Rimu; // Fix Meteor 0.6.0 var scope incompatibility.
