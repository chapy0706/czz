<!-- docs/specs/active/2026-02-14-issue-fix-results-api-auth-401.md -->

# Spec: results API の 500 を 401/403 に正規化し、ローカル https/http の揺れを潰す

## 背景

`GET /api/results/:resultId` が `500 Internal Server Error` を返す。
レスポンスヘッダに以下が出ている。

- `x-clerk-auth-reason: dev-browser-missing`
- `x-clerk-auth-status: signed-out`

つまり「未ログイン（または Clerk の dev browser token が付かない）」状態で API が落ちている可能性が高い。

また、`https://localhost:3100` で試していたのに、いつの間にか `http://localhost:3100` で叩いている。
Clerk 側の Cookie が `Secure` で付与されている場合、**http では Cookie が送信されず強制的に signed-out になる**。

## 先に答え

- `resultId` は URL パスに載せてよいが、`userId` をパスに載せる設計は避ける（IDOR の温床）。
  - 認可は「今のログインユーザー（Clerk の userId）」と「result.ownerUserId」をサーバー側で突き合わせてやる。
- `http` と `https` の差分は **原因になりうる**（Cookie の `Secure` 属性次第）。
  - ただし、どちらにせよ「未認証」なら **500 ではなく 401** を返すのが正しい。

## Goal

- 未ログイン時に `/api/results/:resultId` が 500 にならず、401（or 403）を返す
- UI（`/results/:resultId`）が 401 を自然に扱い、ユーザーにログイン導線を出す
- ローカル環境で `http/https` が混ざってもデバッグしやすい状態にする

## Non-goals

- 認証方式そのものの変更（Clerk → 別）
- Runner I/O の仕様調整
- DB スキーマ変更

## 現象の再現手順

1. ローカルで `http://localhost:3100/api/results/<resultId>` にアクセス
2. レスポンスが `500`、Body が `{ ok:false, error:"Internal Server Error" }`
3. ヘッダに `x-clerk-auth-reason: dev-browser-missing` / `signed-out` が付く

## 仮説

H1. API route 内で `auth()` / `currentUser()` の戻りが空（未ログイン）なのに例外を投げて 500 になっている

H2. `https` でログインして Cookie が `Secure` になっており、`http` で叩くと Cookie が送られず signed-out になる

## 期待する挙動（AC）

1. 未ログインで `GET /api/results/:resultId` → `401`（JSON）
2. ログイン済みだが他人の resultId → `404` または `403`（方針に従う）
   - 推奨: 404（存在隠し）
3. ログイン済み & 自分の resultId → `200`（JSON）
4. `/results/:resultId` は 401 を検知したら「ログインして結果を見る」導線を表示する
5. `make verify` が通る

## 実装方針

### 1) API route を「失敗しても落ちない」形にする

対象:
- `apps/user/app/api/results/[resultId]/route.ts`

やること:
- `auth()` の戻りが無い（`userId` が falsy）場合は即 `401` を返す
- 想定外例外は catch して `500` ではなく、ログを残した上で `500` を返す（ログは必須）
  - ただし「認証不備」を例外にしない（401 で返す）

### 2) UI 側の fetch エラーを分岐

対象:
- `apps/user/app/results/[resultId]/ResultsByIdClient.tsx`

やること:
- `res.status === 401` を専用ハンドリング
  - 例: 「ログインが必要」表示 + `/auth/sign-in` へのリンク
- `404` は NotFound 表示（今のまま）

### 3) ローカルの http/https を揃える（運用）

- 既に `apps/user/certificates/localhost.pem` 等があるので、開発サーバを https で起動している可能性が高い。
- **運用ルールとして**「ローカルは https で開く」を決め、`http://localhost:3100` をブクマから消す。
- もし http で運用したいなら、Cookie が `Secure` にならない条件に揃える（Clerk/Next の設定見直し）。
  - ここは環境依存なので、今回の issue では「https を正」とするのが安全。

## 変更対象（想定）

- `apps/user/app/api/results/[resultId]/route.ts`
- `apps/user/app/results/[resultId]/ResultsByIdClient.tsx`
- （任意）`docs/runbook/` に「ローカル https で開く」メモを追記

## テスト観点

- ブラウザでログイン済み → `/results/:id` が表示される（ネットワーク 200）
- ブラウザでログアウト → `/results/:id` でログイン導線（ネットワーク 401）
- curl で叩く場合は Cookie を付けない限り 401 になる（500 にならない）

## Codex / Claude Code 用の最小プロンプト

- spec: `docs/specs/active/2026-02-14-issue-fix-results-api-auth-401.md`
- do:
  1. `apps/user/app/api/results/[resultId]/route.ts` を修正し、未認証時は 401 を返す（例外にしない）
  2. `ResultsByIdClient.tsx` で 401 を扱い、ログイン導線を出す
  3. `make verify` を通す
- dont:
  - userId を URL パスに追加しない
  - 既存の IDOR 防止ロジックを弱めない
  - secrets / 破壊的コマンド / git push しない

