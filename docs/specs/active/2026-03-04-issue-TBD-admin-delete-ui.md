// docs/specs/active/2026-03-04-issue-TBD-admin-delete-ui.md

# Spec: 管理画面 / 課題の削除UIを追加してCRUDを完成させる（ペルソナ反映）

- Issue: TBD
- Owner: TBD
- Status: draft
- Updated: 2026-03-04
- Persona: docs/personas/admin-console-primary-user.md

## Context（背景 / 現状）

管理画面（`apps/admin`）は以下が実装済み。

- TOP（ダッシュボード）: `/`（Metricsは「Coming Soon」）
- 課題一覧: `/tasks`
- 課題新規作成: `/tasks/new`
- 課題編集: `/tasks/[taskId]/edit`
- API は CRUD そろっている（特に DELETE は実装済み）
- ただし **削除 UI が未実装**（一覧・編集のどちらにも削除ボタンが無い）

## Persona-driven UI（この機能で最優先のUX）

ペルソナ: `docs/personas/admin-console-primary-user.md`

- 「削除できるか分からない」「押していいか怖い」を潰す
- 文字だらけにしない（説明は短く、視覚で状態が分かる）
- “地味にカッコいい”トーン（落ち着いたUI＋アクセント1色）

## Goal（勝利条件）

- 管理画面から **課題を削除できる**
- 誤操作を防ぐため **確認ステップ（Confirm）** がある
- 削除後、一覧が正しく更新される（行が消える / 再取得される）
- 実行中/成功/失敗が視覚的に分かる（最小でOK）

## Non-goals（やらないこと）

- Metrics（ダッシュボード数値）の実装
- 認可方式の変更
- UI大改修（デザイン刷新）
- 物理削除→論理削除への変更
- 一括削除 / 復元 / 監査ログUI

## 対象範囲（Scope）

### Do（このSpecでやる）

- `/tasks` 一覧画面に削除アクションを追加（推奨: Actions カラム）
- 削除前の確認UI（キャンセル可能）
- DELETE 実行中の状態（disabled + 何かしらの処理中表現）
- 成功時: 一覧を更新（SWR mutate / refetch / state更新）
- 失敗時: エラー表示（短く・責めない文言、必要ならトースト）

### Don’t（このSpecではやらない）

- `/tasks/[taskId]/edit` への削除ボタン追加（余裕があれば別Issue）
- 詳細な説明文の増量（文字密度は上げない）

## 仕様（UI / UX）

### 1) 削除ボタンの置き場所（必須）

- `/tasks` の Actions カラムに「削除」ボタンを追加する

理由: 「探す」コストをなくす。行末に操作が集約されて直感的。

### 2) 確認UI（必須）

最低限:

- 削除ボタン押下 → 確認が出る
- キャンセルできる
- 確認でのみ DELETE が実行される

推奨文言（短く、怖くしすぎない）:

- タイトル: 「この課題を削除しますか？」
- 補足: 「削除すると元に戻せません」
- ボタン: 「キャンセル」 / 「削除する」

実装方式:

- 既に shadcn/ui の Dialog/AlertDialog があるならそれを使う
- 無い場合は `window.confirm()` でも可（ただしUI一貫性は落ちるので、既存次第で判断）

### 3) 実行中/成功/失敗（必須）

- 実行中: 削除ボタンをdisabled（連打不安を潰す）
- 成功時: 一覧から消える + ささやかな成功通知（トースト/メッセージ）
- 失敗時: 「削除できませんでした」程度の短い通知（詳細は console でOK、機密は出さない）

### 4) 色/トーン（ペルソナ準拠）

- 基本は落ち着いた配色（既存テーマに従う）
- 重要操作のアクセントは統一
- 危険操作（削除）は注意色で統一（ただし煽りすぎない）

## API 前提（契約）

削除APIは実装済みであることが前提。

- 期待するエンドポイント（候補）: `DELETE /api/admin/tasks/[taskId]`

実装前に実体を必ず確認する（`apps/admin` / `apps/user` どちらにあるか）。

## 候補ファイル（当たり）

- UI
  - `apps/admin/app/tasks/page.tsx`（一覧）

- API client / fetch helper
  - `apps/admin/src/lib/*`（既存の tasks client があればそこ）

- API（実体確認）
  - `apps/admin/app/api/admin/tasks/*`
  - `apps/user/app/api/admin/tasks/*`

## Acceptance Criteria（受け入れ条件）

- AC1: `/tasks` 一覧で任意の課題に対して削除操作ができる
- AC2: 削除前に確認があり、キャンセル時は何も変化しない
- AC3: 削除成功後、一覧から対象行が消える（または再取得で消える）
- AC4: 削除失敗時、ユーザーが失敗を認知できる表示がある
- AC5: 二重送信ができない（連打しても1回しか飛ばない）
- AC6: 画面の文字密度が上がりすぎない（説明は短く、状態は視覚でも分かる）

## Test Plan（証拠の取り方）

- 手動
  - `/tasks` で削除 → キャンセル → 変化なし
  - `/tasks` で削除 → 確認 → 行が消える
  - 失敗系（権限/ネットワーク断）でエラー表示が出る

- Evidence
  - `make verify`
  - `make evidence`

## Implementation Plan（最小ステップ）

1. 一覧UIの Actions カラム周りを特定
2. 削除ボタン追加 → 確認UI追加
3. DELETE 呼び出し（既存 client があれば再利用）
4. 成功時に一覧更新（SWR mutate / refetch）
5. 成功/失敗の通知（短く、視覚的に）
6. `make verify` → `make evidence` → 引継ぎ4点を出す
