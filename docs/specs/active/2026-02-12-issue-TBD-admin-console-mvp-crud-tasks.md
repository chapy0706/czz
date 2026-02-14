<!-- docs/specs/active/2026-02-12-issue-TBD-admin-console-mvp-crud-tasks.md -->

# Spec: Admin Console MVP（TOP + Tasks CRUD）

- Issue: TBD
- Spec: docs/specs/active/2026-02-12-issue-TBD-admin-console-mvp-crud-tasks.md
- Status: active
- Owner: ちゃぴぃ
- Updated: 2026-02-12

## Context（背景 / 現状）
- czz は `apps/user` がゲーム本体、`apps/admin` が管理画面。
- DB 接続は完了している前提で、管理画面の UI 作り込みと CRUD 操作は未完。
- `apps/admin` には既に API/ページの芽がある（例: `apps/admin/app/api/admin/tasks/route.ts`, `apps/admin/app/page.tsx`, `apps/admin/app/tasks/new/page.tsx`）。

## Goal（勝利条件）
- 管理TOPと Tasks CRUD 画面が揃い、管理者が Tasks を作成・編集・公開切替できる。
- 1週間スコープで「使える道具」として成立し、後からメトリクス/ユーザー管理を載せられる土台になる。

## Non-goals（やらないこと）
- TOP に MAU/達成率グラフ等の実装（枠の予約のみ可）。
- ユーザーステータス変更機能（別Issue）。
- 高度な一覧機能（検索/フィルタ/ページネーション/ソートの充実）。
- リッチな JSON エディタ（補完・差分・lint等）。当面は textarea + 最低限の整形で可。
- 本格的な認証基盤統合（Clerk等）。当面は最小のガードで可。

## Scope（Do / Don’t）
### Do（このSpecでやる）
- Admin TOP
  - 管理メニュー（Tasks一覧 / 新規作成 への導線）
  - “メトリクス枠”のプレースホルダー（例: 3カード + 「近日対応」）
- Tasks CRUD（MVP）
  - 一覧（最低限: title, isPublished, updatedAt）
  - 新規作成
  - 編集
  - 公開/非公開切り替え（isPublished）
  - （任意）削除：迷うなら後回し。やる場合は確認ダイアログ必須
- Admin API（Next App Router の Route Handlers）
  - `/api/admin/tasks`（GET/POST）
  - `/api/admin/tasks/[taskId]`（GET/PATCH/DELETE）
- 入力バリデーション
  - API 入口で Zod バリデーションを行い、UseCase/DB層へ unknown を流さない
- 最小の認可ガード（暫定）
  - 例: `x-admin-token` ヘッダ + `process.env.ADMIN_TOKEN` で一致確認
  - 失敗時は 401 で一定のレスポンス形

### Don’t（このSpecではやらない）
- Analytics API/集計テーブル（MAU/達成率の集計処理は別Spec）
- Users 管理（role/disabled など）
- 監査ログ/運用ログの本実装（別Spec）
- 管理画面のデザイン作り込み（UIの美しさより「動く」を優先）

## Acceptance Criteria（受け入れ条件）
### UI
1. `/`（Admin TOP）が表示され、Tasks一覧/新規作成へ遷移できる。
2. `/tasks` で Tasks の一覧が表示される（最低限の列）。
3. `/tasks/new` で Task を作成でき、成功後に一覧へ戻る（または編集画面へ遷移）。
4. `/tasks/[taskId]/edit` で Task を編集できる。
5. 公開/非公開トグル（isPublished）が動作し、一覧に反映される。
6. バリデーションエラーが UI に表示される（“何がダメか”が分かる）。

### API / Contract
7. `GET /api/admin/tasks` が 200 で配列を返す。
8. `POST /api/admin/tasks` が 201（または200）で作成結果を返す。
9. `GET /api/admin/tasks/[taskId]` が 200 で単体を返す。存在しなければ 404。
10. `PATCH /api/admin/tasks/[taskId]` が 200 で更新結果を返す。
11. （実装する場合）`DELETE /api/admin/tasks/[taskId]` が 200（または204）で削除できる。
12. 認可ガードに失敗した場合、全APIが 401 を返す。

### Quality Gate
13. `make verify` と `make evidence` が成功する（少なくとも今回の変更範囲が原因で落ちない）。

## API 仕様（最小）
- 共通レスポンス形（推奨）: `ApiResult<T>`
  - `{ ok: true, data: T }`
  - `{ ok: false, error: { code: string, message: string, details?: unknown } }`
- Task DTO（最小）
  - `id: string`
  - `title: string`
  - `description: string`
  - `dslProgram: unknown`（JSONB）
  - `testCases: unknown`（JSONB）
  - `isPublished: boolean`
  - `createdAt/updatedAt: string`（ISO）
- バリデーション（Zod）
  - `title`: 1..120
  - `description`: 0..4000
  - `dslProgram/testCases`: JSON として parse できること（`JSON.parse` → Zod で shape を緩く）
    - MVP では domain の厳密schemaまで縛らない（別Specで強化）

