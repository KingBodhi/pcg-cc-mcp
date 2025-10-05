#!/usr/bin/env node

if (!process.argv.includes("--mcp")) {
  process.argv.splice(2, 0, "--mcp");
}

require("./cli.js");
