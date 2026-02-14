# Spec: results 詳細への遷移が /api/results/* に迷い込み NotFound になるのを修正

- Status: active
- Owner: ちゃぴぃ
- Repo: czz
- Apps: apps/user
- Related: tasks evaluate API `POST /api/tasks/:taskId/evaluate` は `resultId` を返す

## 背景 / 現状

課題の評価 API は成功し、`resultId` も返ってきている。

例:
- Request: `POST http://localhost:3100/api/tasks/<taskId>/evaluate`
- Response:
  - `ok: true`
  - `resultId: <uuid>`

しかしその直後、ブラウザは `http://localhost:3100/api/results/<resultId>` のような URL に遷移してしまい、Next.js の NotFound 画面（「ページが見つからない」）が表示される。

表示されているパンくずも `home / api / results / result` になっており、誤ったパスにいることが示唆される。

さらに、NotFound 画面の HTML（Next dev の巨大な script 群）が表示され、開発中の CPU 使用率が跳ね上がるように見える。

## 何が問題か（推定）

- 本来の「結果詳細ページ」は `/results/<resultId>` であるべきなのに、
  - クライアント側の `router.push` / `<Link>` / ルーティング生成が誤って `/api/results/<resultId>` を作っている可能性が高い。
- `/api/*` は App Router では API Routes の領域（`app/api/**/route.ts`）であり、
  - UI のページ遷移先としては不適切。
  - 現状 `apps/user/app/api` 配下に `results` 系の route が存在しないため、NotFound に落ちるのは筋が通っている。

## 目的（Why）

- 評価後の遷移が常に `/results/<resultId>` に向くようにする。
- results 詳細ページが存在し、DB に保存された Result を表示できるようにする。
- 誤って `/api/results/*` に行ってしまう経路を潰し、NotFound＋巨大 HTML を踏まないようにする（体感負荷も下げる）。

## スコープ（What）

### In scope

1) 評価後遷移の修正
- `resultId` を受け取ったら、`/results/<resultId>` に遷移する。
- どの UI から評価を起動しても同じ挙動になる（課題画面 / playground / debug panel 等）。

2) results 詳細ページの存在保証
- `apps/user/app/results/[resultId]/page.tsx` を用意（存在しないなら作成、別名があるなら統一）。
- Server Component で `resultId` を受け、必要なら client component に表示を委譲。
- 404（該当 result が無い）時は分かりやすい notFound() に落とす。

3) results 取得の経路整理
- UI ページ `/results/[resultId]` が参照する取得先を明確化。
  - 例: `GET /api/results/<resultId>` を新設するか、
  - 既存の repository/usecase を server component 内で直接呼ぶ（App Router のサーバー側で完結）。
- いずれにせよ「ページ URL」と「API URL」を混同しない。

4) 安全策（任意だが推奨）
- 既に発生している誤 URL を踏んだ場合でも、
  - `/api/results/<id>` へ来たら `/results/<id>` へリダイレクトする（互換の救済）。
  - ただし `/api/*` は通常 API なので、リダイレクトは実装場所に注意（middleware など）。
  - やり過ぎると API と衝突するので最小限に。

### Out of scope

- Runner の I/O mismatch（`>` と `>>` の学習仕様）をどうするかの議論
  - 今回は「結果ページへ正しく遷移し表示できること」が主題。
- TurboPack/HMR の最適化や Next の内部挙動の解析（副作用として体感改善は期待）

## 受け入れ条件（Acceptance Criteria）

- [ ] `POST /api/tasks/:taskId/evaluate` が `ok: true` を返すケースで、ブラウザが `/results/<resultId>` に遷移する。
- [ ] `/api/results/<resultId>` へ遷移する経路がなくなる（コード上で修正済み）。
- [ ] `/results/<resultId>` を開くと、結果の要約（passed/total/status など）が表示される。
- [ ] その `resultId` が DB に存在しない場合、適切な NotFound 表示になる。
- [ ] `pnpm -w typecheck` / `pnpm -w test` / `pnpm -w lint`（プロジェクトの標準）に通る。
- [ ] （可能なら）Playwright か最小の E2E/統合テストで「evaluate→results遷移」を再現できる。

## 実装方針（How）

### 1) まず「どこが /api/results を作っているか」を特定する

候補:
- `apps/user/app/results/*` 周辺の client component
- evaluate ボタンの handler（`router.push(...)`）
- `SfxLink` / Breadcrumbs / ナビゲーションヘルパ
- ルート生成ユーティリティ（`routes.ts` 的なもの）

調査コマンド例:
- `rg -n "/api/results|api/results|results/\$\{resultId\}" apps/user -S`
- `rg -n "router\.push\(|href=\{|Link\s" apps/user -S`

### 2) ルートを「単一の関数」に集約（再発防止）

例:
- `apps/user/src/routes/results.ts` に
  - `resultDetailPath(resultId: string) => /results/<id>`
  - `resultApiPath(resultId: string) => /api/results/<id>`（必要なら）
- UI は必ず `resultDetailPath` を使う

### 3) results 詳細ページを実装

- `app/results/[resultId]/page.tsx`（Server Component）
  - `params.resultId` を受け取る
  - 取得 → 表示 or notFound
- 取得方法は2案:
  - A: Server Component から repository/usecase を直接呼ぶ（API を経由しない）
  - B: `app/api/results/[resultId]/route.ts` を新設し、ページは fetch する

このプロジェクトは Clean Architecture を前提にしているので、
- A案: server side で `DrizzleResultRepository` + `GetResultUseCase` を呼ぶのが自然（API と同じ構成で再利用）
- B案: API route も必要なら用意（将来 admin などでも使える）

### 4) /api/results/* 互換救済（必要なら）

- 既にブックマークされたり、どこかに残っている可能性があるなら
  - middleware で `/api/results/:id` を `/results/:id` に 302 redirect
- ただし API と衝突しやすいので、実装するなら「results だけ」に限定して慎重に。

## エビデンス（実行ログに残す）

- evaluate 実行 → `resultId` 取得
- ブラウザ URL が `/results/<id>` に遷移
- `GET /results/<id>` の画面に passed/total が表示
- `make evidence` があるなら `make evidence` で残す（なければコマンドログでもよい）

## リスク / 罠

- Breadcrumbs は「表示」であって「遷移原因」ではない可能性がある（ただし手掛かりにはなる）
- `Link` の href が相対パスだった場合、現在位置によって解釈が変わり事故る（`results/${id}` と `/results/${id}` の違い）
- Next の notFound 連鎖や error boundary で、見た目が同じでも原因が違うことがある（console と network を併せて見る）