## Pages / Routes（提案）
- `apps/admin/app/page.tsx` : Admin TOP
- `apps/admin/app/tasks/page.tsx` : Tasks 一覧（新規作成ボタン + 編集リンク）
- `apps/admin/app/tasks/new/page.tsx` : 作成
- `apps/admin/app/tasks/[taskId]/edit/page.tsx` : 編集

API:
- `apps/admin/app/api/admin/tasks/route.ts` : GET/POST
- `apps/admin/app/api/admin/tasks/[taskId]/route.ts` : GET/PATCH/DELETE

## Implementation Notes（安全・変更容易性・性能・運用の4軸）
- 安全性
  - admin API を必ずガード（暫定トークン方式でも無防備よりマシ）。
  - JSON 入力は “文字列→JSON.parse→Zod” の順で、例外を握りつぶさず `ApiResult.error` に載せる。
- 変更容易性
  - UI は “fetch client” を 1箇所に寄せる（例: `apps/admin/src/lib/adminApi.ts`）。
  - Zod schema（入力/出力）を 1箇所に寄せる（例: `apps/admin/src/lib/contracts/taskContract.ts`）。
- 性能
  - 一覧は MVP では全件で良い（ただし将来 pagination を想定し API shape を壊さない）。
- 運用
  - 失敗時ログは `console.error` で最低限（秘密情報は出さない）。
  - Evidence を必ず残す（後で回帰しやすくする）。

## Candidate Files（当たり）
- `apps/admin/app/page.tsx`
- `apps/admin/app/tasks/new/page.tsx`
- `apps/admin/app/api/admin/tasks/route.ts`
- 追加候補
  - `apps/admin/app/tasks/page.tsx`
  - `apps/admin/app/tasks/[taskId]/edit/page.tsx`
  - `apps/admin/app/api/admin/tasks/[taskId]/route.ts`
  - `apps/admin/src/lib/adminApi.ts`（新規）
  - `apps/admin/src/lib/contracts/taskContract.ts`（新規）

## Step-by-step Plan（最小手順）
1. Contract 固定
   - `ApiResult<T>` と Task DTO を admin 側に定義（または既存があるなら流用）。
2. API を揃える
   - `/api/admin/tasks` を GET/POST 対応にする。
   - `/api/admin/tasks/[taskId]` を新規追加（GET/PATCH/DELETE）。
3. UI: Create を通す
   - `/tasks/new` を完成させる（textarea で JSON 入力、保存成功で遷移）。
4. UI: List を作る
   - `/tasks` 一覧 + 新規作成導線 + 編集リンク。
5. UI: Edit を通す
   - `/tasks/[taskId]/edit` でロード→更新。
6. TOP を整える
   - 管理メニュー + メトリクス枠（プレースホルダー）を置く。
7. Verify/Evidence
   - `make verify`
   - `make evidence`
   - 引継ぎ4点（spec/差分/sha/log）を揃える。

## Test Plan
- 手動
  - Create → List 反映 → Edit → List 反映 → Publish toggle 動作
  - 認可ヘッダ無しで 401 を確認
  - JSON パース失敗でエラー表示を確認

## Evidence（必須）
- `make verify`
- `make evidence`

## Claude Code SKILL で回す手順（コピペ）
### Step 1: Plan（read-only）
```
/codex spec=docs/specs/active/2026-02-12-issue-TBD-admin-console-mvp-crud-tasks.md
```

### Step 2: Codex 用プロンプト生成
```
/claude-codex-workflow spec=docs/specs/active/2026-02-12-issue-TBD-admin-console-mvp-crud-tasks.md mode=poc
```

## Codex に渡す最小プロンプト（テンプレ）
以下は Step 2 の出力を優先。困った時の最小テンプレ。

- spec: docs/specs/active/2026-02-12-issue-TBD-admin-console-mvp-crud-tasks.md
- mode: poc
- do:
  - apps/admin に Admin TOP と Tasks CRUD（List/Create/Edit + publish toggle）を実装する
  - admin API を `/api/admin/tasks` と `/api/admin/tasks/[taskId]` に揃える（GET/POST/GET/PATCH/(DELETE任意)）
  - API 入力は Zod で境界を作る（unknown を UseCase/DBへ流さない）
  - 失敗時は ApiResult で一定の形で返す
  - 最後に `make verify` と `make evidence` を実行し、引継ぎ4点を出す
- dont:
  - apps/user の挙動を変える（必要が出たら必ず理由と最小変更に限定）
  - 破壊的コマンド（rm -rf / git reset --hard / force push）
  - .env / secrets を読む・出す・コミットする
- touch（まず触って良い範囲）:
  - apps/admin/app/**
  - apps/admin/src/**
- must:
  - 変更ファイル一覧（`git diff --name-only`）
  - SHA（`git rev-parse --short HEAD`）
  - evidence ログ名（`out/evidence/*.log`）
  - spec パス（上記）
