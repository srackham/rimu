/*
 Simplest test for rimu.d.ts

 tsc --module commonjs rimu-test.ts   # Compile.
 node rimu-test.js                    # Run.

 */

import Rimu = require('rimu');  // Implicitly imports rimu.d.ts

console.log(Rimu.render('Hello *Rimu*!', {safeMode:1}));

