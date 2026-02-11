<!-- docs/specs/active/2026-02-11-issue-TBD-zustand-persist-terminalstore-migrate.md -->

# Spec: zustand persist 警告の解消（terminalStore: migrate/version 追加）

- Status: active
- Updated: 2026-02-11
- SSOT: このSpec（当面）

## Background
ブラウザ console に以下の警告が継続して出ている。

- `State loaded from storage couldn't be migrated since no migrate function was provided`
- 発生箇所: `apps/user/src/lib/terminal/terminalStore.ts`

Zustand `persist` が localStorage から state を復元する際、過去の保存データの形式差異を吸収する `migrate` が無いことで発生している。

## Goal
- console の migrate 警告を解消する
- 将来 state 形状が変わっても、古い永続化データが原因で壊れないようにする
- 既存 UI/機能の挙動を変えない（「履歴の永続化」は維持。ただし移行不能データは安全に破棄する）

## Non-goals
- 端末UI/プレイグラウンド/結果画面などの仕様変更
- 永続化方式の全面刷新（IndexedDB 化など）
- 既存ユーザーの履歴データを完全に保持し続けること（互換性が不明な場合は破棄を優先）

## Policy（安全側の方針）
- 互換性が不明な永続化データは **破棄（初期化）** する
- 保存対象は必要最小限に絞る（可能なら `partialize`）
- 破棄/移行の判断は `version` と `migrate` で制御する

## Acceptance Criteria
### A. 警告の解消
- 開発環境で該当の console warning が出ない

### B. 安全な移行（または破棄）
- `persist` に `version` を設定する
- `persist` に `migrate` を実装する
- 互換性が不明な場合、`history` を `[]` に初期化して起動できる（例外を出さない）

### C. 既存挙動の維持
- 通常の操作（履歴の追加/表示）が従来通り動く
- UI 表示や導線は変更しない（ロジックのみ）

### D. 証拠
- `make verify` / `make evidence` 成功
- 引継ぎ4点（spec / 変更ファイル / SHA / evidenceログ）

## Target Files
- `apps/user/src/lib/terminal/terminalStore.ts`

## Implementation Notes
- `persist` の options に以下を追加する。
  - `version: 1`（初期導入。今後の変更時に増やす）
  - `migrate: (persisted, version) => nextState`
- migrate 方針（推奨）
  - `version === 0` / 不明: `history: []`（初期化）
  - `persisted` が想定形なら `history` だけ拾う
- 可能なら `partialize` で保存対象を `history` のみに限定し、将来の互換性コストを下げる。

## Verification Steps
1. ブラウザをリロードし、console warning が出ないこと
2. `localStorage` に古いデータが残っていてもクラッシュしないこと（必要なら手動で古いキーを作って確認）
3. `make verify`
4. `make evidence`

## Codex Prompt（minimum）
spec: docs/specs/active/2026-02-11-issue-TBD-zustand-persist-terminalstore-migrate.md

do:
- `apps/user/src/lib/terminal/terminalStore.ts` の zustand persist に `version` と `migrate` を追加
- 互換性が不明な永続化データは安全側に倒して破棄（history を `[]` に初期化）
- 可能なら `partialize` で保存対象を必要最小限（history）に絞る
- make verify → make evidence

dont:
- UI/導線/文言の変更
- secrets/keys/tokens を扱わない
- 破壊的コマンド禁止 / git push しない

output:
- 変更ファイル一覧 / SHA / evidenceログ名
