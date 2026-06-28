#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { Cli, ExitCode } from "./cli.js";

/** `--help` / `--version` は command 横断の global option */
const GLOBAL_OPTIONS = {
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
} as const;

/**
 * spec: `op main(argv: string[]): ExitCode`
 * argv を parse し `interface Cli` の subcommand へ dispatch する free op
 * (Cli の method ではない)。argv は `ssdd` 以降のトークン (process.argv.slice(2))。
 * process.exit は呼ばず ExitCode を return する。
 */
export async function main(argv: string[]): Promise<number> {
  const cli = new Cli();

  const parsed = safeParse(argv);
  if (parsed === null) {
    console.error(cli.help());
    return ExitCode.usageError;
  }

  const { values, positionals } = parsed;

  if (values.version) {
    console.log(cli.version);
    return ExitCode.success;
  }

  const [command, ...rest] = positionals;

  switch (command) {
    case "init":
      return cli.init(rest);
    // spec: `spec add` / `spec validate` は `spec` subcommand に grouping
    case "spec":
      return dispatchSpec(cli, rest);
    case undefined:
      console.log(cli.help());
      return ExitCode.success;
    default:
      if (values.help) {
        console.log(cli.help());
        return ExitCode.success;
      }
      console.error(`Unknown command: ${command}`);
      console.error(cli.help());
      return ExitCode.usageError;
  }
}

/** `spec` subcommand (`add` / `validate`) への dispatch */
function dispatchSpec(cli: Cli, args: string[]): number {
  const [sub, ...rest] = args;
  switch (sub) {
    case "add":
      if (rest.length !== 1) {
        console.error(`Usage: ${cli.name} spec add <name>`);
        return ExitCode.usageError;
      }
      return cli.add(rest[0]);
    case "validate":
      if (rest.length !== 1) {
        console.error(`Usage: ${cli.name} spec validate <target>`);
        return ExitCode.usageError;
      }
      return cli.validate(rest[0]);
    default:
      console.error(`Unknown spec subcommand: ${sub ?? "(none)"}`);
      console.error(cli.help());
      return ExitCode.usageError;
  }
}

/** parseArgs を wrap し、parse 失敗時は null を返す (usageError 判定用) */
function safeParse(argv: string[]) {
  try {
    return parseArgs({ args: argv, options: GLOBAL_OPTIONS, allowPositionals: true });
  } catch {
    return null;
  }
}

// entry guard: `node main.js` 直接実行時のみ起動 (import 時は実行しない)
const entry = process.argv[1] ? realpathSync(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
