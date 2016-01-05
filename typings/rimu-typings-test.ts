/*
 Simplest test for rimu.d.ts

 tsc --module commonjs rimu-typings-test.ts   # Compile.
 node rimu-typings-test.js                    # Run.

 */

import Rimu = require('rimu');

console.log(Rimu.render('Hello *Rimu*!', {safeMode:1}));

