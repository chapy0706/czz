<!-- docs/issues/2026-02-15-issue-TBD-e2e-repair.md -->

# Issue: E2E（Playwright）テスト復旧と再設計（大改修後）

- Issue: TBD
- Spec: docs/specs/active/2026-02-15-issue-TBD-e2e-repair.md
- Status: draft
- Updated: 2026-02-15

## Context（背景 / 現状）
- 大改修により、既存の e2e テスト（Playwright）が大量に失敗し、現状の品質ゲートとして機能していない。
- まず「主要ユーザーフローの復旧」と「壊れにくいテスト設計」へ作り直し、以後は段階的にカバレッジを戻したい。

## Goal（勝利条件）
- 最重要のユーザーフローが CI/ローカルで安定して通る（フレーク率が低い）
- テストが壊れたときの修正コストが下がる（セレクタと責務が整理されている）

## Non-goals（やらないこと）
- 画面UXの改善（テスト復旧のための最小限の data-testid 追加は例外）
- 全テストを一気に元に戻す（段階復旧）

## Scope（Do / Don’t）
### Do（このIssueでやる）
- 失敗状況の棚卸し（分類と優先順位付け）
- 主要フローに絞ってテストを復旧（最小セット）
- テスト基盤（セレクタ方針、ヘルパ、待機の規約）を固定する
- 必要ならアプリ側に data-testid を最小限追加する

### Don’t（このIssueではやらない）
- すべての画面の網羅テスト
- Playwright 自体の大規模な設定刷新（必要最低限は可）

## Spec（Single Source of Truth）
- docs/specs/active/2026-02-15-issue-TBD-e2e-repair.md

## Evidence（証拠）
- e2e のローカル実行ログ（失敗一覧と分類）
- make verify（既存のゲートがある場合）
- make evidence（out/evidence にログ保存）
  - e2e が Makefile 直結でない場合は、e2e 用ログも out/evidence に置く

## DoD（Definition of Done）
- Spec の Acceptance Criteria を満たす
- 主要フローの e2e が安定して通る（3回連続で通る）
- 変更ファイル一覧 + SHA + evidenceログ名が揃う
- 機密情報が repo に含まれない


---

<!-- docs/specs/active/2026-02-15-issue-TBD-e2e-repair.md -->

# Spec: E2E（Playwright）テスト復旧と再設計（大改修後）

## 0. このSpecの使い方（Claude Code / Codex 向け）
このSpecは SSOT（単一の真実）として、Issue本文ではなくこのSpecを読んで作業する。

推奨フロー（プロジェクトrunbook準拠）:
1) Claude Code: 計画だけ作る（実装しない）
   - /codex spec=docs/specs/active/2026-02-15-issue-TBD-e2e-repair.md
2) Claude Code: Codexに渡すプロンプトを生成
   - /claude-codex-workflow spec=docs/specs/active/2026-02-15-issue-TBD-e2e-repair.md mode=normal
3) Codex: 実装 → e2e実行 → make verify/evidence → 引継ぎ4点

## 1. Goal（目的）
- 大改修で壊れた e2e を「全部直す」ではなく、まずは品質ゲートとして機能する最小セットに作り直す。
- テストの責務を整理して、UI変更に強い（修正しやすい）状態にする。

## 2. Non-goals（やらないこと）
- UI/UXの改修（テスト復旧に必要な data-testid を足すのは可）
- 主要フロー以外のテストの全面復旧（後続Issueで段階的に対応）
- ドメインロジック（UseCase/dsl-core）の正しさ検証を e2e で代替すること
  - それは Vitest（Unit/UseCase）側の責務

## 3. 現状認識（前提）
- リポジトリには `e2e/` が存在し、`e2e/tests/*.spec.ts` がある（Playwright）。補助として `e2e/tests/_helpers/` がある。
- 大改修により DOM 構造やルーティング、表示文言、日本語化などが変わり、過去のセレクタが壊れている可能性が高い。
- 初心者モード / 上級者モードでUIが分岐する。テスト対象は「初心者モードの主要フロー」を優先する（ただし将来拡張できる形にする）。

