import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Cli, ExitCode } from "./cli.js";

/**
 * テスト対象: `class Cli` (spec: `interface Cli`) の各 method。
 * argv parse / dispatch は対象外 (= main.test.ts)。method を直接呼ぶ。
 */
const CONFIG_FILE = "strict-sdd.config.json";

let workDir: string;
let originalCwd: string;

beforeEach(() => {
  originalCwd = process.cwd();
  workDir = mkdtempSync(join(tmpdir(), "ssdd-cli-"));
  // method 内の console 出力はテスト結果に無関係なので抑制
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(workDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("Cli#init", () => {
  // @sideEffect dir 配下に Artifact.specsDir / config / readme / gitignore を生成
  it("空ディレクトリを bootstrap し success(0) を返す", () => {
    const code = new Cli().init([workDir]);

    expect(code).toBe(ExitCode.success);
    expect(statSync(join(workDir, "specs")).isDirectory()).toBe(true);
    expect(existsSync(join(workDir, CONFIG_FILE))).toBe(true);
    expect(existsSync(join(workDir, "README.md"))).toBe(true);
    expect(existsSync(join(workDir, ".gitignore"))).toBe(true);
  });

  // model Config { sentinel: "strict-sdd"; version: string }
  it("config に sentinel と version を書き込む", () => {
    new Cli().init([workDir]);

    const config = JSON.parse(readFileSync(join(workDir, CONFIG_FILE), "utf8"));
    expect(config.sentinel).toBe("strict-sdd");
    expect(config.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  // dir 省略時は cwd (".") を対象とする
  it("dir 省略時は cwd を bootstrap する", () => {
    process.chdir(workDir);

    const code = new Cli().init([]);

    expect(code).toBe(ExitCode.success);
    expect(existsSync(join(workDir, CONFIG_FILE))).toBe(true);
  });

  // @rule config (sentinel file) が既に存在する場合は何も生成せず internalError(70)
  it("既に strict-sdd project の場合は internalError(70) で abort し何も生成しない", () => {
    writeFileSync(
      join(workDir, CONFIG_FILE),
      JSON.stringify({ sentinel: "strict-sdd", version: "0.0.0" }),
    );

    const code = new Cli().init([workDir]);

    expect(code).toBe(ExitCode.internalError);
    // config 以外の artifact は生成されない
    expect(existsSync(join(workDir, "specs"))).toBe(false);
    expect(existsSync(join(workDir, "README.md"))).toBe(false);
    expect(existsSync(join(workDir, ".gitignore"))).toBe(false);
    // 既存 config も書き換えない
    const config = JSON.parse(readFileSync(join(workDir, CONFIG_FILE), "utf8"));
    expect(config.version).toBe("0.0.0");
  });

  // @rule config 以外の既存 file は上書きしない (非破壊)
  it("既存の README.md / .gitignore を上書きしない", () => {
    writeFileSync(join(workDir, "README.md"), "EXISTING README");
    writeFileSync(join(workDir, ".gitignore"), "EXISTING IGNORE");

    const code = new Cli().init([workDir]);

    expect(code).toBe(ExitCode.success);
    expect(readFileSync(join(workDir, "README.md"), "utf8")).toBe("EXISTING README");
    expect(readFileSync(join(workDir, ".gitignore"), "utf8")).toBe("EXISTING IGNORE");
    // config と specs/ は新規生成される
    expect(existsSync(join(workDir, CONFIG_FILE))).toBe(true);
    expect(existsSync(join(workDir, "specs"))).toBe(true);
  });

  // @rule positional は dir 1 個まで、それ以外は usageError(64)
  it("positional が過剰な場合は usageError(64) で何も生成しない", () => {
    const code = new Cli().init([workDir, "extra"]);

    expect(code).toBe(ExitCode.usageError);
    expect(existsSync(join(workDir, CONFIG_FILE))).toBe(false);
    expect(existsSync(join(workDir, "specs"))).toBe(false);
  });
});

describe("Cli#add (stub)", () => {
  // NOTE: scaffold template が spec 未定義のため未実装
  it("未実装のため internalError(70) を返す", () => {
    expect(new Cli().add("foo")).toBe(ExitCode.internalError);
  });
});

describe("Cli#validate (stub)", () => {
  // NOTE: 合否条件が spec 未定義のため未実装
  it("未実装のため internalError(70) を返す", () => {
    expect(new Cli().validate("specs/cli.tsp")).toBe(ExitCode.internalError);
  });
});

describe("Cli#help", () => {
  it("name と全 subcommand を列挙した usage を返す", () => {
    const help = new Cli().help();

    expect(help).toContain("ssdd");
    expect(help).toContain("init");
    expect(help).toContain("spec add");
    expect(help).toContain("spec validate");
  });
});
