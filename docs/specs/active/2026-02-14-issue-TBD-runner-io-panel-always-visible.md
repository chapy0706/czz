<!-- docs/specs/active/2026-02-14-issue-TBD-runner-io-panel-always-visible.md -->

# Spec: Runner I/O 設定パネルを常時可視にし、未設定での Run を防ぐ（幽霊デフォルト排除）

- Status: active
- Updated: 2026-02-14
- SSOT: このSpec

## Background
Task の Run 実行で evaluate が `Runner I/O is not set` を返すケースが発生している。
以前は別パネルのプルダウンで `Input=cat input.csv` / `Output=>> output.csv` を設定できたが、現状その UI が非表示になり、ユーザーが I/O をセットできない。

さらに、コマンドパネル側に `cat input.csv` / `>> output.csv` がデフォルト表示されることで、実際の評価入力である `runnerIO` が null のままでも「設定済み」に見えてしまう。
これは「表示と真実の二重化」による典型的な事故であり、LPIC学習者（stdin/stdout/リダイレクトの学習）にとっても誤学習を誘発する。

## Goal
- Runner I/O をユーザーが必ず設定できる（UIが常時可視）
- `runnerIO` の SSOT を一つにして、表示と評価入力の不整合を無くす
- `runnerIO` 未設定のときは Run できない（サーバに投げない）

## Non-goals
- DB 保存仕様の変更（失敗保存、attemptログ化など）
- 認証や userId 紐付けの追加修正
- コマンドカタログの全面改修

## Definitions
- Runner I/O: 評価器が参照する入出力指定（例: input=cat input.csv / output=append output.csv）
- 幽霊デフォルト: UI上は値が見えるが、実際の state（runnerIO）が未設定（null）の状態

## Acceptance Criteria
### AC1: 常時可視の I/O 設定パネル
- CommandBuilder 画面（課題実行のメイン画面）に Runner I/O 設定パネルが常時表示される。
- Beginner/Advanced などの UI モード切替に関係なく、最低限「Input」「Output」2つの設定 UI が見える（全モードで I/O 表示）。

### AC2: SSOT（単一の真実）
- `runnerIO` の真実は store/state にあり、表示も evaluate へ送る入力も同じ state を参照する。
- `runnerIO` が未設定のとき、UIは `未設定` と表示する（cat/>> を “見えるだけ” で出さない＝幽霊デフォルト排除）。

### AC3: 未設定で Run できない（クライアントバリデーション）
- `runnerIO` が未設定のとき、Run ボタンは disabled になり evaluate API を呼ばない。
- disabled 状態の理由（例: “Input/Output を設定してね”）と、最短の修正行動が UI 上で分かる。

### AC4: 設定しやすさ（LPIC 学習者向け）
- パネル内に「stdin=入力 / stdout=出力 / リダイレクト」の短い説明を置く。
- 可能なら、現在の実行形を 1 行で表示する: `cat input.csv | (pipeline) >> output.csv`（表示は state に従う）。

### AC5: 多重実行の抑止（性能・運用）
- Run 実行中（evaluate in-flight）は Run ボタンを disabled にして二重発火を防ぐ。
- 1回のクリックで evaluate が複数回飛ばない（少なくとも通常操作では）。

### AC6: Verify / Evidence
- `make verify` と `make evidence` が成功する。

## UX Notes（設計の意図）
- I/O は “コマンド一覧” に混ぜず、実行環境の「配線（wiring）」として扱う。
- ただし今回は大改修を避け、既存の I/O 選択 UI があるなら復活・常時表示を優先する。
- “見えるだけのデフォルト” は禁止。未設定は未設定として見せる。

## Investigation Hints（当たり）
- CommandBuilder / PipelinePanel: 画面構成と Run ボタン周辺
  - apps/user/src/lib/command-builder/CommandBuilder.tsx
  - apps/user/src/lib/command-builder/PipelinePanel.tsx
- Store: runnerIO を持つべき場所（SSOT化）
  - apps/user/src/lib/command-builder/commandBuilderStore.ts
- Run〜evaluate 入力:
  - apps/user/src/lib/terminal/useRunToResultButton.ts
  - apps/user/src/lib/terminal/evaluateContract.ts
  - apps/user/app/api/tasks/[taskId]/evaluate/route.ts

## Implementation Plan（最小ステップ）
1. 既存の runnerIO state / setter を特定する（存在しなければ store に追加）。
2. Runner I/O 設定パネルの UI を “常時可視” に配置する（CommandBuilder 上部が第一候補）。
3. 表示は state に従うよう統一する（幽霊デフォルト撤去）。
4. Run 前にクライアントバリデーションを入れる
   - runnerIO 未設定: disabled + ガイド表示 + evaluate を呼ばない
   - in-flight: disabled
5. `make verify` → `make evidence` を実行し、引継ぎ4点を揃える。

## Test Plan
- 手動:
  - runnerIO 未設定で Run が押せない（API が飛ばない）
  - runnerIO を設定すると Run が押せる
  - クリック1回で evaluate が1回だけ飛ぶ
- 自動:
  - make verify
  - make evidence

## Claude Code / Codex 協奏コマンド
### Step 1: /codex（Plan: read-only）
/codex spec=docs/specs/active/2026-02-14-issue-TBD-runner-io-panel-always-visible.md

### Step 3: /claude-codex-workflow（Codexプロンプト生成）
/claude-codex-workflow spec=docs/specs/active/2026-02-14-issue-TBD-runner-io-panel-always-visible.md mode=normal

## Codex Prompt（minimum）
spec: docs/specs/active/2026-02-14-issue-TBD-runner-io-panel-always-visible.md

mode: normal

do:
- CommandBuilder画面に Runner I/O 設定パネルを常時表示する（Input/Output）。
- runnerIO を SSOT にして、表示と evaluate 入力を一致させる（幽霊デフォルト排除）。
- runnerIO 未設定では Run を disabled にし、evaluate API を叩かない。
- Run in-flight で二重発火を防ぐ。
- make verify と make evidence を実行し、引継ぎ4点を出す。

dont:
- DBスキーマ変更、保存仕様の大改修、認証の追加修正
- 破壊的コマンド（rm -rf / reset --hard / force push）
- git push
- secrets/keys/tokens を読まない・出さない・コミットしない

touch (likely):
- apps/user/src/lib/command-builder/CommandBuilder.tsx
- apps/user/src/lib/command-builder/PipelinePanel.tsx
- apps/user/src/lib/command-builder/commandBuilderStore.ts
- apps/user/src/lib/terminal/useRunToResultButton.ts
- apps/user/src/lib/terminal/evaluateContract.ts
- apps/user/app/tasks/[taskId]/page.tsx（必要なら）

output:
- spec パス
- git diff --name-only
- sha（git rev-parse --short HEAD）
- evidence（out/evidence/<latest>.log）
