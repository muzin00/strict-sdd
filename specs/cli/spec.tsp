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
   * 新規 strict-sdd project を bootstrap。
   * @rule 既存ディレクトリが strict-sdd project の場合は abort
   */
  op `init`(dir?: string): ExitCode;
}
