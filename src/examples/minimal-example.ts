/*
 Simplest Rimu TypeScript application.

 npm install rimu                           # Install Rimu module.
 tsc --module commonjs minimal-example.ts   # Compile example.
 node minimal-example.js                    # Run example.

 */

import * as rimu from "rimu";

console.log(rimu.render("Hello *Rimu*!", { safeMode: 1 }));
