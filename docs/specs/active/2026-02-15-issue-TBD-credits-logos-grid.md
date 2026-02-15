<!-- docs/specs/active/2026-02-15-issue-TBD-credits-logos-grid.md -->

# Spec: クレジット画面に logos（public/logos）を表示する（KawaiiLogos 出典を明記）

- Issue: TBD
- Owner: TBD
- Status: active
- Updated: 2026-02-15

## Context（背景 / 現状）

`apps/user/public/logos/` にロゴ画像を追加した。これらを `apps/user/app/credits/page.tsx` のクレジット画面で表示し、利用者が「何の素材・技術を使っているか」を視覚的に確認できるようにしたい。

これらのロゴ画像は **さわらつき様（SAWARATSUKI）** の **KawaiiLogos** から拝借しているため、クレジット画面に出典を明記する。

前提として、czz は UI / UseCase / Domain の責務分離を重視しているが、今回の変更は「静的アセットの表示」なので UI 層（page / component）に閉じるのが適切。

参照（tree）:
- logos: `apps/user/public/logos/*`
- credits page: `apps/user/app/credits/page.tsx`

## Goal（目的）

- クレジット画面に、追加したロゴを一覧（グリッド）で表示できる
- 画像のファイル名にスペースが含まれていても壊れない
- 画面幅に応じて見やすく折り返し、アクセシブル（alt / focus）である
- KawaiiLogos の出典と注意事項（要約）を併記し、誤解と事故を避ける

## Non-goals（やらないこと）

- ロゴ画像のリネーム・圧縮・最適化（今回の範囲外）
- 既存クレジット本文の大幅な再構成（必要最小限の追加に留める）
- 外部からロゴをダウンロードする処理の追加（ネットワーク依存を増やさない）
- ライセンス文言の全文転載は禁止掲載（必要最小限の要約と参照リンクに留める）

## Requirements（要件）

### 表示要件

- `apps/user/public/logos/` のロゴを「カード状のグリッド」で表示する
- ロゴごとに以下を表示する
  - ロゴ画像
  - 表示名（例: Next.js, React など）
  - 可能ならリンク（公式サイトやリポジトリ等）
- 画像の表示は崩れないように `object-contain` 相当で収める
- モバイル: 2列〜3列、デスクトップ: 4列〜6列程度に自然に拡張する

### 出典（KawaiiLogos）表示要件

- ロゴ一覧の近くに、以下を明記する（短く、読みやすく）
  - 出典: “KawaiiLogos by SAWARATSUKI” とリポジトリへのリンク
  - 注意: 「公式ロゴではない可能性がある」旨（誤解防止）
  - 注意: 「AI 利用・商用利用に制限がある」旨（詳細は出典のライセンス参照）
- 具体的なライセンス判断が必要になった場合に備えて、出典リンクを必ず残す

### アクセシビリティ / 安全

- 画像に alt を付ける（装飾ではなく情報なので空 alt は避ける）
- 外部リンクは `rel="noreferrer noopener"` + `target="_blank"` を付与
- クレジット画面に「各ロゴは各社の商標である」旨の注記を入れる（必要最小限）

### 実装方針（安全 / 変更容易性）

- ロゴ定義はハードコードの配列（metadata）で管理する
  - 表示名 / ファイル名 / href（任意）
  - URL は `encodeURIComponent(fileName)` を使って `/logos/<encoded>` へ変換し、スペース入りでも確実に参照する
- UI は `apps/user/app/credits/page.tsx` への最小追加、または `apps/user/src/components/credits/*` を新設して分離
  - 分離する場合も UI 層のみに留める（UseCase/Domain は触らない）
- 出典（KawaiiLogos）注記は、ロゴ定義とは別の小さなブロックにして差し替え容易にする

## Acceptance Criteria（受け入れ条件）

1. `/credits`（クレジット画面）にロゴ一覧セクションが追加されている
2. 追加したロゴ画像が全て表示される（スペース入りの `404 NotFound.png` も表示される）
3. 画面幅を変えても一覧が読みやすい（折り返し、等間隔、はみ出し無し）
4. 画像に alt が付き、外部リンクは安全属性付きで開く
5. 出典（KawaiiLogos by SAWARATSUKI）と注意事項（要約）が併記されている
6. `make verify` が成功し、`make evidence` のログが生成される

## Implementation Plan（最小ステップ）

1. 既存の `apps/user/app/credits/page.tsx` を確認し、差し込み位置を決める
2. ロゴ定義を作る（ページ内 or コンポーネント）
   - `const logos = [{ name, fileName, href? }]`
   - `src = "/logos/" + encodeURIComponent(fileName)`
3. 表示を実装（グリッド + カード + 画像 + ラベル + リンク）
4. 出典（KawaiiLogos）注記を追加（リンク + 要約）
5. 商標注記を追加
6. `make verify` → `make evidence` を実行し、ログ名を残す

## Test Plan（証拠の取り方）

- ローカル:
  - `make verify`
  - `make evidence EVIDENCE_DIR="out/evidence"`
- 手動確認:
  - `pnpm -C apps/user dev`（または既存手順）で `/credits` を開く
  - 404 NotFound のロゴ（スペース入り）が表示されることを確認
  - モバイル幅 / PC幅でレイアウトが破綻しないことを確認
  - 出典リンクが開くことを確認

## Risk / Notes

- ファイル名にスペースがあるため、`/logos/404 NotFound.png` のような直書きはブラウザ解釈に依存しやすい
  - `encodeURIComponent` を必須にして事故を回避する
- ロゴは商標・二次創作の可能性が高い
  - クレジット画面に注記を置き、必要に応じて差し替え可能な構造（metadata）にする
- KawaiiLogos には AI 利用・商用利用に関する制限が明記されている
  - 使い方が変わる（収益化/配布形態変更など）場合は、必ず出典のライセンスを再確認する
