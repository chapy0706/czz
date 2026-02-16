<!-- docs/specs/active/2026-02-16-issue-TBD-guest-user-task-correct-navigation.md -->

# Spec: ゲストユーザーでも課題の正答時に意図する遷移が行われるようにする

- Status: draft
- Updated: 2026-02-16
- Related: docs/issues/2026-02-16-issue-TBD-guest-user-task-correct-navigation.md

## Context（背景 / 現状）

- 課題画面で「正答（想定通りのコマンド/入力）」を選んでも、ゲストユーザーだと意図する画面遷移にならない。
- ログインユーザーでは同じ操作で正しく遷移できる。
- リポジトリにはゲスト用の実装の痕跡がある（例: `apps/user/src/lib/terminal/guestUserId.ts` など）。 fileciteturn0file1

## Goal（勝利条件）

- ゲストユーザーでも、ログインユーザーと同じ導線で「評価 → 結果表示」まで到達できる。
- 失敗時も同様に「結果表示」へ到達でき、ユーザーが次の行動を選べる（再挑戦・戻る等）。
- 例外や 401/403/500 による「沈黙」や「無反応」が起きない（ユーザーに分かる形の失敗になる）。

## Non-goals（やらないこと）

- ゲスト結果をログイン後に自動で紐付け直す（データ移行）機能は今回やらない。
- 認証方式（Clerk 等）の変更、ユーザー/権限モデルの再設計はやらない。
- DBスキーマの大幅変更（既存の users/results の大改造）はやらない。

## Hypothesis（起きがちな原因の当たり）

実装を見る前提の「当たり」なので、証拠で確定させること。

- (H1) クライアント側の evaluate 実行で userId の扱いが分岐していて、ゲスト時に `userId` が欠落/不整合になり result 生成が失敗している。
- (H2) `results/running` → `results/[resultId]` の遷移が、ログイン前提（/me 取得や guard）になっていてゲストが弾かれている。
- (H3) guestUserId がセッション毎に変わる/保存されない/SSRで参照される等により、評価→取得の整合が壊れている。
- (H4) `/api/results/:id` が未ログイン時に 401 を返し、ゲスト結果の取得が弾かれている。

## Acceptance Criteria（受け入れ条件）

### AC1: ゲストでも正答・不正答の両方で結果画面へ到達
- ゲスト状態で課題を実行し、正答の入力をしたら結果画面へ遷移する。
- ゲスト状態で課題を実行し、不正答の入力をしたら結果画面へ遷移する。
- 遷移先URL/画面遷移の体験はログインユーザーと同一（同じルート・同じ待機UIを通る）。

### AC2: サーバーが「ゲスト」を許容する
- 課題評価 API が未ログインでも成立する（少なくともゲスト userId を渡した場合に成立する）。
- サーバーは「認証情報がない＝即401」ではなく、ゲストとして扱える経路を持つ。
- 結果取得 API がゲスト userId を受け取り、401 を返さず結果を取得できる。

### AC3: 失敗は“可観測”で“安全”
- 失敗時、UIは無反応にならず、ユーザーが理解できるエラー表示になる。
- ログに secrets やトークン等の機密が出ない（値は出さず、len/hash などで確認する）。

### AC4: 回帰（ログインユーザー）を壊さない
- ログインユーザーの従来フロー（評価→結果表示）が変わらず動く。

## Design Notes（設計の方針）

### 方針1: 「評価要求の契約」を固定する（OCP寄り）
- 成功/失敗の外形（ok/data/error）を固定し、UIは `ok` で絞り込む。 fileciteturn0file2
- 追加のエラー要因が増えても UI が壊れないよう `error.code` 中心で扱う。

### 方針2: guestUserId はクライアント境界で生成・永続化する
- `guestUserId` は LocalStorage 等で永続化し、評価・結果取得で同じIDを使い続ける。
- SSR/Server Component では guestUserId を参照しない（参照するなら必ず client-only に寄せる）。

