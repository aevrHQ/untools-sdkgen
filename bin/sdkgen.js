#!/usr/bin/env node

// Compile-free runner using ts-node (for local dev) or dist/ (after npm run build)
const path = require("path");
const fs = require("fs");

const distEntry = path.join(__dirname, "../dist/index.js");
const srcEntry = path.join(__dirname, "../src/index.ts");

if (fs.existsSync(distEntry)) {
  require(distEntry);
} else if (fs.existsSync(srcEntry)) {
  // Register ts-node on the fly
  require("ts-node").register({
    project: path.join(__dirname, "../tsconfig.json"),
    transpileOnly: true,
  });
  require(srcEntry);
} else {
  console.error("sdkgen: could not find entry point. Run `npm run build` first.");
  process.exit(1);
}
