<!-- docs/issues/2026-02-08-issue-65-top-audio-panel-ux.md -->

# Issue: TOP 音量パネル（BGM/SFX）を整理して「青でONが分かる」UIにする

- Issue: https://github.com/chapy0706/czz/issues/65
- Status: draft
- Owner: ちゃぴぃ
- Updated: 2026-02-08

---

## Context（背景 / 現状）

TOP画面に BGM / SFX の ON・OFF（音量）を切り替えるパネルが表示されているが、UXとして見栄えが良くない。

特に以下が気になる：

- トグルが ON のとき、見た目が弱く「有効になっている」ことが一目で分かりづらい
- トグルが複数あり、パネルの構成が散らかって見える
- TOPの導線としては、最低限の操作だけに絞りたい

---

## Goal（勝利条件）

- TOPの音量パネルは、以下の **3つの操作だけ** で構成される
  1. BGM ON・OFF トグル（1つ）
  2. SFX ON・OFF トグル（1つ）
  3. クレジット画面へ遷移するボタン（1つ）
- トグルが ON のとき、**青色系の活性表示**（背景 or 枠 or ラベル）が入り、状態が即分かる
- キーボード操作 / スクリーンリーダーで扱える（最低限のアクセシビリティ）
- 既存の音声ロジック（ストア/プレイヤー/ルーティング）を壊さない
- `pnpm -w typecheck` と `pnpm -w check` が通る

---

## Non-goals（やらないこと）

- 音量スライダーの導入（ON・OFFのみ）
- TOP以外の画面の音声UI刷新
- 音声実装の大改修（AudioStore設計の変更など）

---

## UX / UI 要件

### パネル構成

- 見出し（任意）：`音` / `サウンド` など短く
- 行1：`BGM` ラベル + トグル（右寄せ）
- 行2：`SFX` ラベル + トグル（右寄せ）
- 行3：`クレジット` ボタン（幅は控えめ、または右寄せ）

### ON状態の表現（重要）

- ON のときに「青」で分かること
  - 例：トグルのトラックが青、ラベルが青、外枠が青、など
- OFF のときは主張を弱める（ニュートラル）

### `prefers-reduced-motion`

- もしアニメを入れるなら `motion-reduce` で抑制する（必須ではない）

---

## Target Files（編集対象の目安）

※ 実際の配置はリポジトリの現状に合わせて探索すること。

- TOP で音量パネルを描画しているコンポーネント
  - 例：`apps/user/src/components/top/*`
  - 例：初心者UIなら `apps/user/src/components/beginner/*`
- 既存の audio store / hooks
  - `apps/user/src/lib/audio/*`

---

## Fix Plan（実装方針）

### 1) パネルの描画コンポーネントを特定する

以下で探索して、TOPの音量パネルの実体（コンポーネント）を見つける。

- `rg -n "BGM|SFX|volume|sound|audio|mute" apps/user -S`
- `rg -n "toggle|switch" apps/user/src/components -S`

### 2) “トグルが複数” の原因を削る

現状パネル内に同種の操作が複数あるなら、意図を整理して **BGMとSFXに1つずつ** に統合する。

- 「BGMのミュート」「BGMのボリューム0」などが混在している場合：
  - UI上は 1つの ON/OFF に統一
  - 内部実装は既存のミュート/ボリュームの仕組みに合わせてブリッジ（不整合を作らない）

### 3) ONの青い活性表現を追加する

- shadcn/ui の `Switch` を使っているなら、`data-[state=checked]` にクラスを当てる方針が安全
- 例（イメージ）：
  - checked 時：トラック背景が青（`data-[state=checked]:bg-blue-500` など）
  - thumb は白寄り（読みやすさ優先）
- Switch を使っていない場合でも、「checked で青」にする条件を必ず入れる

### 4) クレジット遷移ボタンを追加/整理する

- 既存のクレジット導線があるなら、それを **パネルの3行目に集約**
- 遷移先はプロジェクトの実装に合わせる（`/credits` 等）
- Link or Button の統一（見た目が他の操作と同じトーンになるように）

---

## Evidence（確認コマンド）

```bash
pnpm -w typecheck
pnpm -w check
```

---

## DoD（Definition of Done）

- TOP音量パネルが「BGMトグル」「SFXトグル」「クレジットボタン」の3点構成になっている
- トグルONが青で分かる（一目で認識できる）
- `pnpm -w typecheck` と `pnpm -w check` が成功する
- 既存の音声のON/OFF挙動が壊れていない

---

## Notes（実装メモ）

- UXは「操作回数」より「迷わなさ」を優先する
- TOPは“初見の安心感”が重要なので、派手さより明快さ
