<!-- docs/specs/active/2026-02-15-issue-TBD-user-flow-routing-dead-code-prune.md -->

# Spec: TOP→課題→結果フロー周辺のルーティング棚卸しと未使用ファイル削除

- Issue: TBD
- Owner: TBD
- Status: draft
- Updated: 2026-02-15

## Why（目的）
- 対象フロー（TOP→課題→結果）の「入口・出口・責務」を言語化し、影響範囲が読める状態にする。
- 使われていないファイル（古い試作・サンプル・置き土産）を削除し、今後のリファクタリングを安全にしやすくする。

## In scope（対象範囲）
- 対象: `apps/user` のうち、以下のユーザーフローに関係するルート/コンポーネント/ユーティリティ
  - TOP: `/`（`apps/user/app/page.tsx`）
  - 課題一覧: `/tasks`（`apps/user/app/tasks/page.tsx`）
  - 課題詳細: `/tasks/[taskId]`（`apps/user/app/tasks/[taskId]/page.tsx`）
  - 結果（実行中）: `/results/running`（`apps/user/app/results/running/page.tsx`）
  - 結果（詳細）: `/results/[resultId]`（`apps/user/app/results/[resultId]/page.tsx`）
- 出力物: 対象フローの「責務マップ」短文ドキュメント（`docs/` 配下に1枚を推奨）

## Out of scope（非対象）
- アプリ全体の網羅的なデッドコード削除（今回は“対象フロー周辺のみ”）
- ルーティング設計の大改修（パス構造の全面変更）
- 見た目/文言の改善（パンくずは別Issueで扱う）
- 依存更新やビルド基盤の変更

## NFR（非機能要件：4軸）
- 安全性: ルート削除・ファイル削除の事故を避ける。Secretsに触れない。破壊的コマンド禁止。
- 変更容易性: 「何が対象フローの心臓部か」が追えること。責務マップが薄く維持されること。
- 性能: 今回は性能改善を狙わない。削除で不要コードが減るのは副次効果としてOK。
- 運用: `make verify` / `make evidence` による証拠が残ること。引継ぎ4点が揃うこと。

## Acceptance Criteria（受け入れ条件）
1. 対象フローの責務マップ（短いドキュメント）が追加されている。
   - 最低限、各ルートの責務、主要コンポーネント/状態の入口、遷移元/遷移先が分かる。
2. 対象フロー周辺で「未使用」と確認できたファイルが削除されている。
   - 削除対象は「参照が無い（import/route/link が無い）」ことが根拠として説明できる。
   - Next.jsの慣習ファイル（`layout.tsx`, `error.tsx`, `not-found.tsx` 等）を誤って消していない。
3. 検証が通る。
   - `make verify` が成功
   - `make evidence` が成功（ログが保存される）
   - （推奨）E2Eの user-flow-top-to-result が成功
4. 変更は最小限で、削除の意図が追える。
   - `git diff --name-only` が「削除＋必要最小限の参照修正」に留まる。

## 調査の当たり（候補ファイル）
- ルート（対象フロー）
  - `apps/user/app/page.tsx`
  - `apps/user/app/tasks/page.tsx`
  - `apps/user/app/tasks/[taskId]/page.tsx`
  - `apps/user/app/results/running/page.tsx`
  - `apps/user/app/results/[resultId]/page.tsx`
- 画面主要部品（想定）
  - `apps/user/src/lib/command-builder/*`
  - `apps/user/src/lib/terminal/*`
  - `apps/user/src/components/tasks/TaskHeader.tsx`
  - `apps/user/src/components/top/*`
- 既に怪しい“置き土産”候補（削除可否は要確認）
  - `apps/user/app/result/page.tsx`（`/result`：`/results` と重複している可能性）
  - `apps/user/app/client-rendered-page/page.tsx`（サンプルの可能性）
  - `apps/user/app/server-rendered-page/page.tsx`（サンプルの可能性）

## 実装方針（安全に削るための手順）
1. ルーティング棚卸し（最初にやる）
   - 対象ルートの責務・遷移を、短いメモにする（後述の `docs/` へ）。
   - ルート間の遷移元を `rg` で確認（`href=`, `router.push`, `Link`）。
2. “到達可能性”で候補を絞る
   - TOP→課題→結果の遷移から到達しないページ（例: サンプルページ）があるか確認。
3. 参照調査（削除の根拠作り）
   - 各候補について `rg -n "<filename|export|route>" apps/user` を実施し、参照が無いことを確認。
   - 「参照があるが、対象フロー外」の場合は今回は消さない（スコープ外）。
4. 削除→最小修正→検証
   - 1ファイル（or 1まとまり）ずつ削除して `make verify` を回す。
   - 最後に `make evidence` を必ず実行。
5. 変更一覧と証拠を残す
   - `git diff --name-only`
   - `git rev-parse --short HEAD`
   - `out/evidence/<...>.log`

## 追加ドキュメント（責務マップ）のテンプレ
- ファイル案: `docs/user-flow-routing-map.md`

含める項目（短く）:
- ルート一覧（path → file）
- 各ルートの責務（2〜4行）
- 主要状態（例: UIモード、コマンドビルダー状態、結果IDの保持箇所）
- 主要な遷移（TOP→課題一覧→課題詳細→結果）

## テスト計画
- 必須
  - `make verify`
  - `make evidence`
- 推奨
  - E2E: `e2e/tests/user-flow-top-to-result.spec.ts` を実行
    - 実行方法は `e2e/package.json` の scripts に合わせる（例: `pnpm -C e2e test` など）

## リスクと対策
- リスク: “未使用”と思って消したら、別の導線（設定/アカウント/管理導線）で使っていた
  - 対策: 今回は対象フロー周辺に限定し、参照があるものは消さない。削除は小さく刻む。
- リスク: Next.js慣習ファイルやルーティング境界を誤って削除する
  - 対策: `app/` 配下の `layout.tsx` / `error.tsx` / `not-found.tsx` などは原則触らない。
- リスク: デッドコード削除が“ついでリファクタ”に膨張する
  - 対策: Non-goals を守り、削除と参照修正以外はしない。
