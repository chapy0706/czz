<!-- path: docs/specs/active/2026-02-14-issue-results-ui-multicase.md -->

# Spec: Results UI を初心者向けに再設計し、複数テストケース詳細を見せる

## 0. 背景 / 現状

- `GET /api/results/:resultId` は 200 で返るようになった（`passed/total/taskId/createdAt` などの要約が取れる）。
- しかし UI 上で「JSON そのまま表示」または「JSON のみ」になりがちで、初心者/上級者どちらにも読みやすさが不足している。
- もともと `testCases` を複数持たせる設計なので、「各ケースの結果と詳細（期待値/実出力）まで辿れる」導線が欲しい。

## 1. Goal

- `/results/<resultId>` ページで、初心者にも意味が通る結果表示を行う。
- 複数テストケースの結果を一覧で見せ、ケースをクリックすると詳細（期待値/実出力/差分のヒント）を確認できる。
- 上級者モードでも、生 JSON を貼り付けるのではなく「構造化された読みやすい表示」にする。

## 2. Non-goals

- Runner I/O mismatch（学習仕様）の改変、DSL 実行仕様の変更。
- DB スキーマの大改造（列追加などの大手術）。
- Turbopack/HMR 等のパフォーマンス調整。

## 3. 用語

- Result: 1回の評価実行の記録（taskId, userId, resultStatus, createdAt, output 等を持つ想定）
- TestCase: tasks 側に定義される入力/期待値セット（複数）
- CaseResult: 各テストケースの判定結果（passed/failed と details）

## 4. 望ましい API 形（UI が欲しい最低限）

既に返っている：
- `ok`, `resultId`, `passed`, `total`, `taskId`, `createdAt`

追加で UI が欲しい（可能なら）：
- `status`（passed/failed の明示）
- `cases`: Array<{ index: number; name?: string; status: "passed"|"failed"; expected?: string; actual?: string; stdout?: string; stderr?: string; hint?: string; }>
- `summary`: 失敗がある場合の要点（例: 「2ケース目で想定出力と異なる」）

ただし、DB/既存 output 形式に合わせて「取得できる範囲で」よい。
最初は `cases` が作れないなら、次の段階的対応でもよい：
- Phase1: summary を整える（JSON 直出しをやめる）
- Phase2: output からケース単位に分解して表示（可能なら）

## 5. UI 仕様

### 5.1 共通（初心者/上級者共通の骨格）

- 上部に「実行結果サマリ」カード
  - 判定（成功/失敗を色と文言で）
  - `passed / total`
  - `createdAt`（ローカル表示でも OK）
  - 「タスクへ戻る」「課題一覧へ」「もう一度実行」の CTA

- 下部に「テストケース一覧」
  - 各ケースを行（行カード）で表示：Case #, status, できれば短い説明
  - クリック/タップで詳細パネル（Accordion / Dialog / Drawer）を開く
    - 期待値（expected）
    - 実出力（actual）
    - stdout/stderr（あれば）
    - 失敗理由のヒント（差分の強調などは任意）

### 5.2 初心者モード

- 難しい語を避ける。例：
  - 「stdout」→「画面に出た文字」
  - 「expected」→「正しい答え（期待値）」
  - 「actual」→「あなたの出力」
- 失敗時は「どこが違うか」を短い文章で案内（可能なら）。
- 生の JSON 表示は出さない（デバッグ用途は上級者に寄せる）。

### 5.3 上級者モード

- 「構造化表示」を基本にしつつ、必要なら「詳細」内に
  - raw JSON（折りたたみ）
  - copy ボタン
  を用意する。
- ただし初期実装は raw JSON を消すだけでも良い（段階的）。

## 6. 受け入れ基準（AC）

1. `/results/<resultId>` は JSON 直出しではなく、サマリカードを表示する
2. `passed/total/status/createdAt` が視認しやすい
3. 2件以上のケースがある場合、ケース一覧が表示される
4. ケースをクリックすると、少なくとも「期待値」と「実出力（または出力）」が見られる
5. 初心者モードでは用語が初心者向けに言い換えられている
6. 上級者モードでは raw JSON をデフォルト表示しない（任意で展開できるのは可）
7. 404（Result not found）は NotFound / 分かりやすいメッセージになる
8. `make verify` が通る（typecheck / lint / test）

## 7. 実装当たり（候補）

- UI:
  - `apps/user/app/results/[resultId]/ResultsByIdClient.tsx`
  - `apps/user/app/results/[resultId]/page.tsx`
  - 既存 UI コンポーネント（`apps/user/src/components/ui/*`）

- API:
  - `apps/user/app/api/results/[resultId]/route.ts`
  - `infra/drizzle/repositories/resultRepository.ts`
  - 既存の `output` 形式に応じて `cases` を組み立てられるなら組み立てる

## 8. 設計判断（4軸）

- 安全性: IDOR を維持（userId による所有確認は必須）。詳細情報の出し過ぎに注意。
- 変更容易性: UI は段階的に。API レスポンスを安定させ、表示変化の影響範囲を小さくする。
- 性能: 初期は 1 API fetch で十分。ケース詳細を遅延ロードするのは後回し。
- 運用: 失敗時の表示（401/404/500）を明確にし、再現の手掛かりを残す。

## 9. Codex / Claude Code への最小プロンプト（実装用）

- spec: `docs/specs/active/2026-02-14-issue-results-ui-multicase.md`
- do:
  - Results UI を「サマリ + ケース一覧 + ケース詳細」へ置き換える
  - 初心者/上級者モードで用語と表示密度を調整する
  - 可能なら API から `cases` を返す（無理なら Phase1 で summary のみでも可）
- dont:
  - DSL 実行の中身や評価ロジックを変えない
  - 破壊的な DB 変更をしない
  - secrets を触らない、git push しない
- verify:
  - `make verify`
  - （任意）`pnpm -w e2e test` or `pnpm -w e2e test -- --grep result`
