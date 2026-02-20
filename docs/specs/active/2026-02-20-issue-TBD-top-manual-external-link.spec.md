// docs/specs/active/2026-02-20-issue-TBD-top-manual-external-link.md
# Spec: TOPのわかばアイコン → マニュアル（Googleスライド外部リンク）を開く

- Status: active
- Updated: 2026-02-20
- Owner: TBD

## Background
Googleスライドで作成した「指示厨ゲーム マニュアル」を、アプリTOP画面から参照できるようにする。
TOP画面左下の「わかばマーク」アイコンを入口にする方針は決定済みで、クリック先は **外部リンク（GoogleスライドURL）** とする。

## Goal
- TOP画面左下のわかばアイコンをクリックすると、マニュアル（Googleスライド）を開ける
- セキュリティ・アクセシビリティ・運用性（URL差し替え）を担保する

## Non-goals
- マニュアルの内容編集、スライド構成の変更
- アプリ内埋め込み（iframe）表示
- 初心者/上級者モード別のマニュアル分岐（今回は単一URL）

## Requirements
### UX
- 位置: TOP画面の左下（既存レイアウトの意図を壊さない）
- 表示: わかばアイコン（クリック/タップ可能）
- クリック時: マニュアルを **別タブ** で開く（モバイルはOS挙動に従う）
- ツールチップ or 補助テキスト: 「マニュアルを開く」相当（UIの邪魔にならない範囲）

### Accessibility
- ボタン/リンクに `aria-label` を付与（例: "マニュアルを開く"）
- キーボード操作でフォーカス可能、フォーカスリングが視認できる
- コントラスト確保（背景に沈まない）

### Security
- 外部リンクは `target="_blank"` の場合、必ず `rel="noopener noreferrer"` を付与
- URLは **コード直書きではなく設定値** として差し替え可能にする
  - 優先: `NEXT_PUBLIC_CZZ_MANUAL_URL`（無ければ安全な既定値 or 非表示）
- URLが未設定/不正形式のときは「非表示」または「クリック不可」にして事故を避ける

### Observability / Ops
- クリック計測（任意）: 既存の計測基盤があればイベント送信（無ければ今回スコープ外）
- 将来、URL変更が頻繁に起きる想定のため env で差し替えできるのが必須

## Acceptance Criteria
- AC1: TOP画面に、左下固定のわかばアイコンが表示される
- AC2: クリック/タップで Googleスライドのマニュアルが開く
- AC3: `target="_blank"` + `rel="noopener noreferrer"` が適用されている（外部リンク安全対策）
- AC4: URL未設定/不正時に、ユーザーが壊れた導線を踏まない（非表示 or 無効化）
- AC5: キーボードでフォーカスでき、`aria-label` が付いている
- AC6: `make verify` が成功する（lint/typecheck/test）

## Implementation Notes（当たり）
- TOP画面のコンポーネント（例: `apps/user/app/page.tsx` 近辺）に、左下固定のリンクUIを追加
- 既存の「音量パネル」「初心者モード」などの固定UIと干渉しないように配置を調整
- `NEXT_PUBLIC_CZZ_MANUAL_URL` を参照してURLを決定
  - バリデーション: `new URL(value)` が通るか（try/catch）
  - `https:` 以外は弾く（可能なら `https://docs.google.com/` のみ許可）

## Test Plan
- Unit（任意）: URLバリデーション関数のテスト（https以外を弾く等）
- E2E（任意）: リンクが存在すること（URL遷移までは外部のため確認対象外）
- Verify:
  - `make verify`
  - （任意）`make evidence`（今回の作業粒度ならverifyのみでもよいが、可能なら残す）

## Rollback
- わかばリンクUIの追加差分を戻すだけで良い（DB変更なし）
