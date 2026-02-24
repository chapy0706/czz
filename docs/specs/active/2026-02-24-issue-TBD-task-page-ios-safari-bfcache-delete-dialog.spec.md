// docs/specs/active/2026-02-24-issue-TBD-task-page-ios-safari-bfcache-delete-dialog.md
# Spec: iOS Safari「戻る」後にコマンド削除確認ダイアログが出ない問題を修正する（BFCache対策）

- Status: active
- Updated: 2026-02-24
- Owner: TBD

## Background
実ユーザー（iPhone13 mini / iOS Safari）から、課題画面でコマンド削除ボタン押下時に削除確認ダイアログが表示されず、結果としてコマンド削除ができない不具合が報告された。

再現条件は「課題画面 → ログイン画面へ遷移 → Safariのブラウザ戻るで課題画面に戻る → 任意のコマンド設定を開く → 削除ボタン」であり、ページの再読み込みをすると再現しなくなる。PCでは再現しない。

この挙動は iOS Safari の Back/Forward Cache（BFCache）による“ページ復元”で、React/Next.js の状態・Portal（Dialog）・イベント接続が不整合になる典型症状と整合するため、復元検知と画面状態の正規化（reset/refresh）で再現を防ぐ。

## Goal
- iOS Safari で「ログイン画面へ遷移後、ブラウザ戻るで課題画面に戻る」ケースでも、コマンド削除確認ダイアログが確実に表示され、削除が可能になる
- BFCache復元時の状態不整合を吸収し、ユーザーが壊れた導線を踏まないようにする

## Non-goals
- iOS Safari以外の戻る挙動の全網羅（ただし副作用がない範囲で改善は歓迎）
- Clerkのログインフローの刷新
- UI全体のレイアウト改修

## Requirements
### Functional
- コマンド削除ボタン押下で、削除確認ダイアログが表示される
- ダイアログで「削除」を確定すると、対象コマンドが削除される
- ダイアログで「キャンセル」を選ぶと、状態が元に戻る

### BFCache対策（重要）
- `pageshow` イベントで BFCache復元を検知する
  - `event.persisted === true` の場合をBFCache復元とみなす
- BFCache復元時は、課題画面のUI状態を正規化する（いずれか、または組み合わせ）
  - (推奨) UI state（選択中コマンド/編集パネル/ダイアログopen等）をリセット
  - (推奨) 必要であれば `router.refresh()` を実行し、描画・データ・Providerの整合を取り直す
  - (代替) どうしても直らない場合のみ `window.location.reload()` を採用（最終手段）

### Security
- 外部へ不要な情報を送信しない（ログはconsoleに留める、または既存の計測基盤に準拠）
- “戻る”対策で認証状態が崩れないこと（未ログインでの操作は従来通りガード）

### Accessibility / UX
- BFCache復元時のリセット/refreshはユーザーに過度な驚きを与えない（画面が真っ白になる等を避ける）
- 既存の操作感（削除ボタンの位置、ダイアログUI）は維持

## Proposed Approach（推奨案）
1) 課題画面（コマンド編集/削除が行えるページ）に `useEffect` で `window.addEventListener("pageshow", ...)` を追加  
2) `persisted === true` を検知したら、以下を実施:
   - アプリ内の “編集/選択状態” をクリア（Zustand等のstoreなら専用resetアクション）
   - その後 `router.refresh()` で再同期（必要な場合のみ）
3) 削除ボタン押下のイベントが発火しているか確認（発火しているのに表示されないならDialog/Portal問題）
4) 再現E2Eが難しいため、最小限として “BFCache復元検知のユニットテスト or 関数テスト” を用意（任意）

## Acceptance Criteria
- AC1: 指定の再現手順（iOS Safari）で、削除確認ダイアログが表示される
- AC2: ダイアログで削除確定するとコマンドが削除される
- AC3: BFCache復元（`pageshow.persisted===true`）時に、UI状態が破綻しない（削除・編集・表示が正常）
- AC4: PC/他ブラウザの通常操作に悪影響がない
- AC5: `make verify` が成功する（lint/typecheck/test）

## Diagnostics / Investigation Notes（作業メモ）
- まず確認すること:
  - 削除ボタン `onClick` が発火しているか（console logで可）
  - BFCache復元になっているか（pageshow persisted）
- もし `onClick` すら発火しない場合:
  - 透明レイヤ（pointer-events）/フォーカス/スクロールロックの残骸が疑わしい
  - Dialog open時の overlay が閉じずに残っている可能性

## Test Plan
- 手動（必須）:
  - iPhone13 mini（またはiOS Safari）で再現手順を実施し、修正後に再現しないこと
- 自動（任意）:
  - BFCache復元検知ロジックのユニットテスト
  - 既存E2Eに影響がないこと（通ること）

## Rollback
- `pageshow` ハンドラと reset/refresh の追加差分を戻すだけで良い（DB変更なし）
