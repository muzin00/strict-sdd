#!/usr/bin/env node
import { parseArgs } from "node:util";

const VERSION = "0.1.0";

const HELP = `Usage: ssdd [options]

Options:
  -h, --help     Show help
  -v, --version  Show version
`;

const { values } = parseArgs({
  options: {
    help: { type: "boolean", short: "h" },
    version: { type: "boolean", short: "v" },
  },
  allowPositionals: true,
});

if (values.version) {
  console.log(VERSION);
  process.exit(0);
}

console.log(HELP);
