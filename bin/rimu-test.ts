/*
 Simplest test for rimu.d.ts

 tsc --module commonjs rimu-test.ts   # Compile.
 node rimu-test.js                    # Run.

 */

/// <reference path="rimu.d.ts" />

import Rimu = require('rimu');

console.log(Rimu.render('Hello *Rimu*!', {safeMode:1}));

