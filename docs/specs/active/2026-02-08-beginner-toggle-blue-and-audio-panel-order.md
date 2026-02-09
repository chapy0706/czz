<!-- docs/specs/active/2026-02-08-beginner-toggle-blue-and-audio-panel-order.md -->

# Spec: 初心者モードトグルのON強調（青）＋ 音量パネルの表示順を下へ移動

- Related Issue: https://github.com/chapy0706/czz/issues/65
- Updated: 2026-02-08
- Owner: ちゃぴぃ
- Status: draft

---

## 目的（Why）

- 初心者モードのON/OFFトグルが、ONの状態でも分かりにくい
- TOP（初心者UI）上で「音量トグル（BGM/SFX）のパネル」が初心者モードトグルの上にあり、操作導線が綺麗ではない

---

## ゴール（What）

### A. 初心者モードトグルのON状態を青で分かるようにする

- 初心者モードのON/OFFトグルを、音量トグル（BGM/SFX）と同じトーンで「青系の活性表示」にする
- ONのときに一目で分かる（トラック背景、枠、ラベルなど）
- OFFはニュートラルに戻る

### B. 音量トグルパネルの表示位置を「初心者モードトグルの下」に移動する

- 現状：音量トグルパネル（BGM/SFX）が、初心者モードトグルの上に表示されている
- 変更：初心者モードトグルの下へ移動する
- それ以外の要素の表示順・挙動は可能な限り維持する

---

## 非ゴール（Not in scope）

- 音量トグルパネル自体の大改修（別Specで実施済みの「3点構成」方針を崩さない）
- 初心者/上級者モードの状態管理（store設計）の変更
- 画面全体のレイアウト刷新

---

## 影響範囲（Where）

### 想定の対象コンポーネント

- 初心者モードトグル
  - `apps/user/src/components/beginner/ui-mode-toggle.tsx`（候補）
  - もしくは TOP 側の `page.tsx` / `top-*` から辿っている実体

- 音量トグルパネル（BGM/SFX）
  - TOP（初心者UI）のパネル
  - `apps/user/src/components/top/*` または `apps/user/src/components/beginner/*` に実体がある想定

- 表示順を決めている親コンポーネント
  - `apps/user/app/page.tsx`
  - `apps/user/src/components/beginner/beginner-hud.tsx`
  - `apps/user/src/components/top/*`
  - など（実体に合わせて確定）

---

## 要件（Must）

### 1) ON状態の青い活性表示

- 初心者モードトグルが ON のとき、青系の活性表示になること
  - 例：checked時にトグルのトラック背景を青にする
  - 例：ラベルの色/強調を青に寄せる（やりすぎない）
- shadcn/ui の Switch を使っている場合は `data-[state=checked]` で条件付きクラスを当てる
- Switch でない場合でも「ONのとき青」を条件分岐で必ず実現する

### 2) 表示順の変更

- 初心者モードトグルの直下に、音量トグルパネル（BGM/SFX）を配置する
- 音量パネルの機能は変えない（表示位置のみ変更）
- 余白（spacing）は自然に（例：`mt-2`〜`mt-4` 程度で調整）

### 3) 安定性・アクセシビリティ

- SSR/CSR差分（Hydration error）を出さない
- トグルのlabel紐付け（`id` / `htmlFor` / `aria-label` 等）を壊さない
- キーボード操作が可能であること（既存の仕組みを維持）

---

## 実装方針（How）

### ステップ1: 実体の特定

以下で「初心者モードトグル」と「音量トグルパネル」と「表示順を決めている親」を特定する。

- `rg -n "uiMode|beginner mode|初心者|上級者" apps/user -S`
- `rg -n "ui-mode-toggle|beginner-hud|beginner.*dock" apps/user/src/components -S`
- `rg -n "BGM|SFX|volume|sound|audio|mute" apps/user -S`

### ステップ2: 初心者モードトグルを青に寄せる

- トグルが Switch なら `data-[state=checked]` で青に
- ラベル/説明文もON時に少し青寄せ（任意。視認性優先）
- 既存トーンに合わせる（TOP音量トグルのクラスやトークンがあるなら寄せる）

### ステップ3: 表示順を入れ替える

- 親コンポーネント内の並びを変更し、
  - 「初心者モードトグル」
  - 「音量トグルパネル」
  の順にする
- DOM構造を大きく変えず、差分を小さくする

---

## 受け入れ条件（DoD）

- 初心者モードトグルが ON のとき、青い活性表示で一目で分かる
- 音量トグルパネル（BGM/SFX）が、初心者モードトグルの下に表示される
- `pnpm -w typecheck` と `pnpm -w check` が成功する
- 既存の初心者モード切替、音量ON/OFF挙動が壊れていない

---

## Evidence（確認コマンド）

```bash
pnpm -w typecheck
pnpm -w check
```

---

## Claude Code に渡すプロンプト（コピペ用）

```text
あなたは czz リポジトリの変更担当です。以下のSpecに沿って、初心者モードトグルの視認性改善と、
音量トグルパネルの表示順を変更してください。

Spec:
- docs/specs/active/2026-02-08-beginner-toggle-blue-and-audio-panel-order.md（このファイルの内容）

要件:
A) 初心者モードON/OFFトグルのON状態を「青系の活性表示」にする
- 音量トグル（BGM/SFX）と同じトーンで、ONが一目で分かるようにする
- shadcn/ui の Switch を使っているなら data-[state=checked] のクラスで青にする
- Switch でない場合も必ず「ONで青」を実現する
- a11y: label紐付けとキーボード操作を壊さない

B) TOP上の表示順を変える
- 現状：音量トグルパネル（BGM/SFX）が初心者モードトグルの上にある
- 変更：初心者モードトグルの下に移動する
- それ以外の挙動は維持する（表示位置のみ変更）

手順:
1) czz ルートへ移動（必須）
- pwd
- ls -la
- find .. -maxdepth 6 -type d -path "*/apps/user" -print
見つかったディレクトリへ cd し、`ls -la apps/user` が通ることを確認する。

2) 対象の実体特定（必須）
- rg -n "uiMode|beginner mode|初心者|上級者" apps/user -S
- rg -n "ui-mode-toggle|beginner-hud|beginner.*dock" apps/user/src/components -S
- rg -n "BGM|SFX|volume|sound|audio|mute" apps/user -S
初心者モードトグルの実体コンポーネントと、音量トグルパネルの実体コンポーネント、
表示順を決めている親コンポーネントを特定する。

3) 実装修正（必須）
- 初心者モードトグルをON時に青くする（checked条件でクラス適用）
- 親コンポーネント内で「初心者モードトグル」→「音量トグルパネル」の順に並べ替える
- 差分は最小にする（DOMを大きく変えない）

4) 検証（必須）
- pnpm -w typecheck
- pnpm -w check

完了後:
- 変更したファイル一覧
- ONを青にしたクラス（またはスタイル条件）
- 表示順を変えた箇所（親コンポーネント名）
を短く報告してください。
```
