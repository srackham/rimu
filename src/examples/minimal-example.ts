/*
 Simplest Rimu TypeScript application.

 tsc --module commonjs minimal-example.ts   # Compile.
 node minimal-example.js                    # Run.

 */

// Use this in a nodejs application.
// Compiles using rimu.d.ts typings from installed rimu npm package.

import Rimu = require('rimu');

// Use this in a generic application.
// Compiles using rimu.d.ts typings located in current directory.

// import Rimu = require('./rimu');

console.log(Rimu.render('Hello *Rimu*!', {safeMode:1}));

