/**
 * ssdd CLI の spec (prototype 段階)。
 * @rule / @invariant / @sideEffect の custom decorator は未実装、
 * Behavior intent は当面 doc の prose で表現。decorator 実装後は置換。
 */
namespace SsddCli;

/**
 * CLI コマンドの最小定義。
 * @invariant `name` は全 subcommand で unique
 * @invariant `description` は非空 (help 表示品質)
 */
model Command {
  name: string;
  description: string;
  arguments: Argument[];
  options: Option[];
}

/** subcommand の positional argument */
model Argument {
  name: string;
  required: boolean;
  description: string;
}

/** subcommand の named option (`--flag` / `-f`) */
model Option {
  name: string;
  short?: string;
  type: "boolean" | "string";
  description: string;
}

/** 終了コード */
enum ExitCode {
  success: 0,
  usageError: 64,
  internalError: 70,
}

/** CLI 起動 entry point (argv → ExitCode) */
op main(argv: string[]): ExitCode;

namespace Spec {
  /**
   * 新 spec の雛形を scaffold。
   * @sideEffect specs/<name>/ ディレクトリと spec.md / spec.tsp を新規作成
   */
  op add(name: string): ExitCode;

  /** spec の形式チェック */
  op validate(target: string): ExitCode;
}

namespace Project {
  /**
   * strict-sdd project の永続設定。`strict-sdd.config.json` に serialize される。
   * project 判定はこの file の存在で行う (= sentinel file)。
   * @invariant `sentinel` は常に "strict-sdd" (誤検出防止の marker)
   * @invariant `version` は bootstrap した CLI の semver
   */
  model ProjectConfig {
    /** strict-sdd project であることを示す sentinel marker */
    sentinel: "strict-sdd";

    /** bootstrap 時の CLI version */
    version: string;
  }

  /**
   * init が dir 配下に生成する artifact。
   * 言語/framework 非依存 (package.json 等は生成しない)。
   */
  enum Artifact {
    /** spec を格納する directory (`specs/`) */
    specsDir,

    /** ProjectConfig を serialize した sentinel file (`strict-sdd.config.json`) */
    config,

    /** project 名 placeholder のみの最小 template (`README.md`) */
    readme,

    /** 基本的な無視 pattern (`.gitignore`) */
    gitignore,
  }

  /**
   * 新規 strict-sdd project を bootstrap。
   * dir 省略時は cwd (".") を対象とする。既存 repo 内への bootstrap も許容。
   *
   * @sideEffect dir 配下に Artifact.specsDir / config / readme / gitignore を生成
   * @rule config (sentinel file) が既に存在する場合は何も生成せず internalError(70) で abort
   * @rule config 以外の既存 file (README.md / .gitignore 等) は上書きしない (非破壊)
   * @rule positional は dir 1 個まで、それ以外は usageError(64)
   */
  op `init`(dir?: string): ExitCode;
}
