<!-- docs/specs/active/fix-results-api-auth-401.md -->

# Spec: Results API が 500 になる問題を 401/403 に正規化し、結果詳細取得を安定させる

## 背景 / 現状

- `GET /api/results/:resultId` が `500 Internal Server Error` を返すケースがある。
- `curl` では以下のヘッダが出ており、Clerk の認証情報が付与されていない状態で API に到達している。
  - `x-clerk-auth-status: signed-out`
  - `x-clerk-auth-reason: dev-browser-missing`

- ブラウザでの結果詳細画面からも `API returned 500` と出ることがある。
- 以前は `https://...` で試していたが、現在はローカルの `http://localhost:3100`。

## 目的（Why）

- 認証/認可不足（signed-out）を「500」ではなく「401/403」で返す。
- Result 取得時に **IDOR（他人の resultId を見れる）** を防ぐ。
- ローカル/本番/プレビュー（https）で同じコードが動くように、URL の組み立てを安全にする。

## 非目的（Not now）

- results の UI デザイン刷新
- 複数結果一覧（履歴ページ）の実装

## 期待する挙動（Acceptance Criteria）

1. 未ログイン状態で `GET /api/results/:resultId` を叩くと
   - `401` と `{ ok:false, error:{ kind:"AUTH", ... } }` が返る（500 にならない）。
2. ログイン済みでも「別ユーザーの resultId」を指定すると
   - `403` か `404`（方針に沿う方）で返る（データ漏えいしない）。
3. 結果詳細画面は
   - 401/403/404 のときに「結果の取得に失敗した」ではなく、理由に応じた案内を出す（例: ログインへ誘導 / 権限なし / 見つからない）。
4. fetch URL は **常に same-origin** を使う（ローカル http / 本番 https でも破綻しない）。
   - 例: `fetch(f"/api/results/{resultId}")`
   - 絶対 URL（https 固定）や別ホストに飛ばさない。

## 調査メモ（仮説）

- `curl` が signed-out なのは「Cookie / dev-browser トークンが無い」ためで自然。
- UI 側が 500 を踏むのは、以下のどれかの可能性が高い:
  - API 側が signed-out を例外として投げてしまい 500 になっている
  - UI 側が `https://.../api/results/...` のように別 origin を叩いて Cookie が送られていない
  - middleware の rewrite/保護対象の設定がズレている

## 実装方針（How）

### A) API: /api/results/[resultId] を「例外を投げない」設計に

- `@clerk/nextjs/server` の `auth()` で `userId` を取り、無ければ 401 を返す。
- DB から result を取ったら `result.userId === userId` を必ず検証する。
- 失敗時は `Response.json(..., { status })` で返し、throw しない。
- 例外は最終防衛として catch して 500 を返すが、ログは残す（PII を含めない）。

### B) UI: fetch URL を same-origin に固定

- `NEXT_PUBLIC_APP_URL` 等を使った絶対 URL をやめる（使うなら server-only で厳密に）。
- クライアント fetch は相対パスで十分。
- `credentials` は通常不要（same-origin なら Cookie は送られる）。cross-origin になるなら設計自体を見直す。

### C) UI: ApiOk | ApiErr の型取り回しを統一

- `ApiOk | ApiErr` なのに `res.error` を直接読んで型エラーが出ていた。
- `if (!res.ok) { ...res.error... }` のように `ok` を discriminant にして分岐する。

## 変更が入りそうなファイル（候補）

- `apps/user/app/api/results/[resultId]/route.ts`（新規 or 修正）
- `apps/user/app/results/[resultId]/ResultsByIdClient.tsx`（fetch と表示分岐）
- `apps/user/app/middleware.ts`（Clerk middleware の適用範囲がズレている場合のみ）
- `packages/types` or `apps/user/src/lib/api`（ApiOk/ApiErr の共通型があるならそこ）

## 手動テスト手順

1. ログアウト状態で:
   - `curl -i http://localhost:3100/api/results/<id>`
   - 期待: 401（x-clerk-auth-status: signed-out でも 500 にならない）
2. ログイン状態でブラウザから結果詳細へ遷移:
   - 期待: 正常表示
3. ログイン状態で「別ユーザー resultId」を叩く（可能なら）:
   - 期待: 403/404
4. もし `https://...` で動かす環境があるなら同様に確認:
   - 期待: fetch URL が相対なので問題なし

## リスク / セキュリティ観点

- `resultId` は推測可能な UUID なので、**必ず userId で認可**しないと情報漏えい（IDOR）になる。
- エラー詳細に DB の生ログやスタックトレースを返さない。
