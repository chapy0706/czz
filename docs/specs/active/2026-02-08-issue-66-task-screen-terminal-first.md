<!-- docs/issues/2026-02-08-issue-66-task-screen-terminal-first.md -->

# Issue: 課題画面の実行系を terminal に寄せる（builder は薄い変換）

- Issue: https://github.com/chapy0706/czz/issues/66
- Spec: TBD（当面は Issue #66 本文を Single Source of Truth として扱う）
- Status: draft
- Owner: ちゃぴぃ
- Updated: 2026-02-08

---

## Context（背景 / 現状）

課題画面（`/tasks/[taskId]`）はアプリの心臓部で、DSLを組んで実行→テスト評価→結果表示までの契約が集中している。

Issue #66 で特に重要だと整理されているポイント:

- **テスト失敗はエラーではない**（`ok:false` でも結果画面へ遷移するべき）
- **resultId の抽出位置が揺れる**（抽出関数を1箇所に集約）
- **dslProgram の送信形式は serializeProgram が真実**（二重送信は止血としても、落ち着いたら一本化）
- **I/O境界（INPUT/OUTPUT）は CommandType に混ぜない**（境界は境界）
- **runnerIo の二重実装は地雷**（builder/terminal の両方に存在する）

この Issue では、上記の誤差ポイントを潰すために、実行系（API呼び出し・契約解釈・遷移・実行状態）を terminal 側へ寄せ、command-builder 側は表示と薄い変換に限定する。

---

## Goal（勝利条件）

- 実行系の Single Source of Truth を `apps/user/src/lib/terminal/*` に寄せる
- builder 側で「評価API呼び出し」「resultId解釈」「遷移」を行わない（薄い変換と表示に徹する）
- 初心者/上級者のUI差分があっても、以下の契約が崩れない
  - HTTP 200系なら「評価処理としては成功」
  - `ok:false` でも resultId がある限り `/results/[resultId]` へ遷移
  - resultId が無い場合は `/result` へフォールバック（互換）

---

## Non-goals（やらないこと）

- DSL実行結果の意味や評価仕様（UseCase / dsl-core）そのものを変える
- 初心者UI/上級者UIの見た目を大きく作り替える
- `/result` と `/results/[resultId]` の完全統合（今回は方針固定と薄いwrapper化まで）

---

## Scope（Do / Don’t）

### Do（このIssueでやる）

1. terminal 側に契約を集約する
   - `evaluateContract.ts` を「契約の真実」として強化する
   - resultId 抽出（`extractResultId`）を terminal 側に置き、builder 側に重複させない

2. 実行・遷移ロジックを terminal 側へ寄せる
   - `useRunToResultButton.ts` / `RunToResultButton.tsx`（または同等の実行導線）を、
     - `ok:false` を例外扱いしない
     - `resultId` があれば常に `/results/[resultId]`
     - ないなら `/result`
     を満たすように修正する

3. runnerIo を terminal 側へ統一する
   - `apps/user/src/lib/terminal/runnerIo.ts` を正にする
   - `apps/user/src/lib/command-builder/runnerIo.ts` は削除 or re-export（ロジック禁止）

4. builder は「表示と薄い変換」に限定する
   - builder 側で evaluate API を叩かない
   - builder 側で resultId を解釈しない
   - builder 側は「コマンド列 → dslProgram 生成」「I/O境界の表示（ViewModel）」に留める

5. UXの最低条件を固定する
   - 初心者モードでも Run/Clear は常時見える（押せないなら disabled＋理由）
   - 初心者HUD/BottomDock が z-index / 固定配置でボタンを隠さないことを確認する

### Don’t（このIssueではやらない）

- command-builder の全面再設計（Store構造の大改修）
- runner UI の完全刷新（ターミナル表現の変更）
- E2Eの全面復旧（ただし触った範囲の破壊を避けるために参照はする）

---

## Design（方針の固定）

### terminal を「実行の真実」にする

- 置き場所（目安）
  - `apps/user/src/lib/terminal/evaluateContract.ts` : payload/ok/resultId/URL の契約
  - `apps/user/src/lib/terminal/evaluateClient.ts` : evaluate API 呼び出し
  - `apps/user/src/lib/terminal/useRunToResultButton.ts` : 実行状態・遷移制御
  - `apps/user/src/lib/terminal/runnerIo.ts` : I/O境界のデータ構造と変換（実行側の真実）

### command-builder は「表示 + 薄い変換」だけ

