<!-- docs/specs/active/2026-02-15-issue-TBD-task-ui-reduce-buttons-swipe-delete.md -->

# Spec: 課題画面のボタンノイズ削減（タップ編集 / スワイプ削除 / 実行導線整理 / ヒント交互表示）

- Issue: TBD
- Status: active
- Updated: 2026-02-15
- Owner: TBD

## Goal（勝利条件）

課題画面（Command Builder / Playground / 端末まわり）で表示されるボタンを減らし、操作導線を単純化する。

1) 初心者モードの見出し「Command」を「コマンド一覧」にする  
2) コマンド行の編集/削除ボタンを廃止し、**タップ/クリックで編集**、**左右スワイプで削除**にする  
3) コマンドラインのボタンを「ためす」だけにする（実行/クリアは表示しない）  
4) 右側の「クリア/実行」を初期データパネル内へ移し、実行名称を「コマンドチェック」にする  
5) studying.gif を出しているヘルプパネルで、ヒント文を 2 種類で交互に表示し、迷いを減らす

## Non-goals（やらないこと）

- DSL実行エンジン・評価ロジック（`packages/dsl-core`, `usecases`）の変更
- API（`apps/user/app/api/**`）やDBスキーマの変更
- docs/runbook・docs/specs以外のドキュメント運用変更
- 画面デザイン全体のリニューアル（レイアウト刷新など）

## Scope（変更対象の当たり）

tree.txt から、影響が大きい候補を先に固定する（※最終は /codex で当て直してよい）。

- 画面入口（課題ページ）
  - `apps/user/app/tasks/[taskId]/page.tsx`

- コマンド一覧/編集（Command Builder）
  - `apps/user/src/lib/command-builder/CommandBuilder.tsx`
  - `apps/user/src/lib/command-builder/CommandList.tsx`
  - `apps/user/src/lib/command-builder/CommandRow.tsx`
  - `apps/user/src/lib/command-builder/CommandEditorSheet.tsx`
  - `apps/user/src/lib/command-builder/useSwipeActions.ts`
  - `apps/user/src/lib/command-builder/GesturePad.tsx`（既存のジェスチャー利用余地）

- コマンドライン/実行導線（疑似端末/Runner）
  - `apps/user/src/lib/terminal/PseudoTerminalRunner.tsx`
  - `apps/user/src/lib/terminal/RunToResultButton.tsx`（名称・表示制御が絡む可能性）
  - `apps/user/src/lib/terminal/useRunToResultButton.ts`（表示状態/実行制御が絡む可能性）

- 初心者ヒント/キャラクターパネル
  - `apps/user/src/components/beginner/beginner-indicating-mascot.tsx`
  - `apps/user/src/components/beginner/beginner-mascot-dock.tsx`（studying.gifを使っている可能性が高い）

- UIモード判定
  - `apps/user/src/components/providers/ui-mode-provider.tsx`
  - `apps/user/src/lib/ui-mode/uiModeStore.ts`

- E2E（壊れやすい）
  - `e2e/tests/pipeline-panel.spec.ts`
  - `e2e/tests/command-builder-*.spec.ts`
  - `e2e/tests/pseudo-terminal.spec.ts`

## 仕様詳細

### A. 見出し文言（初心者モードのみ）

- コマンド一覧パネルの見出しは、初心者モードでは「コマンド一覧」と表示する
- 上級者（UNIX）モードの表示は現状維持（英語でも日本語でも、現行の仕様に合わせる）

Acceptance:
- 初心者モードで「Command」の文言が画面上に残らない（該当箇所）
- 上級者モードで既存の見出しが崩れない

---

### B. コマンド行: ボタン廃止 → タップ編集 / スワイプ削除

現状:
- 選択中のコマンド上に「編集」「削除」ボタンが表示されており、UIノイズになる

変更:
1) 選択中コマンド上の「編集」「削除」ボタンを撤去する（DOMから消す）  
2) コマンド行（row）をタップ/クリックすると **編集UI（既存の editor sheet など）** を開く  
3) コマンド行を **左 or 右へスワイプ** すると削除する

削除UXの安全策（必須）:
- スワイプは「少し動いただけ」で発火しないよう、閾値（距離）を持つ
- 削除後に「取り消し（Undo）」ができるUIを用意する（最短でトースト/スナックバー）
  - 取り消しが難しい場合は、代替として「削除確認ダイアログ」を出す（ただしノイズが増えるのでUndo優先）

