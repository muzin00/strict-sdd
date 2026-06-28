#!/usr/bin/env node
import { existsSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const VERSION = "0.1.0";

const HELP = `Usage: ssdd <command> [options]

Commands:
  init [dir]     Bootstrap a strict-sdd project (default: current dir)

Options:
  -h, --help     Show help
  -v, --version  Show version
`;

/**
 * spec: specs/cli/spec.tsp `enum ExitCode`
 */
const ExitCode = {
  success: 0,
  usageError: 64,
  internalError: 70,
} as const;

/** spec: `model ProjectConfig` を serialize した sentinel file */
const CONFIG_FILE = "strict-sdd.config.json";

/** README.md 最小 template (project 名 placeholder のみ) */
const README_TEMPLATE = `# {{PROJECT_NAME}}
`;

/** .gitignore 基本 pattern */
const GITIGNORE_TEMPLATE = `node_modules/
dist/
`;

/**
 * spec: `op main(argv: string[]): ExitCode`
 * argv は `ssdd` 以降のトークン (process.argv.slice(2))。
 * process.exit は呼ばず ExitCode を return する。
 */
export async function main(argv: string[]): Promise<number> {
  const parsed = safeParse(argv);
  if (parsed === null) {
    console.error(HELP);
    return ExitCode.usageError;
  }

  const { values, positionals } = parsed;

  if (values.version) {
    console.log(VERSION);
    return ExitCode.success;
  }

  const [command, ...rest] = positionals;

  if (command === "init") {
    return initProject(rest);
  }

  if (values.help || command === undefined) {
    console.log(HELP);
    return ExitCode.success;
  }

  console.error(`Unknown command: ${command}`);
  console.error(HELP);
  return ExitCode.usageError;
}

const OPTIONS = {
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
} as const;

/** parseArgs を wrap し、parse 失敗時は null を返す (usageError 判定用) */
function safeParse(argv: string[]) {
  try {
    return parseArgs({ args: argv, options: OPTIONS, allowPositionals: true });
  } catch {
    return null;
  }
}

/**
 * spec: `op Project.init(dir?: string): ExitCode`
 * @rule positional は dir 1 個まで、それ以外は usageError(64)
 * @rule config (sentinel file) が存在する場合は何も生成せず internalError(70)
 * @rule config 以外の既存 file は上書きしない (非破壊)
 */
function initProject(args: string[]): number {
  if (args.length > 1) {
    console.error("Usage: ssdd init [dir]");
    return ExitCode.usageError;
  }

  const dir = args[0] ?? ".";
  const configPath = join(dir, CONFIG_FILE);

  if (existsSync(configPath)) {
    console.error(`Already a strict-sdd project: ${configPath}`);
    return ExitCode.internalError;
  }

  // @sideEffect specs/ ディレクトリ
  mkdirSync(join(dir, "specs"), { recursive: true });

  // @sideEffect strict-sdd.config.json (ProjectConfig)
  const config = { sentinel: "strict-sdd", version: VERSION };
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

  // @sideEffect README.md / .gitignore (非破壊)
  writeFileIfAbsent(join(dir, "README.md"), README_TEMPLATE);
  writeFileIfAbsent(join(dir, ".gitignore"), GITIGNORE_TEMPLATE);

  console.log(`Initialized strict-sdd project in ${dir}`);
  return ExitCode.success;
}

function writeFileIfAbsent(path: string, content: string): void {
  if (!existsSync(path)) {
    writeFileSync(path, content);
  }
}

// entry guard: `node main.js` 直接実行時のみ起動 (import 時は実行しない)
const entry = process.argv[1] ? realpathSync(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
