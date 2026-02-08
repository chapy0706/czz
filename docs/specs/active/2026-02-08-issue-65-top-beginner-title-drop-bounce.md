<!-- docs/issues/2026-02-08-issue-65-top-beginner-title-drop-bounce.md -->

# Issue: TOP（初心者モード）タイトルを「上から1文字ずつ落ちて跳ねる」演出に戻す

- Issue: https://github.com/chapy0706/czz/issues/65
- Related Doc: `docs/issues/2026-02-08-issue-65-top-beginner-title-pastel-3x2.md`
- Status: draft
- Owner: ちゃぴぃ
- Updated: 2026-02-08

---

## Context（背景 / 現状）

以前は、TOP（初心者モード）のタイトルが **上から1文字ずつ落ちてきて、軽く跳ねる** 演出が入っていた。  
現在その演出が失われている（または弱くなっている）ため、初心者向けの“ワクワク感”が減っている。

本Issueでは、初心者モードのタイトルに対して、**落下 + ちょいバウンド** のアニメーションを復活させる。

---

## Goal（勝利条件）

- 初心者モードのタイトルが、**1文字ずつ** 上から落ちてきて **軽くバウンド** して着地する
- 文字ごとの出現は **stagger（段階的ディレイ）** で表現する
- SSR/CSR差分（Hydration error）を出さない
- `prefers-reduced-motion`（動き軽減）に配慮し、軽減設定時はアニメを無効化できる
- `pnpm -w typecheck` と `pnpm -w check` が通る

---

## Non-goals（やらないこと）

- ページ全体の大規模なアニメーション追加（背景・CTAなど）
- Framer Motion 等の新規依存追加（必要なら別Issue）
- 乱数で毎回アニメが変わる仕様

---

## Target Files（編集対象の目安）

- `apps/user/src/components/top/BeginnerPopTitle.tsx`（タイトル1文字単位の描画がある想定）
- （必要なら）TOPのタイトル描画コンポーネント（例: `apps/user/src/components/top/top-title.tsx`）
- （必要なら）グローバルCSS（keyframes を置く場所）

---

## Fix Plan（実装方針）

### 1) CSSアニメで完結させる（Hydration対策）

以下は禁止（SSR/CSR差分や不安定さの温床）：
- `Math.random()` で順番や見た目を決める
- `useEffect` でクラスを後付けして開始する（初回描画とズレる可能性）

推奨：
- **CSS keyframes** を定義し、初回描画からクラス付与する
- 文字ごとの `animation-delay` は **indexから決定的に算出**（例: `i * 80ms`）

### 2) keyframes（落下 + ちょいバウンド）案

例（イメージ）：

- 0%: translateY(-24px), opacity 0
- 60%: translateY(0), opacity 1
- 80%: translateY(-6px)
- 100%: translateY(0)

時間は `520ms〜700ms` 程度で、やりすぎない（読みやすさ優先）。

### 3) Tailwind に寄せる（ただし設定変更は最小）

- Tailwind の `motion-reduce:` を使って、動き軽減時は `animation: none` 相当へ
- `animate-[dropBounce_600ms_ease-out_both]` のような **arbitrary animation** を使う場合は、
  `@keyframes dropBounce` をどこかのCSSに定義する必要がある

keyframes を置く場所は、リポジトリの実態に合わせる：
- 既存の `globals.css` / `global.css` / `styles.css` などを探して追記
- もし良い置き場が無ければ `apps/user/src/styles/animations.css` を作り、グローバルに import する

### 4) “1文字ずつ” の遅延（stagger）

- 文字配列 `tokens` を map して描画
- 各文字要素に `style={{ animationDelay: `${i * 80}ms` }}` のように指定（決定的）
- 2行（3+3）のレイアウトと組み合わせる場合でも、index順でディレイする（上段→下段に流れる）

---

## Evidence（確認コマンド）

```bash
pnpm -w typecheck
pnpm -w check
```

---

## DoD（Definition of Done）

- 初心者モードのTOPタイトルで、1文字ずつ落下→軽くバウンドの演出が確認できる
- `prefers-reduced-motion` でアニメが無効化される（または顕著に軽減される）
- Hydration error / warning が出ない
- `pnpm -w typecheck` と `pnpm -w check` が成功する

---

## Notes（実装メモ）

- アニメは“かわいい”より“読みやすい”を優先する（揺れすぎると疲れる）
- ディレイは 60ms〜120ms の範囲で調整するとテンポが良い
