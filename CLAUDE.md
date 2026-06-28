# CLAUDE.md

strict-sdd プロジェクトで作業する際の指針。

## プロジェクト前提

- source of truth は `specs/*.tsp`（型付き spec = Model / Behavior / IF）。code は spec から derive される artifact。
- 人間が編集するのは spec のみ。test / 実装 / 設定は spec を満たすよう derive する。
- 一時的な要求は repo にファイル化しない。Issue（intake）か、branch 名・commit message に落とす。

## ブランチ運用

- 編集を伴う作業指示を受けたら、default branch (`main`) 上で作業を始めない。
- Issue がない小さな修正でも、作業開始前に feature branch を切る:
  - 指示内容から `<type>/<kebab-case-desc>` を生成する（type: feat / fix / refactor / chore / docs など）。
  - `git checkout -b <branch>` してから編集に入る。
- 読み取り専用の調査・質問では branch を切らない。
- 一時的な作業メモは branch 名が兼ねる。requirements.md のような中間ファイルは作らない。

## 開発フロー

要求 → spec (`specs/*.tsp`) に M/B/IF を定義 → TDD でテスト → 実装 → PR。

各ステップは slash command（`/issue-checkout`, `/commit-message`, `/pr-create`, `/pr-merge` など）で回す。
