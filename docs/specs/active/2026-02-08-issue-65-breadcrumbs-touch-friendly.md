<!-- docs/issues/2026-02-08-issue-65-breadcrumbs-touch-friendly.md -->

# Issue: パンくずリストを「端すぎて押しにくい」問題を解消（スマホ含む）

- Issue: https://github.com/chapy0706/czz/issues/65
- Status: draft
- Owner: ちゃぴぃ
- Updated: 2026-02-08

---

## Context（背景 / 現状）

TOP含む各画面で表示されるパンくずリストが、画面の縁（左右端）に寄りすぎていて押しにくい。  
特にスマホでは「指が届く/当たる」余白がなく、誤タップやストレスにつながっている。

---

## Goal（勝利条件）

- パンくずリストが左右端に張り付かず、スマホでも押しやすい余白が確保される
- タップ領域（hit area）が十分に確保され、誤タップが減る
- レイアウト崩れ（折り返し/はみ出し）が悪化しない
- 既存の導線（戻る/階層移動）の意味が変わらない
- `pnpm -w typecheck` と `pnpm -w check` が通る

---

## Non-goals（やらないこと）

- パンくずの文言や階層ルール自体の変更
- デザインシステム全体の余白見直し（今回はパンくず周辺のみ）
- パンくずを完全に非表示にする（別Issue）

---

## UX / UI 要件

### 1) 端すぎ問題（余白）
- コンテナに左右 padding を入れ、画面端から離す
- iPhone 等のノッチ/セーフエリアも考慮する（可能なら）

### 2) タップしやすさ（hit area）
- 各パンくずリンクのタップ領域を広げる
  - 目安：高さ 40px 程度（`py-2` + 行高など）
- 見た目は変えすぎず、押せる範囲だけ増やす

### 3) はみ出し対策
- パンくずが長い場合に横スクロール or 折り返しのどちらかで破綻しない
- 既存仕様に合わせる（現状が横スクロールならそれを維持）

---

## Target Files（編集対象の目安）

- `apps/user/src/components/nav/global-breadcrumbs.tsx`
- `apps/user/app/layout.tsx`
- （関連）パンくず周りのラッパー/コンテナコンポーネント

※ 実際のファイル配置はリポジトリの現状に合わせて探索すること。

---

## Fix Plan（実装方針）

### 1) パンくず実体の特定

以下でパンくずのコンポーネント実体と使用箇所を特定する：

- `rg -n "breadcrumb|breadcrumbs|パンくず" apps/user -S`
- `rg -n "GlobalBreadcrumbs|Breadcrumb" apps/user/src -S`

### 2) コンテナの余白を調整（端から離す）

- パンくず全体の外側に `px-3`〜`px-4` を付ける（スマホ重視）
- セーフエリアを考慮する場合、CSS で `padding-left/right: max(…, env(safe-area-inset-left/right))` を検討
  - 既存のCSS構成に合わせて最小の追加にする

### 3) リンクのタップ領域を増やす（見た目を壊さない）

- 各 crumb のリンクに `px-2 py-2` 等を付ける（最低でも縦方向の余白を増やす）
- クリック可能領域が「文字だけ」になっている場合は、`inline-flex` で領域を作る
- 可能なら hover/focus も整える（`focus-visible`）

### 4) 長いパンくずのはみ出しを守る

- 既存仕様が横スクロールなら維持（`overflow-x-auto` + `whitespace-nowrap`）
- 折り返しが前提なら、リンク間の gap と改行の崩れを確認して最小修正に留める

---

## Evidence（確認コマンド）

```bash
pnpm -w typecheck
pnpm -w check
```

---

## DoD（Definition of Done）

- スマホ幅でパンくずが端から適度に離れ、押しやすい
- パンくずリンクのタップ領域が増えた（体感で誤タップが減る）
- 長いパンくずでも破綻しない（はみ出し/折り返しが悪化しない）
- `pnpm -w typecheck` と `pnpm -w check` が成功する
