# strict-sdd (Strict Spec-Driven Development)

> **Spec-Driven Development の formal / typed 実装。**
> **人間は Model, Behavior, IF を書く。実装は AI に任せろ。**
>
> Refactor は regenerate になる。

## Goal

> Spec-as-source: The spec is the main source file over time, and only the spec is edited by the human, the human never touches the code.

strict-sdd が目指す最終形はこれ。

- 編集対象は **spec (M+B+IF) のみ**。code は AI が spec から regenerate する derivative artifact
- bug fix も feature 追加も「spec を直す → regenerate」で完結
- 同じ spec から framework / 言語の異なる実装を出せる (framework disposable)
- spec と code の drift は構造的に起きない (片方向の derivation しかない)

具体例: Express → Fastify、FastAPI → Django、monolith → microservices の切替は、spec を保ったまま AI が regenerate するだけの操作になる。

## 思想

人間が書く artifact は **Model**, **Behavior**, **IF** の 3 つだけ。

- **Model** = 何が存在するか (entity, attribute, relation)
- **Behavior** = 何が起きるか (business rule, state transition, invariant, side effect)
- **IF** = どう触れるか (operation signature, view shape, contract)

この 3 つが Single Source of Truth。code (server, client, type, docs, test, DB schema) は全てここから derive される。

## なぜ strict か

巷の Spec-Driven Development は自然言語 spec が中心。LLM に渡す prompt も含めて ambiguity が残り、AI 生成のブレが大きい。

**strict-sdd は spec を形式的・型付きで矯正する**。型システムが contract を enforce し、生成空間が型で bounded される。AI のブレが極端に減る。

|                 | 自然言語 SDD      | strict-sdd              |
| --------------- | ----------------- | ----------------------- |
| spec 形式       | 自然言語 / 半構造 | 形式的・型付き          |
| AI 生成の自由度 | 広い              | 型で bounded            |
| 検証可能性      | 人間レビュー必須  | compiler が一部検証     |
| 再現性          | AI ごとに異なる   | 入力同じなら shape 一定 |

## なぜ今か

Model-Driven Architecture (MDA) は 25 年同じ夢を見て失敗してきた:

- 生成コードが編集できなかった
- round-trip が lossy だった
- model が現実を表現しきれなかった

AI codegen でこれら 3 つが全て反転する。MDA の dream が初めて feasible になる。

|                | MDA 時代         | AI 時代             |
| -------------- | ---------------- | ------------------- |
| 生成コード     | 編集不可         | AI が再生成 / patch |
| round-trip     | 形式変換で lossy | AI が双方向理解     |
| model 表現力   | 形式が縛る       | AI が gap を埋める  |
| framework 切替 | 不可能           | regenerate で可能   |

## 系譜

Design by Contract (Meyer, 1986) · Hexagonal Architecture (Cockburn, 2005) · Clean Architecture (Martin) · API-first · Schema-first · Spec-Driven Development

strict-sdd は系譜に **形式・型付き spec** と **AI codegen による framework disposability** を加える。

## status

articulation 進行中。reference 実装は今後。