## 4. 直す順番（優先度）
最初に直すのは「ユーザーが価値を感じる一本道」。テストはここに集中させる。

優先フロー（最小セット）:
1) TOP → 課題一覧 → 課題詳細 → 実行 → 結果表示（正解/不正解が分かる）
2) 課題詳細内でのコマンド操作（追加/編集/削除の最低1ケース）
3) パイプライン/疑似ターミナルの表示が破綻しない（レンダリングと出力の最低1ケース）

「細部の見た目」は捨てる。ゲームの進行が壊れていないことを保証する。

## 5. Acceptance Criteria（受け入れ条件）
- AC1: 優先フロー（上記1）が e2e で安定して通る（ローカルで3回連続パス）。
- AC2: コマンド操作の最低1ケースが通る（追加→実行→結果）。
- AC3: 既存テストの棚卸しが残っている（どれを残す/捨てる/後回しにするかが分かる）。
- AC4: セレクタ方針が固定され、テストは `data-testid` を優先し、クラス名/テキスト依存を避けている。
- AC5: `make evidence` 相当のログが残る（e2e実行ログ、変更一覧、SHA）。

## 6. NFR（4軸チェック）
### 安全性（改ざん/権限/型破綻）
- テストで secret を扱わない（`.env*` を読まない/貼らない）。
- 管理APIやadmin tokenが必要なテストは、今回の最小セットから外す（必要なら後続Issueで専用設計）。
- ネットワーク外部アクセスを前提にしない（ローカル/CIの環境だけで完結）。

### 変更容易性（影響範囲）
- セレクタは `_helpers` に集約し、テスト本体からDOM詳細を追い出す。
- 画面単位の Page Object（軽量）か、locator factory を導入し、変更箇所を一箇所に寄せる。

### 性能（通信/再描画/計算）
- `waitForTimeout` 乱用は禁止。状態待ち（locatorの可視/非可視、API完了）で同期する。
- 不要なフローの繰り返しを減らす（ログイン・seed・初期化を必要最小限に）。

### 運用（ログ/再現/デバッグ）
- 失敗時に、スクリーンショット/trace/video が取れる設定を維持する。
- 「どの環境でどう実行するか」を `e2e/tests/_helpers/README.md` に短く追記する（最小の運用ドキュメント）。

## 7. 実装方針（壊れにくいテスト設計）
### 7.1 セレクタ規約（最重要）
優先順位:
1) `data-testid`（安定。UI文言変更に強い）
2) role + accessible name（ただし文言変更が多い画面は注意）
3) テキスト/クラス/DOM階層は最終手段（暫定）

命名例（アプリ側に付与する場合）:
- `top-start`
- `task-list-item`
- `task-open`
- `command-add`
- `command-run`
- `result-status`
- `result-output`

### 7.2 ヘルパ集約
既存の `e2e/tests/_helpers/ui.ts` を中心に以下を用意/整理する:
- `gotoTop(page)`
- `openTaskByIndex(page, index)` または `openTaskByTitle(page, title)`
- `ensureBeginnerMode(page, on=true)`
- `addCommand(page, { type, params })`
- `runAndWaitResult(page)`（結果画面の安定待ち）

テストは「手順の意図」だけを書く。DOM操作の詳細はヘルパに隔離する。

### 7.3 待機の原則
- クリック直後は「次の状態」を待つ（URL、見出し、結果パネル、APIレスポンスの完了）。
- `expect(locator).toBeVisible()` / `toHaveText()` などで同期する。
- どうしても非決定性が残る場合のみ、限定的に `page.waitForLoadState()` を使う。

## 8. 作業手順（Codex 実装タスク）
### Step A: 現状の失敗を棚卸し
- `e2e` のテストを実行し、失敗一覧を出す。
- 失敗は以下に分類する:
  - ルーティング変更（URL/遷移先の変更）
  - 文言変更（ラベル/ボタン名）
  - DOM構造変更（セレクタ不一致）
  - 非同期タイミング（待機不足/フレーク）
  - 前提データ不足（seed/初期値の変化）

成果物:
- `docs/issues/...` またはこのSpec末尾に「棚卸しメモ」を追記（短くてよい）。

