import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { main } from "./main.js";

/**
 * spec: specs/cli.tsp namespace SsddCli
 * ExitCode { success: 0, usageError: 64, internalError: 70 }
 */
const SUCCESS = 0;
const USAGE_ERROR = 64;
const INTERNAL_ERROR = 70;

const CONFIG_FILE = "strict-sdd.config.json";

let workDir: string;
let originalCwd: string;

beforeEach(() => {
  originalCwd = process.cwd();
  workDir = mkdtempSync(join(tmpdir(), "ssdd-init-"));
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(workDir, { recursive: true, force: true });
});

describe("ssdd init", () => {
  // @sideEffect dir 配下に Artifact.specsDir / config / readme / gitignore を生成
  it("空ディレクトリを bootstrap し success(0) を返す", async () => {
    const code = await main(["init", workDir]);

    expect(code).toBe(SUCCESS);
    expect(statSync(join(workDir, "specs")).isDirectory()).toBe(true);
    expect(existsSync(join(workDir, CONFIG_FILE))).toBe(true);
    expect(existsSync(join(workDir, "README.md"))).toBe(true);
    expect(existsSync(join(workDir, ".gitignore"))).toBe(true);
  });

  // model ProjectConfig { sentinel: "strict-sdd"; version: string }
  it("config に sentinel と version を書き込む", async () => {
    await main(["init", workDir]);

    const config = JSON.parse(readFileSync(join(workDir, CONFIG_FILE), "utf8"));
    expect(config.sentinel).toBe("strict-sdd");
    expect(config.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  // dir 省略時は cwd (".") を対象とする
  it("dir 省略時は cwd を bootstrap する", async () => {
    process.chdir(workDir);

    const code = await main(["init"]);

    expect(code).toBe(SUCCESS);
    expect(existsSync(join(workDir, CONFIG_FILE))).toBe(true);
  });

  // @rule config (sentinel file) が既に存在する場合は何も生成せず internalError(70)
  it("既に strict-sdd project の場合は internalError(70) で abort し何も生成しない", async () => {
    writeFileSync(
      join(workDir, CONFIG_FILE),
      JSON.stringify({ sentinel: "strict-sdd", version: "0.0.0" }),
    );

    const code = await main(["init", workDir]);

    expect(code).toBe(INTERNAL_ERROR);
    // config 以外の artifact は生成されない
    expect(existsSync(join(workDir, "specs"))).toBe(false);
    expect(existsSync(join(workDir, "README.md"))).toBe(false);
    expect(existsSync(join(workDir, ".gitignore"))).toBe(false);
    // 既存 config も書き換えない
    const config = JSON.parse(readFileSync(join(workDir, CONFIG_FILE), "utf8"));
    expect(config.version).toBe("0.0.0");
  });

  // @rule config 以外の既存 file は上書きしない (非破壊)
  it("既存の README.md / .gitignore を上書きしない", async () => {
    writeFileSync(join(workDir, "README.md"), "EXISTING README");
    writeFileSync(join(workDir, ".gitignore"), "EXISTING IGNORE");

    const code = await main(["init", workDir]);

    expect(code).toBe(SUCCESS);
    expect(readFileSync(join(workDir, "README.md"), "utf8")).toBe("EXISTING README");
    expect(readFileSync(join(workDir, ".gitignore"), "utf8")).toBe("EXISTING IGNORE");
    // config と specs/ は新規生成される
    expect(existsSync(join(workDir, CONFIG_FILE))).toBe(true);
    expect(existsSync(join(workDir, "specs"))).toBe(true);
  });

  // @rule positional は dir 1 個まで、それ以外は usageError(64)
  it("positional が過剰な場合は usageError(64) で何も生成しない", async () => {
    const code = await main(["init", workDir, "extra"]);

    expect(code).toBe(USAGE_ERROR);
    expect(existsSync(join(workDir, CONFIG_FILE))).toBe(false);
    expect(existsSync(join(workDir, "specs"))).toBe(false);
  });
});
