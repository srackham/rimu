
/// <reference path="references.ts" />

/**
 * ### Rimu Modularization
 *
 * - This application uses Internal TypeScript modules and is compiled to a single rimu.js
 *   JavaScript file.
 * - `rimu.js` can be used in the browser using a script tag or can be used in Nodejs using require().
 * - Rimu API functions are explicitly exported to Nodejs with the exportCommonjs() helper.
 * - Other internal objects are exported to Nodejs for use by nodeunit unit tests.
 * - To minimize browser global namespace pollution and to disallow run-time access to internal
 *   objects all source is enveloped in a single open module named [[Rimu]].
 *
 * See [Building heterogeneous TypeScript libraries](http://srackham.wordpress.com/2012/11/20/building-heterogeneous-typescript-libraries/)
 *
 */
module Rimu {

  /**
   *
   * This is the single public API which translates Rimu Markup to HTML.
   *
   * @param source
   * Input text containing Rimu Markup.
   *
   * @param options
   * Markup translation options.
   *
   * @returns Returns HTML output text.
   *
   * Example:
   *
   *     Rimu.render('Hello *Rimu*!', {safeMode: 1});
   *
   * See `rimuc.js` and `rimuplayground.html` for examples of [[render]]  in action.
   *
   */
  export function render(source: string, options: Options.RenderOptions = {}): string {
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
