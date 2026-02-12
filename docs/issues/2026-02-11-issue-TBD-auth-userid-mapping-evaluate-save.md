<!-- docs/issues/2026-02-11-issue-TBD-auth-userid-mapping-evaluate-save.md -->

# Issue: Clerk authUserId と DB users.id（UUID）を紐付け、evaluate 保存を安定化する

- Issue: TBD
- Spec: docs/specs/active/2026-02-11-issue-TBD-auth-userid-mapping-evaluate-save.md
- Status: active
- Updated: 2026-02-11

## Context（背景 / 現状）
- Clerk でログインしても evaluate が 400 になったり、resultId が生成されず results 画面に進めない。
- Clerk の userId は UUID ではないが、現状の evaluate 入力が `userId: uuid` 前提のため、同一性が崩れている。

## Goal（勝利条件）
- ログイン時はサーバ側で authUserId → appUserId(UUID) を解決して results を保存できる
- evaluate が 400 にならず resultId を返す

## Non-goals（やらないこと）
- DB スキーマ変更
- Clerk Webhook同期
- 結果の所有者チェック（閲覧制御）

## Scope（Do / Don’t）
### Do（このIssueでやる）
- evaluate Route Handler で Clerk authUserId を取得し、DB users を find-or-create して appUserId を解決する
- ログイン時はクライアント申告の userId を無視して保存する
- make verify / make evidence を通し、引継ぎ4点を揃える

### Don’t（このIssueではやらない）
- 破壊的コマンド、git push
- 仕様の大拡張（UI刷新、Webhook運用など）

## Spec（Single Source of Truth）
- docs/specs/active/2026-02-11-issue-TBD-auth-userid-mapping-evaluate-save.md

## Evidence（証拠）
- make verify
- make evidence（out/evidence にログ保存）

## DoD（Definition of Done）
- spec の Acceptance Criteria を満たす
- verify/evidence が再現可能に成功
- 引継ぎ4点（spec/差分/sha/log）が揃う
- 機密情報が repo に含まれない
