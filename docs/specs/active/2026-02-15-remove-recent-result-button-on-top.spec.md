<!-- docs/specs/active/2026-02-15-remove-recent-result-button-on-top.md -->

# Spec: TOP画面の「直近のリザルト」ボタンを削除

- Status: active
- Updated: 2026-02-15
- Owner: ちゃぴぃ

## Context（背景 / 現状）

TOP画面に「直近のリザルト」へ遷移するボタン（ショートカット導線）がある。  
学習フローとしては「課題一覧 → 課題 → 実行 → 結果」の一本道を主導線にしたいので、TOPから結果へ飛ぶ導線はノイズになりやすい。

そのため、TOP画面から「直近のリザルト」ボタンを削除する。

## Goal（勝利条件）

- TOP画面から「直近のリザルト」ボタンが DOM ごと消える（CSS非表示ではない）
- 初心者モード / 上級者モードのどちらでも、TOP画面に同ボタンが出ない
- TOP画面の他の主要導線（課題一覧など）は従来通り機能する

## Non-goals（やらないこと）

- 結果ページ（`/results/*`）やデータ保存仕様（DB/API）の変更
- 「直近のリザルト」ページや関連ロジックの大規模な削除（未使用整理は別Issue）
- TOP画面の大規模なレイアウト刷新（必要最小限の余白調整はOK）

## Affected Areas（当たり候補）

TOPの本体:

- `apps/user/app/page.tsx`

TOPのCTA/ボタン群が分離されている可能性:

- `apps/user/src/components/top/top-ctas-with-sfx.tsx`
- `apps/user/src/components/top/top-intro.tsx`
- `apps/user/src/components/top/top-title.tsx`

初心者モードのドック/パネル側に埋まっている可能性:

- `apps/user/src/components/beginner/beginner-bottom-dock.tsx`
- `apps/user/src/components/beginner/beginner-hud.tsx`
- `apps/user/src/components/beginner/beginner-mascot-dock.tsx`

「直近リザルト」導線が共通コンポーネント化されている可能性:

- `apps/user/src/lib/terminal/RunToResultButton.tsx`
- `apps/user/src/lib/terminal/useRunToResultButton.ts`
- `apps/user/src/lib/terminal/terminalStore.ts`

探索は文字列・ルート起点が速い:

- `rg -n "直近|リザルト|結果|recent|result" apps/user/app apps/user/src/components apps/user/src/lib`

## Acceptance Criteria（受け入れ条件）

1. TOP画面上に「直近のリザルト」ボタンが表示されない  
2. ブラウザのHTML（Elements）上にも該当ボタン要素が存在しない（DOM非生成）  
3. 初心者モード / 上級者モードを切り替えても 1,2 を満たす  
4. TOP画面の他の主要CTA（例: 課題一覧へ / はじめる 等）が従来通り動作する  
5. 依存テスト（特に E2E）があれば更新され、検証が通る

## Implementation Plan（最小ステップ）

1. `rg` で「直近のリザルト」ボタンの生成箇所を特定する  
2. TOP画面（上級）側から該当ボタンの描画を削除する  
3. 初心者モード側に同導線がある場合、同様に描画を削除する  
4. `RunToResultButton` 等の import が不要になったら安全に外す（ただしロジック削除はやりすぎない）  
5. テストが落ちたら「TOPから結果へ飛ぶ導線」前提を外して修正する  
6. `make verify` と `make evidence` を実行し、証拠ログを残す

## Test Plan（証拠の取り方）

- ローカル:
  - `make verify`
  - `make evidence`
- 手動確認:
  - TOP画面で「直近のリザルト」が無いこと（初心者/上級を両方確認）
  - 課題一覧など主要導線が生きていること
