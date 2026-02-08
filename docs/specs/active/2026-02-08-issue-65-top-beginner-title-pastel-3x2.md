<!-- docs/issues/2026-02-08-issue-65-top-beginner-title-pastel-3x2.md -->

# Issue: TOP（初心者モード）タイトルをパステルの“バラバラ丸文字”にする（3+3）

- Issue: https://github.com/chapy0706/czz/issues/65
- Spec: TBD（必要なら `docs/specs/active/top-beginner-title.md` を作る）
- Status: draft
- Owner: ちゃぴぃ
- Updated: 2026-02-08

---

## Context（背景 / 現状）

TOP（初心者モード）のタイトルが、スマホ等の2行表示で **上4文字 + 下2文字** になっている。  
この2行表示を **上3文字 + 下3文字** に揃えたい。

合わせて、タイトルの各文字を「丸い枠（円）」に入れ、**カラフルなパステルカラー**で、  
**文字サイズ／丸枠サイズ／枠の太さ**を「ちょっとバラバラ」にして、ポップで楽しい雰囲気にしたい。

---

## Goal（勝利条件）

- 初心者モードのタイトルが「2行のとき **3文字 + 3文字**」になる
- 各文字がパステル調の丸枠で表示され、**サイズが少しずつ違う**
- 見た目変更が **Hydration 差分やランダム要素**を生まず、再現性がある
- `pnpm -w typecheck` が通る（既存が通っている前提）

---

## Non-goals（やらないこと）

- TOP全体レイアウトの刷新（CTA、背景、説明文の大改修）
- Tailwind 設定（theme拡張）やデザインシステム全体の見直し
- 文字列そのものの変更（タイトル文言を変えることは別Issue）

---

## Scope（Do / Don’t）

### Do（このIssueでやる）

- 「3+3」になるレイアウトを実装（2行表示時の分割を固定）
- 6文字（例: `指示厨ゲーム`）を前提に、**各文字の見た目 variant**（色/サイズ/枠太さ/回転など）を固定配列で定義
- 初心者モードでのみ適用（上級者モードの見た目は維持）
- クラス設計は **“設定（配列）と描画（map）”** を分離して、編集しやすくする

### Don’t（このIssueではやらない）

- `Math.random()` 等で毎回見た目が変わる仕様（SSR/CSR差分の温床）
- レスポンシブ分岐の増殖（条件分岐が増えるほど壊れやすい）

---

## Target Files（編集対象の目安）

- `apps/user/src/components/top/BeginnerPopTitle.tsx`（丸文字の演出をここに集約する想定）
- `apps/user/src/components/top/top-title.tsx`（呼び出し側・表示条件があるなら）
- （必要なら）`apps/user/app/page.tsx`（TOPでの出し分け確認）

---

## Fix Plan（実装方針）

### 1) 文字列を「6つのトークン」にする（例: 指/示/厨/ゲ/ー/ム）

- 既存のタイトルが6文字である前提なら、**固定配列**が最も安全。
- もし将来タイトルが変わる可能性があるなら、まずは **fallback** を入れる：
  - 6文字以外なら 1行表示 or 既存表示にフォールバック（壊れ方を穏やかに）

例（イメージ）:

- tokens: `["指","示","厨","ゲ","ー","ム"]`

### 2) 見た目 variant を固定配列で持つ（パステル + サイズばらけ）

- “色” と “サイズ” と “枠太さ” と “微妙な回転/ずらし” を **6個分だけ**決め打ちする
- Tailwind の既存色（200/300あたり）を使い、彩度を上げすぎない

例（イメージ）:
- `bg-pink-200 ring-pink-300`
- `bg-sky-200 ring-sky-300`
- `bg-emerald-200 ring-emerald-300`
- `bg-amber-200 ring-amber-300`
- `bg-violet-200 ring-violet-300`
- `bg-teal-200 ring-teal-300`

サイズのばらけ（例）:
- `size: h-12 w-12 / h-14 w-14 / h-16 w-16`
- `text: text-xl / text-2xl / text-3xl`
- `ring: ring-2 / ring-4`

※ ばらけは「差が分かる」程度に留め、読みやすさ優先。

### 3) レイアウトは grid で「3 + 3」を固定する

- 2行表示時に「3+3」になってほしいため、**grid** を使って行列を明示するのが安全。
- 例:
  - mobile: `grid grid-cols-3 grid-rows-2`
  - 画面が広い場合は 1行に戻すなら: `sm:grid-cols-6 sm:grid-rows-1`（任意）

### 4) SSR/CSR差分を出さない（重要）

- `Math.random()` を使わない
- `useEffect` で見た目を変えない
- variant は **固定配列**（またはタイトル文字からの決定的なハッシュ）で決める

---

## Evidence（確認コマンド）

```bash
pnpm -w typecheck
pnpm -w lint
pnpm -w test
pnpm -w dev
```

---

## DoD（Definition of Done）

- 初心者モードのTOPタイトルが、2行表示で「3文字 + 3文字」になる
- 各文字がパステル丸枠で表示され、サイズがバラバラでも破綻しない
- Hydration error / warning が出ない
- 変更箇所が `BeginnerPopTitle.tsx` を中心に小さくまとまっている
- `pnpm -w typecheck` が成功する

---

## Decision Log（任意）

- 2026-02-08: 見た目のばらけは乱数ではなく **固定 variant** で表現（SSR/CSR差分を避ける）

---

## Next（任意）

1. `BeginnerPopTitle.tsx` を中心に、tokens + variants + grid 表示を実装
2. 実機相当（スマホ幅）で「3+3」と読みやすさを確認
3. 色の彩度が強い場合は `200/300` を `100/200` へ寄せて調整
