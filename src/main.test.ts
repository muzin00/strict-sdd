import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { main } from "./main.js";
import { ExitCode } from "./cli.js";

/**
 * テスト対象: free op `main(argv)` の argv parse と subcommand dispatch。
 * 各 subcommand の振る舞いそのものは Cli class 側 (cli.test.ts) で検証するため、
 * ここでは「正しい method / ExitCode に振り分くか」のみを見る。
 */
const CONFIG_FILE = "strict-sdd.config.json";

let workDir: string;
let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "ssdd-main-"));
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("main: global options", () => {
  it("--version で version を出力し success(0)", async () => {
    const code = await main(["--version"]);

    expect(code).toBe(ExitCode.success);
    expect(logSpy).toHaveBeenCalledWith("0.1.0");
  });

  it("command 無しは help を出して success(0)", async () => {
    const code = await main([]);

    expect(code).toBe(ExitCode.success);
    expect(logSpy).toHaveBeenCalled();
  });

  it("parse 不能な option は usageError(64)", async () => {
    expect(await main(["--unknown-flag"])).toBe(ExitCode.usageError);
  });

  it("不明な command は usageError(64)", async () => {
    expect(await main(["bogus"])).toBe(ExitCode.usageError);
  });
});

describe("main: dispatch", () => {
  it("`init` を Cli#init へ dispatch する", async () => {
    const code = await main(["init", workDir]);

    expect(code).toBe(ExitCode.success);
    expect(existsSync(join(workDir, CONFIG_FILE))).toBe(true);
  });

  it("`spec add <name>` を Cli#add へ dispatch する", async () => {
    expect(await main(["spec", "add", "foo"])).toBe(ExitCode.internalError);
  });

  it("`spec validate <target>` を Cli#validate へ dispatch する", async () => {
    expect(await main(["spec", "validate", "specs/cli.tsp"])).toBe(ExitCode.internalError);
  });

  it("`spec add` の引数不足は usageError(64)", async () => {
    expect(await main(["spec", "add"])).toBe(ExitCode.usageError);
  });

  it("未知の spec subcommand は usageError(64)", async () => {
    expect(await main(["spec", "bogus"])).toBe(ExitCode.usageError);
  });
});
