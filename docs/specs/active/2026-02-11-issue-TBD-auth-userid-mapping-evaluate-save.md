<!-- docs/specs/active/2026-02-11-issue-TBD-auth-userid-mapping-evaluate-save.md -->

# Spec: Clerk authUserId と DB users.id（UUID）をサーバ境界で紐付け、evaluate で確実に保存する

- Status: active
- Updated: 2026-02-11
- SSOT: このSpec

## Background
Clerk でログインしても、`/api/tasks/[taskId]/evaluate` が `400` になったり、`resultId` が生成されず results 画面に進めないことがある。

根本原因は、Clerk の `userId`（例: `user_...`）が UUID ではないのに、evaluate の入力が `userId: uuid` 前提になっていること。
また、Clerk のアカウント作成と DB の `users` テーブルの作成が自動同期されておらず、同一人物の識別子が「認証世界」と「アプリ世界」で分断されている。

このSpecは「authUserId → users.id(UUID)」の変換点を **サーバ境界に固定**し、保存・遷移の土台を作る。

## Related
- 既存の Run 遷移（複数ケース results へ）:  
  `docs/specs/active/2026-02-11-issue-TBD-run-button-should-navigate-to-results-multicase.md`  
  このSpecは、その前提（evaluate が必ず resultId を返せる）を満たすための土台。

## Goal
- ログイン時、evaluate は Clerk の `authUserId` をサーバで取得し、DB の `users.id(UUID)` を解決して **確実に results を保存**できる
- その結果、ログイン時は evaluate が **必ず `resultId` を返す**（正常系で `resultId` が欠落しない）
- クライアントが DB の `userId(UUID)` を知ったり、申告する必要をなくす（なりすまし余地を減らす）

## Non-goals
- DB スキーマ変更（migrations 追加、カラム追加、index追加）
- Clerk Webhook（user.created 等）での同期（今回は lazy create で十分）
- results の所有者チェック（閲覧制御の厳密化は後続Spec）
- UIデザイン刷新、導線大改修（このSpecは保存土台のみ）

## Definitions
- authUserId: Clerk の `userId`（文字列、UUIDではない）
- appUserId: DB `users.id`（UUID、アプリ内部の主キー）
- lazy create: 必要になったタイミングで `users` を find-or-create する方式

## Acceptance Criteria
### A. サーバ境界での同一性解決
- evaluate の Route Handler で `authUserId` を取得し、DB `users` を `authUserId` で find-or-create できる
- 取得した `appUserId(UUID)` を保存処理に使う（クライアント申告の userId を信用しない）

### B. evaluate が 400 を起こさない（ログイン時）
- ログイン状態で evaluate を呼ぶと、`authUserId` が UUID ではないことを理由に `400` にならない

### C. resultId の生成と保存（ログイン時）
- ログイン状態で evaluate を呼ぶと、DB に `results` が保存され、レスポンスに `resultId` が含まれる
- `results.userId` は `users.id`（UUID）と整合する

### D. ゲスト挙動は壊さない（既存維持）
- 未ログイン時は「従来のゲスト挙動」を維持する
  - 例: request に uuid の `userId`（ゲストID）が既に存在するならそれを使う
  - ログイン時は request の `userId` を無視し、サーバ解決を優先する

### E. 回帰防止と証拠
- `make verify` が成功する
- `make evidence` が成功し、`out/evidence/*.log` が生成される
- 引継ぎ4点（spec / 変更ファイル / SHA / evidenceログ名）が揃う

## Investigation Hints（当たり）
- evaluate Route Handler: `apps/user/app/api/tasks/[taskId]/evaluate/route.ts`
- evaluate 契約（Zod）: `apps/user/src/lib/terminal/evaluateContract.ts`
- UseCase: `apps/user/src/usecases/evaluateTask.ts`
- Domain repo interface: `packages/domain/src/repositories/userRepository.ts`
- Drizzle repo: `infra/drizzle/repositories/userRepository.ts`
- Drizzle schema: `infra/drizzle/schema.ts`（users に `authUserId` があるか確認）
- 既存ゲストID: `apps/user/src/lib/terminal/guestUserId.ts`

## Implementation Plan（最小ステップ）
1. schema確認
   - `users` テーブルに `authUserId` があることを確認（なければこのSpecはブロック扱いにし、人間に報告）
2. Domain: UserRepository に `findByAuthUserId(authUserId: string)` と `createFromAuthUserId(authUserId: string)`（または `findOrCreateByAuthUserId`）を追加
3. Infra(Drizzle): `infra/drizzle/repositories/userRepository.ts` に上記を実装
   - 可能なら find → insert → 再find の手順で安定化（競合はベストエフォート）
4. evaluate Route Handler を修正
   - `auth().userId`（= authUserId）を取得
   - authUserId がある場合:
     - `findOrCreateByAuthUserId` で `appUserId(UUID)` を解決
     - UseCase へ渡す userId は必ず `appUserId(UUID)` を使う
   - authUserId がない場合:
     - request の `userId(uuid)` を使う（既存ゲスト挙動維持）
5. evaluateContract（Zod）を調整
   - `userId` を「必須」から「任意」にして、ログイン時はサーバ側で補う前提にする
   - 既存の `input/commands` 等は変えない
6. 最後に `make verify` / `make evidence`

## Security / NFR（4軸）
- 安全性:
  - クライアント申告の userId をログイン時に信用しない（なりすまし低減）
  - authUserId はサーバから取得（改ざん不可）
- 変更容易性:
  - 認証プロバイダが変わっても「authUserId → appUserId」解決点を差し替えれば済む
- 性能:
  - find-or-create は 1〜2 クエリ増えるが、評価処理に比べれば小さい
- 運用:
  - evidence ログに「authUserId 有無」「保存成功」「resultId」を要点として残せると調査が速い（ただし個人情報は出さない）

## Test Plan
- ログイン状態で課題を Run（evaluate 実行）
  - 400 にならない
  - resultId が返る
  - results が DB に保存される
- 未ログイン状態で Run（既存挙動）
  - 既存テストが落ちない（ゲストが壊れていない）
- `make verify`
- `make evidence`

## Codex Prompt（minimum）
spec: docs/specs/active/2026-02-11-issue-TBD-auth-userid-mapping-evaluate-save.md

mode: normal

do:
- evaluate Route Handler で Clerk authUserId をサーバ取得し、DB users を authUserId で find-or-create して appUserId(UUID) を解決する
- ログイン時は request の userId を無視し、解決した appUserId を使って results を保存し、必ず resultId を返す
- 未ログイン時は既存ゲスト挙動を維持する（request の uuid userId を使う）
- make verify → make evidence を実行し、引継ぎ4点を出す

dont:
- DBスキーマ変更 / Webhook同期 / 大規模UI改修
- 破壊的コマンド禁止（reset --hard / rm -rf 等）
- git push 禁止
- secrets/keys/tokens を読まない・出さない・コミットしない

touch (likely):
- apps/user/app/api/tasks/[taskId]/evaluate/route.ts
- apps/user/src/lib/terminal/evaluateContract.ts
- packages/domain/src/repositories/userRepository.ts
- infra/drizzle/repositories/userRepository.ts
- （必要なら）apps/user/src/usecases/evaluateTask.ts

output:
- spec パス
- git diff --name-only
- sha（git rev-parse --short HEAD）
- evidence（out/evidence/<latest>.log）