### Step B: 最小フローの復旧（テストを削って良い）
- 既存テストを「直す」より、必要なら新規で最小フロー用specを作り直す。
- ただし、既存テスト資産（ヘルパ/設定）は再利用する。

対象ファイルの目安:
- `e2e/tests/user-flow-top-to-result.spec.ts`（優先）
- `e2e/tests/pseudo-terminal.spec.ts`
- `e2e/tests/pipeline-panel.spec.ts`
- `e2e/tests/_helpers/ui.ts`

### Step C: data-testid の追加（最小限）
- テストが role/name で安定しない場合のみ、アプリ側に data-testid を追加する。
- 追加箇所は「最小フローの画面」に限定する。

目安の配置（例）:
- `apps/user/app/page.tsx`（TOP）
- `apps/user/app/tasks/page.tsx`（一覧）
- `apps/user/app/tasks/[taskId]/page.tsx`（課題詳細）
- `apps/user/app/results/[resultId]/page.tsx`（結果）

### Step D: 安定化
- 3回連続で通るまで、待機とセレクタを整理する。
- 失敗時の trace/screenshot が取得できるか確認する。

## 9. Test Plan（証拠の取り方）
最低限:
- e2e 実行（ローカル）
- 主要フローが3回連続で pass

推奨:
- `make verify`
- `make evidence`（e2eログも out/evidence に残す）
- `git diff --name-only` を添付

## 10. Codex に渡す最小プロンプト（コピペ用）
以下を Codex CLI に貼る（人間が承認してから）。

```
対象spec: docs/specs/active/2026-02-15-issue-TBD-e2e-repair.md

やること:
- e2e（Playwright）を実行して失敗一覧を分類し、最小の主要フローを復旧する
- セレクタは data-testid を優先し、必要ならアプリ側に最小限追加する
- _helpers に手順を集約し、テスト本体を短く保つ
- 最後に e2e を3回連続で通す
- make verify と make evidence を実行し、ログを残す（e2eが別コマンドなら out/evidence にログを保存）

禁止:
- .env* / keys / tokens / secrets を読む・貼る・コミットしない
- 破壊的コマンド禁止（rm -rf / git reset --hard / git push --force）
- 外部ネットワークアクセスを前提にしない

完了時に提示するもの:
- specパス
- 変更ファイル一覧（git diff --name-only）
- git SHA（git rev-parse --short HEAD）
- evidenceログ名（out/evidence/...）
- 主要フロー3回連続passの結果（コマンドと結果）
```

## 11. 棚卸しメモ（実行後に追記する欄）
- failing tests:
  - TBD
- category:
  - TBD
- decisions:
  - TBD


References (project docs):
- docs/issues/FORMAT.md
- docs/runbook/ai-orchestration.md
- docs/runbook/claude-codex-skill-flow.md
- docs/README.md

---

## 棚卸しメモ（2026-02-15）
- 初回 e2e 失敗は Playwright ブラウザ未インストールが原因（pnpm -C e2e exec playwright install を実施）。
- 主要失敗原因:
  - `command-builder` の data-testid 未付与で `getByTestId('command-builder')` が不一致
  - 旧 UI の `cb-add-open` / `cb-result` / `cmd-edit-*` / `cmd-del-*` 依存が現行DOMと不整合
  - Debug Drawer / Pipeline Panel の UI が現行では廃止・非表示
- 対応方針:
  - 主要フロー（user-flow-top-to-result / command-builder-params / command-builder-filter-gt / command-builder-shortcuts）を現行UIに合わせて復旧
  - 廃止UI依存のテストは `test.skip` で棚卸し（理由をコメントに記載）
- Skipped テストと理由:
  - `command-builder-unix-hints.spec.ts`: pipeline panel detailed view が現行UIにない
  - `pipeline-panel.spec.ts`: pipeline panel detailed/runner view が現行UIにない
  - `pipeline-view-mode.spec.ts`: compact/detailed の切替UIが現行UIにない
  - `pseudo-terminal.spec.ts`: debug drawer pseudo-terminal が廃止（playground accordion へ移行）