- builder が持って良い責務
  - `CommandType[]` の編集（追加/削除/並べ替え/パラメータ編集）
  - `serializeProgram()` による dslProgram 生成
  - `input.csv | cmd1 | cmd2 | output.csv` の1行表示（ViewModel）

- builder が持ってはいけない責務
  - `evaluate` の呼び出し
  - `ok/resultId` の解釈
  - ルーティング（結果画面への遷移判断）

---

## Target（当たりを付けるファイル）

- Route / Page
  - `apps/user/app/tasks/[taskId]/page.tsx`

- Builder
  - `apps/user/src/lib/command-builder/CommandBuilder.tsx`
  - `apps/user/src/lib/command-builder/serialize.ts`
  - `apps/user/src/lib/command-builder/commandBuilderStore.ts`
  - `apps/user/src/lib/command-builder/runnerIo.ts`（統一対象）

- Terminal
  - `apps/user/src/lib/terminal/PseudoTerminalRunner.tsx`
  - `apps/user/src/lib/terminal/RunToResultButton.tsx`
  - `apps/user/src/lib/terminal/useRunToResultButton.ts`
  - `apps/user/src/lib/terminal/evaluateClient.ts`
  - `apps/user/src/lib/terminal/evaluateContract.ts`
  - `apps/user/src/lib/terminal/runnerIo.ts`（正）

- Result pages
  - `apps/user/app/results/[resultId]/page.tsx`
  - `apps/user/app/result/page.tsx`（互換）

---

## Implementation Plan（Codex向け手順案）

1. まず現状把握（読む範囲を絞る）
   - `apps/user/app/tasks/[taskId]/page.tsx`
   - `CommandBuilder.tsx`
   - `useRunToResultButton.ts` / `evaluateContract.ts` / `runnerIo.ts`

2. terminal 側の契約を整備
   - `evaluateContract.ts` に `extractResultId()` を追加（揺れパターンを吸収）
   - `/results/[resultId]` を正にし、resultId が無いときだけ `/result` にフォールバック

3. `useRunToResultButton` を契約通りにする
   - HTTP 200系のレスポンスは「処理として成功」扱い
   - `ok:false` を例外扱いせず、resultId の有無で遷移先を決める
   - 遷移判定は `evaluateContract.ts` へ寄せ、hook側は呼ぶだけにする

4. runnerIo を terminal に統一
   - `terminal/runnerIo.ts` に型と変換を集約
   - `command-builder/runnerIo.ts` は削除 or re-export（ロジックを置かない）
   - builder 側の import を terminal 側へ寄せる

5. builder から実行ロジックを剥がす
   - builder は `dslProgram` を作る（serialize）
   - 実行/遷移は terminal の hook（`useRunToResultButton`）に委譲
   - UIとして Run/Clear をどこに表示するかは自由だが、ロジックは terminal を使う

6. `/result` の扱いを薄くする（互換）
   - 可能なら `/result` は wrapper にして、内部的に `/results/[resultId]` を表示する方針に寄せる
   - 今回は「契約の固定」が主目的なので、過度に大改修しない

7. テスト（最小）
   - unit（Vitest）で `extractResultId()` のテーブルテストを追加
   - 手動で `beginner/advanced` を切り替え、Run/Clear が消えないことを確認

---

## Evidence（証拠）

このリポジトリの root `package.json` にある scripts を使う。

- `pnpm -w check`
- `pnpm -w typecheck`
- `pnpm -C apps/user dev`
- （任意）`pnpm -w test:unit`

---

## DoD（Definition of Done）

- builder 側に evaluate 呼び出し / resultId 抽出 / 遷移判断が残っていない
- `evaluateContract.ts` に resultId 抽出が集約され、terminal 側がそれを使用している
- `runnerIo` のロジック重複が解消されている（正は terminal）
- 初心者モードでも Run/Clear が常時見える（押せないなら disabled と理由）
- `pnpm -w typecheck` が通る

---

## Safety（Codexに守らせるルール）

- `.env*` / secrets を読まない・貼らない・コミットしない
- 破壊的コマンド（`rm -rf`, `git reset --hard`, `git push --force` など）禁止
- 実装後は必ず `pnpm -w typecheck` を実行し、失敗したらログの要点を残す

---

## Handoff（Codexの最後の出力）

- 変更ファイル一覧（`git diff --name-only`）
- 最終SHA
- 実行したコマンドと結果（typecheck/check/test の要点）
- このドキュメントの Spec 欄を更新できるなら更新（Spec: docs/specs/... を作った場合）
