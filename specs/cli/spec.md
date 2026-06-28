# ssdd CLI

## なぜこの CLI が要るか

strict-sdd の dogfooding loop を起動するため、自己開発の daily 摩擦点となる tool を持つ必要がある。spec の編集・検証・regenerate を CLI 経由で回すことで loop が成立する。

## 利用シーン

- 新 spec 開発時: `ssdd spec add <name>` で spec 雛形を scaffold
- spec 編集後: `ssdd spec validate <name>` で形式チェック
- プロジェクト開始時: `ssdd init` で新規 strict-sdd project を bootstrap

## 制約

- CLI library は使わず `node:util` parseArgs で start (subcommand 増加で摩擦が出たら lib に swap)
- output format は人間 readable と AI consumable の両立 (stdout に `--json` option を考慮)
- 失敗時の exit code を明確化 (codegen pipeline に組み込みやすくする)
- 人間は spec のみ編集 = CLI 自身の実装も最終的には spec から regenerate される (spec-as-source goal、meta-circular)

## スコープ外 (将来)

- multi-language emitter (TS / Python / Go / Rust)
- AI 連携の自動化 (現状は AI 呼出は人間が trigger する)
- IDE integration (LSP server 連携)
