/*
 Simplest Rimu TypeScript application.

 npm install rimu                           # Install Rimu module.
 tsc --module commonjs minimal-example.ts   # Compile example.
 node minimal-example.js                    # Run example.

 */

// Use this in a nodejs application.
// Compiles using rimu.d.ts typings from rimu npm package.

import Rimu = require('rimu');

// Use this in a generic application.
// Compiles using rimu.d.ts typings located in current directory.

// import Rimu = require('./rimu');

console.log(Rimu.render('Hello *Rimu*!', {safeMode:1}));

