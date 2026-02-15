<!-- docs/specs/active/2026-02-15-issue-TBD-sync-docs-root-to-current.md -->

# Spec: docs/直下ドキュメントを現行仕様へ同期（docs/* 入口を再整備）

- Issue: TBD
- Status: active
- Updated: 2026-02-15
- Owner: TBD

## Goal（勝利条件）

docs 配下にドキュメントが増えてきたため、**docs直下（docs/*.md）のみ**を「今の仕様に合う入口」として更新する。  
読者が迷子にならず、運用（spec/issue/runbook）と実装（apps/packages/infra）の関係がすぐ掴める状態にする。

## Non-goals（やらないこと）

- docs のサブフォルダ（`docs/runbook/**`, `docs/issues/**`, `docs/specs/**`, `docs/tips/**` など）を編集しない
- アプリ実装（`apps/**`, `packages/**`, `infra/**`）を変更しない
- ドキュメントの“大改稿”（思想や構成をゼロから作り直す）よりも、**現行との差分吸収**を優先する

## Scope（編集対象）

次の **docs直下のみ**（サブフォルダは除外）。

- docs/README.md
- docs/tech-stacks.md
- docs/czz_architecture.md
- docs/architecture-diagram.md
- docs/coding-guidelines.md
- docs/CONTRIBUTING.md
- docs/czz_driven_development_doc.md
- docs/dsl-cheatsheet.md
- docs/seed-and-test.md
- docs/dev-memo-port-3100-eaddrinuse.md

## 背景 / 現状

- docs に issues / runbook / specs などが増え、**入口（docs直下）がどれを指すか曖昧**になっている。
- SSOT（Single Source of Truth）は `docs/specs/active/*.md` に置く運用が固まっているため、docs直下は「仕様の真実」ではなく **“導線” と “現在地”** を担うべき。
- 同じ内容の重複が増えるほど、更新漏れでドキュメントが腐る（仕様ズレの温床）。

## 方針（ドキュメントの役割を固定する）

### docs/README.md（入口）
- 「czz は何か」「どこから読めばいいか」「SSOTはどこか」を最短で示す
- 詳細は各ドキュメントへ誘導し、README 自体は太らせない
- 初心者/上級者（UNIX）モード、管理画面（apps/admin）の存在を明記する

### docs/tech-stacks.md（技術の棚卸し）
- 採用技術を **役割別**に整理（UI / API(BFF) / Domain / DSL / DB / QA）
- “なぜそれか” を 1行で添える（過度に長文にしない）
- バージョン固定が必要なものだけを書く（曖昧なら「App Router」等の表現に寄せる）

### docs/czz_architecture.md（設計の説明）
- Clean Architecture の依存方向（Domain → Application → Infra）と、Next.js（UI/API）との接続点を説明
- 重要な「境界」を明文化する（例: unknown→Zod、Server/Client、Repository interface）
- 詳細運用（AI協奏や手順）は runbook に逃がし、ここは “設計の地図” に留める

### docs/architecture-diagram.md（図への導線）
- 図がある場合: どこにあるか、更新ルール（何を描く/描かない）を書く
- 図が無い場合: “今は無い” と明記し、`docs/czz_architecture.md` への導線を貼る
- 画像生成やSVGの話は「リンク」に留め、手順の詳細は runbook 側へ（docs直下を太らせない）

### docs/coding-guidelines.md（実装の憲法）
- 「安全性・変更容易性・性能・運用」の4軸で判断する文化を明文化
- czz 固有のルール（例: Zod境界、ログ/機密、破壊的コマンド禁止、monorepoでの編集対象確認）を集約
- “こう書く” の前に “なぜそうする” を 1段だけ書く（教育用途）

### docs/CONTRIBUTING.md（参加方法）
- Issue は入口、spec が真実、evidence が証拠、という運用を最初に書く
- PR/コミットの最小ルール、レビュー観点、DoD を短く
- `docs/runbook/*` への誘導を明確にする（ここ自体は短く）

### docs/czz_driven_development_doc.md（AI駆動開発の位置づけ）
- “AIで回す” の是非より、**ズレない仕組み**（spec/plan/verify/evidence）を説明
- 詳細な手順は runbook にリンク（例: `docs/runbook/docs_runbook_claude_codex_skill_flow.md`）
- 禁止事項（secrets/破壊的コマンド/外部ネットワーク）をここにも1回だけ再掲

### docs/dsl-cheatsheet.md（DSLの早見表）
- DSL の “外形” と “命令セット” を短く、例は最小
- Beginner表記 ⇄ UNIX表記 があるなら対応表を置く（UI言語の揺れを止める）
- 実際の命令一覧は code（commandCatalog 等）に依存するため、**追従方法**（どこを見て更新するか）を明記

### docs/seed-and-test.md（動かし方）
- ローカルの基本コマンド（make / pnpm）を、目的別に整理
- DB系は “安全側の注意” を必ず書く（誤爆防止: DB_URL/環境切替）
- e2e の入口（scripts/run-e2e.mjs 等）へ導線を貼る

### docs/dev-memo-port-3100-eaddrinuse.md（トラブルメモ）
- 具体的な再現/対処（lsof/kill/設定確認）だけに絞る
- “恒久対応” は seed-and-test もしくは runbook へ誘導（このメモは短命でよい）

## ドキュメント共通ルール（必須）

- 用語を固定する: 「初心者モード / 上級者（UNIX）モード」「SSOT」「spec」「evidence」
- 参照リンクは **相対パス**（`./tech-stacks.md` のように）を基本にする
- docs直下は “入口” として短めに保つ（詳細は subfolder へ誘導）
- 機密情報を一切書かない（トークン、鍵、URLの直書きなど）
- 破壊的コマンドを例示しない（必要なら「やらない」だけを書く）

## Acceptance Criteria（受け入れ条件）

- docs直下の対象ファイルが、現行の repo 構成（apps/user, apps/admin, packages/*, infra/*, docs/{issues,runbook,specs}）に矛盾しない
- docs/README.md から、少なくとも以下へ辿れる導線がある
  - 設計: `./czz_architecture.md`
  - 技術: `./tech-stacks.md`
  - ルール: `./coding-guidelines.md`
  - 運用: `./czz_driven_development_doc.md`（そこから runbook へ）
  - DSL: `./dsl-cheatsheet.md`
  - 実行/検証: `./seed-and-test.md`
- docs直下の記述が、runbook/spec の運用方針（specが真実、issueは入口、evidenceを残す）と整合している
- “サブフォルダのファイル内容” を複製しない（リンクで誘導する）
- 変更後に `make verify` が通る（ドキュメントだけでも、最低限の品質ゲートとして実施）

## Implementation Plan（最小ステップ）

1. 現行 repo を確認し、上記9ファイルの内容を読み、ズレ（古い構成/用語/導線）を列挙
2. docs/README.md を “入口” として再構成し、他 docs への導線を確定
3. 各ドキュメントの役割を上の方針に合わせて、重複を減らしつつ更新
4. 相対リンクの整合性を確認（リンク切れがないこと）
5. `make verify` → `make evidence` を実行し、ログを残す

## Test Plan（証拠）

- `make verify`
- `make evidence`
- 変更ファイル一覧（`git diff --name-only`）
- SHA（`git rev-parse --short HEAD`）
- evidenceログ名（`out/evidence/*.log`）