端末/入力デバイス:
- スワイプはタッチ操作だけでなく、マウスドラッグ（pointer events）でも動く実装にする
- ただし「クリックで編集」と競合しないように、ドラッグ判定中はクリック扱いにしない

Acceptance:
- 画面上から「編集」「削除」ボタンが消える（該当箇所）
- 行タップ/クリックで編集UIが開く
- 行の左右スワイプで削除できる
- 誤操作に対して、削除取り消し（Undo）または確認が用意されている
- 初心者/上級者の両モードで同じ操作が成立する（文言差は可）

---

### C. コマンドラインのボタン整理（「ためす」だけ）

変更:
- コマンドラインのパネルにある「実行」「クリア」は表示しない
- コマンドラインに表示されるボタンは「ためす」だけにする

Acceptance:
- コマンドラインパネル上に「実行」「クリア」が出ない（DOM非生成）
- 「ためす」は従来通り動作し、UI崩れがない

---

### D. 右側の「クリア/実行」→ 初期データパネル内へ移動、実行名称変更

変更:
- Playground 右側に出ている「クリア」「実行」ボタンを、初期データパネルの中へ移す
- 「実行」の表示名を「コマンドチェック」に変更する
- 右側には「クリア」「実行」が残らない（DOM非生成）

補足:
- ここでいう「初期データパネル」は、Runner IO / Input 等の初期値を触る領域（該当コンポーネントは /codex で確定）
- 「ためす」と「コマンドチェック」が混同しないよう、ラベルと説明（aria-label / tooltip）を揃える

Acceptance:
- 右側の当該ボタンが消え、初期データパネル内に移る
- 「実行」が「コマンドチェック」に変わっている
- 既存E2Eが意図通りに通るように更新されている

---

### E. studying.gif パネルのヒント交互表示

対象:
- `apps/user/public/assets/characters/studying.gif` を表示しているパネル（初心者向けの誘導）

表示する文言（2種）:
1) 「コマンドを右にスワイプさせると詳細設定ができるよ」
2) 「コマンドを左にスワイプさせると削除ができるよ」

交互表示のルール:
- 初心者モードのみ
- 2秒ごとに 1↔2 を交互に切り替える
- 画面離脱時に停止する（cleanup）

Acceptance:
- 上記2文言が交互に表示される
- 2秒ごとの自動切替が停止条件（cleanup）を満たす
- 文言が UI崩れを起こさない（スマホ幅も含む）

## リスクと対策（NFR）

- 安全性: スワイプ削除は誤爆しやすい → 閾値 + Undo（または確認）で回避
- 変更容易性: コマンド行の責務肥大化 → 可能なら `useSwipeActions.ts` に判定を集約
- 性能: pointer move を過剰に re-render しない → requestAnimationFrame / state最小化を検討
- 運用: E2Eのセレクタが壊れやすい → data-testid の追加/整備（必要最小限）

## Implementation Plan（最小ステップ）

1) 現行UIで「どのボタンがどのコンポーネント由来か」を特定（候補から確定）
2) 見出し文言（初心者モード）を変更
3) CommandRow の編集/削除ボタン撤去、rowクリックで editor sheet 起動へ切替
4) スワイプ削除実装（閾値、クリック競合回避、Undo or confirm）
5) コマンドラインの「実行/クリア」を非表示化し、「ためす」だけ残す
6) 右側の「クリア/実行」を初期データパネルへ移動、実行名称を「コマンドチェック」へ
7) studying.gif パネルのヒント交互表示を実装（操作イベントで切替）
8) E2E更新（破壊的変更のため必須）
9) `make verify` → `make evidence`、引継ぎ4点を揃える

## Test Plan（証拠）

- Unit/型:
  - `pnpm -w typecheck`（make verify に含まれる想定）
- E2E:
  - 既存 `e2e/tests/command-builder-*.spec.ts` の更新
  - 追加観点:
    - rowクリックで editor が開く
    - スワイプで削除 + Undo
    - コマンドラインに「ためす」だけが表示
    - 初期データパネル内に「クリア」「コマンドチェック」がある
- Evidence:
  - `make verify`
  - `make evidence`
  - 引継ぎ4点（spec / diff / sha / evidenceログ名）
