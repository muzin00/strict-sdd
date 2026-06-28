/**
 * # ssdd CLI
 *
 * strict-sdd の dogfooding loop を起動するための self-development tool。
 * spec の編集・検証・regenerate を CLI 経由で回すことで loop が成立する。
 *
 * ## 制約
 * - CLI library は使わず `node:util` parseArgs で start
 *   (subcommand 増加で摩擦が出たら lib に swap)
 * - output は人間 readable と AI consumable を両立 (stdout に `--json` を考慮)
 * - 失敗時の exit code を明確化 (codegen pipeline に組み込みやすくする)
 * - 人間は spec のみ編集 = この CLI 自身も最終的には spec から regenerate される
 *   (spec-as-source goal、meta-circular)
 *
 * ## スコープ外 (将来)
 * - multi-language emitter (TS / Python / Go / Rust)
 * - AI 連携の自動化 (現状は AI 呼出を人間が trigger)
 * - IDE integration (LSP server 連携)
 *
 * NOTE: @rule / @invariant / @sideEffect は custom decorator 未実装。
 * Behavior intent は当面 doc の prose で表現し、decorator 実装後に置換する。
 */
namespace Ssdd;

// ── model ──

/**
 * CLI 自身の識別情報。`--version` 出力と project bootstrap 時の version source。
 * 提供 subcommand の集合は `interface Cli` の op 一覧が表す (commands field は持たない)。
 * @invariant `name` は非空 (起動時の識別子)
 * @invariant `version` は semver
 */
model CliInfo {
  /** CLI の実行名 (`ssdd`) */
  name: string;

  /** CLI 自身の semver */
  version: string;
}

/**
 * strict-sdd project の永続設定。`strict-sdd.config.json` に serialize される。
 * project 判定はこの file の存在で行う (= sentinel file)。
 * @invariant `sentinel` は常に "strict-sdd" (誤検出防止の marker)
 * @invariant `version` は bootstrap した CLI の semver
 */
model Config {
  /** strict-sdd project であることを示す sentinel marker */
  sentinel: "strict-sdd";

  /** bootstrap 時の CLI version */
  version: string;
}

// ── enum ──

/** 終了コード */
enum ExitCode {
  success: 0,
  usageError: 64,
  internalError: 70,
}

/**
 * init が dir 配下に生成する artifact。
 * 言語/framework 非依存 (package.json 等は生成しない)。
 */
enum Artifact {
  /** spec を格納する directory (`specs/`) */
  specsDir,

  /** Config を serialize した sentinel file (`strict-sdd.config.json`) */
  config,

  /** project 名 placeholder のみの最小 template (`README.md`) */
  readme,

  /** 基本的な無視 pattern (`.gitignore`) */
  gitignore,
}

// ── op ──

/**
 * CLI 起動 entry point (argv → ExitCode)。
 * argv を parse し `interface Cli` の subcommand へ dispatch する free op (Cli の method ではない)。
 */
op main(argv: string[]): ExitCode;

// ── interface ──

/**
 * Cli の振る舞い。各 op が 1 subcommand に対応し、op 一覧がそのまま
 * 「この CLI に存在する subcommand の集合」を表す (旧 `Cli.commands` を兼ねる)。
 */
interface Cli {
  /**
   * 新規 strict-sdd project を bootstrap。
   * dir 省略時は cwd (".") を対象とする。既存 repo 内への bootstrap も許容。
   *
   * @sideEffect dir 配下に Artifact.specsDir / config / readme / gitignore を生成
   * @rule config (sentinel file) が既に存在する場合は何も生成せず internalError(70) で abort
   * @rule config 以外の既存 file (README.md / .gitignore 等) は上書きしない (非破壊)
   * @rule positional は dir 1 個まで、それ以外は usageError(64)
   */
  `init`(dir?: string): ExitCode;

  /**
   * 新 spec の雛形を scaffold。
   * @sideEffect specs/<name>.tsp を新規作成 (flat 構成、prose は doc コメントに集約)
   */
  add(name: string): ExitCode;

  /** spec の形式チェック */
  validate(target: string): ExitCode;
}
