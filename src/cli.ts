import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** spec: specs/cli.tsp `enum ExitCode` */
export const ExitCode = {
  success: 0,
  usageError: 64,
  internalError: 70,
} as const;

/** spec: `model Config` を serialize した sentinel file */
const CONFIG_FILE = "strict-sdd.config.json";

/** README.md 最小 template (project 名 placeholder のみ) */
const README_TEMPLATE = `# {{PROJECT_NAME}}
`;

/** .gitignore 基本 pattern */
const GITIGNORE_TEMPLATE = `node_modules/
dist/
`;

/** spec: `enum CommandName` のメンバー値 */
export type CommandName = "init" | "spec add" | "spec validate";

/** spec: `model Argument` */
export interface Argument {
  name: string;
  required: boolean;
  description: string;
}

/** spec: `model Option` */
export interface Option {
  name: string;
  short?: string;
  type: "boolean" | "string";
  description: string;
}

/** spec: `model Command` */
export interface Command {
  name: CommandName;
  description: string;
  arguments: Argument[];
  options: Option[];
}

/** CLI 全体の static な command 定義 (spec: `Cli.commands`) */
const COMMANDS: Command[] = [
  {
    name: "init",
    description: "Bootstrap a strict-sdd project (default: current dir)",
    arguments: [{ name: "dir", required: false, description: "target directory" }],
    options: [],
  },
  {
    name: "spec add",
    description: "Scaffold a new spec (specs/<name>.tsp)",
    arguments: [{ name: "name", required: true, description: "spec name" }],
    options: [],
  },
  {
    name: "spec validate",
    description: "Validate spec format",
    arguments: [{ name: "target", required: true, description: "spec file or dir" }],
    options: [],
  },
];

/**
 * spec: `interface Cli` (init / add / validate)。
 * 振る舞いを method として実装する。argv parse / dispatch は free op `main` (main.ts) が担い、
 * 本 class は subcommand の挙動だけを持つ。
 * process.exit は呼ばず ExitCode を return する (codegen pipeline に組み込みやすくする)。
 */
export class Cli {
  readonly name: string;
  readonly version: string;
  readonly commands: Command[];

  constructor(opts: { name?: string; version?: string } = {}) {
    this.name = opts.name ?? "ssdd";
    this.version = opts.version ?? "0.1.0";
    this.commands = COMMANDS;
  }

  /**
   * spec: `op init(dir?: string): ExitCode`
   * @rule positional は dir 1 個まで、それ以外は usageError(64)
   * @rule config (sentinel file) が存在する場合は何も生成せず internalError(70)
   * @rule config 以外の既存 file は上書きしない (非破壊)
   */
  init(args: string[]): number {
    if (args.length > 1) {
      console.error(`Usage: ${this.name} init [dir]`);
      return ExitCode.usageError;
    }

    const dir = args[0] ?? ".";
    const configPath = join(dir, CONFIG_FILE);

    if (existsSync(configPath)) {
      console.error(`Already a strict-sdd project: ${configPath}`);
      return ExitCode.internalError;
    }

    // @sideEffect Artifact.specsDir (specs/)
    mkdirSync(join(dir, "specs"), { recursive: true });

    // @sideEffect Artifact.config (strict-sdd.config.json = model Config)
    const config = { sentinel: "strict-sdd", version: this.version };
    writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

    // @sideEffect Artifact.readme / gitignore (非破壊)
    writeFileIfAbsent(join(dir, "README.md"), README_TEMPLATE);
    writeFileIfAbsent(join(dir, ".gitignore"), GITIGNORE_TEMPLATE);

    console.log(`Initialized strict-sdd project in ${dir}`);
    return ExitCode.success;
  }

  /**
   * spec: `op add(name: string): ExitCode`
   * @sideEffect specs/<name>.tsp を新規作成
   * NOTE: scaffold template が spec 未定義のため未実装 (spec を詰めてから derive)。
   */
  add(_name: string): number {
    console.error("`ssdd spec add` is not yet implemented (spec behavior pending)");
    return ExitCode.internalError;
  }

  /**
   * spec: `op validate(target: string): ExitCode`
   * NOTE: 合否条件が spec 未定義のため未実装 (spec を詰めてから derive)。
   */
  validate(_target: string): number {
    console.error("`ssdd spec validate` is not yet implemented (spec behavior pending)");
    return ExitCode.internalError;
  }

  /** spec: `Cli.commands` から help を生成 */
  help(): string {
    const rows = this.commands.map((c) => `  ${c.name.padEnd(14)} ${c.description}`).join("\n");
    return `Usage: ${this.name} <command> [options]

Commands:
${rows}

Options:
  -h, --help     Show help
  -v, --version  Show version
`;
  }
}

function writeFileIfAbsent(path: string, content: string): void {
  if (!existsSync(path)) {
    writeFileSync(path, content);
  }
}
