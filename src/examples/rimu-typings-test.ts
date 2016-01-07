/*
 Simplest TypeScript application.

 tsc --module commonjs rimu-typings-test.ts   # Compile.
 node rimu-typings-test.js                    # Run.

 */

// Use this in a nodejs application.
// Compiles using rimu.d.ts typings from installed rimu npm package.

import Rimu = require('rimu');

// Use this in a generic application.
// Compiles using rimu.d.ts typings located in current directory.

// import Rimu = require('./rimu');

console.log(Rimu.render('Hello *Rimu*!', {safeMode:1}));