### 方針3: サーバーは userId を「信頼しない」
- `userId` は unknown として受け取り、Zod で validate する。
- “guest user” の作成/取得は UseCase/Repo 経由で行い、Route Handler の責務を薄くする（境界の清潔さ）。

## Implementation Plan（最小ステップ）

1) 再現条件を固定
- ゲストで課題画面 → 正答入力 → どこで止まるか（画面/ログ/Network）を記録
- 可能なら E2E 追加（後述）で固定

2) フローの起点を特定（候補）
- `apps/user/src/lib/terminal/useRunToResultButton.ts`
- `apps/user/src/lib/terminal/RunToResultButton.tsx`
- `apps/user/src/lib/terminal/evaluateClient.ts`
- `apps/user/app/api/tasks/[taskId]/evaluate/route.ts`
- `apps/user/app/results/running/*`
- `apps/user/app/results/[resultId]/page.tsx`
- `apps/user/app/api/me/route.ts`
- `apps/user/src/lib/terminal/guestUserId.ts`
（実ファイルは tree を根拠に列挙） fileciteturn0file1

3) 失敗点に応じて修正
- API で 401/403 なら「ゲスト許容」分岐を追加（Authorization 前提を外す or guest専用パスを用意）
- API で 400/500 なら「request schema」「null/undefined」「userId不整合」を修正
- UI で遷移しないなら「レスポンス処理」「resultIdの受け渡し」「ルータ遷移」を修正
- /api/results/:id が 401 の場合は、guestUserId を query で渡す経路を用意する

4) 回帰確認
- ログインユーザーで同様に評価→結果
- `make verify` / `make evidence`

## Test Plan（証拠）

### 手動
- ゲスト: 正答 → 結果、誤答 → 結果
- ログイン: 正答 → 結果、誤答 → 結果

### E2E（推奨・最小）
- `e2e/tests/user-flow-top-to-result.spec.ts` を参考に、ゲストとして task→run→result の1ケースを追加
  - 「ログインせず」もしくは「ゲストモード」相当の状態で実行
（既存のE2E復旧済み前提の流れに合わせる） fileciteturn0file1

### コマンド（必須）
- `make verify`
- `make evidence`

## Risks（4軸）

- 安全性: userId をクライアントから渡す設計は偽装可能。ゲストは“権限が弱い”前提で、サーバー側で「guestは自分のresultのみ参照」「編集不可」などの制限を維持する。
- 変更容易性: auth周りへ影響しやすい。分岐点を Route Handler に寄せず、UseCase/Adapter に寄せて差分を局所化する。
- 性能: 追加の /me 呼び出しや guest user upsert の回数を増やしすぎない（可能ならキャッシュ）。
- 運用: 失敗時のログ/トレースが残るよう requestId と error.code を付与し、トークン等は出さない。

---

## Codex 実装依頼プロンプト（コピペ用）

- spec: `docs/specs/active/2026-02-16-issue-TBD-guest-user-task-correct-navigation.md`
- do:
  - ゲストでも評価→結果遷移が成立するように修正
  - 失敗時のUI表示を無反応にしない
  - ログインユーザーの回帰を防ぐ
  - 必ず `make verify` と `make evidence`
- dont:
  - `.env* / keys / tokens / secrets` を読まない・貼らない・コミットしない
  - 破壊的コマンド禁止（rm -rf / git reset --hard / force push 等）
  - ネットワーク外部アクセスはしない
- touch（目安）:
  - `apps/user/src/lib/terminal/**`
  - `apps/user/app/api/tasks/[taskId]/evaluate/route.ts`
  - `apps/user/app/results/**`
  - `apps/user/app/api/me/route.ts`（必要なら）
  - `e2e/tests/**`（最小1本）
- output:
  - `git diff --name-only`
  - `git rev-parse --short HEAD`
  - evidence log: `out/evidence/<...>.log`
