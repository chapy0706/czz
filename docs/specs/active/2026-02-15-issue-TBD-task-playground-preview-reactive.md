<!-- docs/specs/active/2026-02-15-issue-TBD-task-playground-preview-reactive.md -->

# Spec: 課題画面プレイグラウンドで入力データとコマンド選択に応じて出力が変わるようにする

- Issue: TBD
- Owner: TBD
- Status: draft
- Updated: 2026-02-15

## Why（目的）
プレイグラウンドは「コマンドの確認」用の安全地帯。ここで挙動が変わらないと、学習者はコマンドの意味を掴めず、次の“実行→結果”フェーズに進めない。
本specでは、プレイグラウンドの入出力を “入力データ + パイプライン” に正しく追従させ、実テスト評価とは切り離したまま体験を回復する。

## 期待する体験（User Story）
- ユーザーが入力データを編集すると、数百ms以内に出力が更新される。
- コマンドを追加/削除/並び替え/パラメータ変更すると、同様に出力が更新される。
- 入力形式が壊れている場合は、出力ではなく「入力が不正」や「実行エラー」が表示される。
- プレイグラウンドの操作が、実テスト評価の正誤判定に影響しない。

## 現状の症状（バグ）
- 入力データを変更しても出力が変わらない。
- コマンド（パイプライン）を変更しても出力が変わらない。
- その結果、プレイグラウンドが確認用途として機能していない。

## 対象範囲（関係しそうな責務）
- UI（課題画面）
  - `apps/user/app/tasks/[taskId]/page.tsx`（課題画面の組み立て）
  - `apps/user/src/lib/terminal/PseudoTerminalRunner.tsx`（疑似ターミナル/プレイグラウンド表示）
- Playground API
  - `apps/user/app/api/playground/run/route.ts`（入力 + パイプライン → 出力 を返す）
- Client/Contract
  - `apps/user/src/lib/terminal/playgroundClient.ts`
  - `apps/user/src/lib/terminal/playgroundContract.ts`
- 状態
  - `apps/user/src/lib/command-builder/commandBuilderStore.ts`（パイプライン状態）
  - `apps/user/src/lib/terminal/terminalStore.ts`（入力/出力/実行状態があるなら）

## 仕様（機能要件）
### 1) 入力データが出力に反映されること
- プレイグラウンド実行は、必ず「ユーザーが今入力している入力データ」を使用する。
- 既定値（例: testCases[0] や固定のサンプル）にフォールバックする場合は、ユーザー未入力時のみとする。
- 入力のパース/正規化は “1箇所” で行い、UI側の推測を増やさない。

### 2) パイプライン（コマンド選択）が出力に反映されること
- プレイグラウンド実行は、必ず「ユーザーが今組んでいるパイプライン」を使用する。
- パイプラインは既存の `serialize` 等で API に渡せる形へ変換し、contract（Zod等）で検証する。

### 3) 実行トリガーと安定化
- 入力/パイプライン変更のたびに実行してよいが、次の安全策を必須にする。
  - debounce（例: 200〜400ms）
  - 直前リクエストの Abort（AbortController）で競合・順序逆転を防ぐ
- 連打や編集中でも UI が固まらず、最終状態の結果が表示される。

### 4) エラー表示
- 入力の形式エラー（parse/validation）と、実行エラー（runner側）を区別して表示する。
- 画面全体を落とさず、プレイグラウンド領域に閉じたエラー表示にする。

### 5) 実テスト（evaluate）との独立
- プレイグラウンドは `/api/playground/run` のみを使用し、`/api/tasks/[taskId]/evaluate` を叩かない。
- プレイグラウンドの状態変更が、実行→結果（evaluate）に影響しない（共有storeの誤用をしない）。

## NFR（非機能要件：4軸）
- 安全性: 入力/パイプラインの検証を contract で行い、不正データでサーバを落とさない。Secretsに触れない。
- 変更容易性: “入力取得 → serialize → API呼び出し → 表示” の責務を分離し、依存を減らす。
- 性能: debounce/abortで無駄な実行を抑える。重い計算をクライアントに持ち込まない（原則サーバで実行）。
- 運用: `make verify` / `make evidence` に加え、再現しやすい手順を spec に残す。

## Acceptance Criteria（受け入れ条件）
1. 入力データを変更すると、プレイグラウンド出力が変わる（少なくとも1例で確認できる）。
2. パイプライン（コマンドの追加/削除/並び替え/パラメータ変更）を行うと、出力が変わる。
3. 入力が不正な場合、プレイグラウンド領域にエラーが表示され、画面全体が落ちない。
4. プレイグラウンド実行は `/api/playground/run` を使用し、実テスト評価を誤って叩かない。
5. `make verify` と `make evidence` が成功する。
6. （推奨）E2Eで、入力変更→出力変化を1ケース以上担保する。

## 再現手順（最小）
- 課題画面へ移動（/tasks/<taskId>）
- プレイグラウンドの入力データに、明らかに違う値を入れる（例: 0だけ / 1だけ / 連番）
- 出力が変わらないことを確認（現状）
- 本修正後は同手順で出力が変わること

## 実装計画（最小ステップ）
1. 状態の流れを追う
   - UI入力がどのstateに入り、APIに何が送られているかを確認する（logは一時的にOK、最終的に削除）。
2. Contract を確認し、payloadに “入力” と “パイプライン” が含まれていることを保証する
   - `playgroundContract.ts`（Zod）で schema を固定する。
3. playgroundClient を修正
   - 最新入力/最新パイプラインを payload に含める
   - debounce + abort を実装（stale response を捨てる）
4. API route を修正
   - bodyから入力/パイプラインを使用して runner を実行し、出力を返す
   - 不正入力は 400、実行エラーは 200 + error payload（または 500）など、既存方針に合わせて統一する
5. UI表示を修正
   - 返却結果を受けて出力を更新
   - error はプレイグラウンド領域で表示
6. 検証
   - `make verify`
   - `make evidence`
   - （可能なら）E2E追加

## テスト計画
- 必須:
  - `make verify`
  - `make evidence`
- 推奨:
  - Playwright: 課題画面で入力を変え、出力が変わることを1ケース検証
    - 変更対象: `e2e/tests/*` に新規または既存specへ最小追記
