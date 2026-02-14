<!-- docs/issues/2026-02-14-issue-TBD-runner-io-panel-always-visible.github-issue.md -->

# Runner I/O 設定パネルを常時可視にし、未設定での Run を防ぐ

## Context（背景 / 現状）
- Run 実行時に evaluate が `Runner I/O is not set` で失敗する。
- I/O を設定するプルダウンパネルが非表示になり、ユーザーが修正できない。
- 画面上は `cat input.csv` / `>> output.csv` が見えるが、実際の `runnerIO` は null のままで誤認が起きる。

## Goal（勝利条件）
- I/O 設定パネルが常時可視で、ユーザーが Input/Output を必ず設定できる。
- `runnerIO` の SSOT を統一し、表示と評価入力の不整合を消す。
- `runnerIO` 未設定では Run を実行できず、evaluate API を叩かない。

## Non-goals（やらないこと）
- DBスキーマ変更、保存仕様の大改修
- 認証まわりの追加修正

## Scope（Do / Don’t）
### Do（このIssueでやる）
- CommandBuilder に Runner I/O 設定パネルを常時表示
- 幽霊デフォルト排除（未設定は未設定として表示）
- Run 前バリデーション（未設定・in-flight の二重発火抑止）

### Don’t（このIssueではやらない）
- 失敗でも results を保存する等の方針変更

## Spec（Single Source of Truth）
- docs/specs/active/2026-02-14-issue-TBD-runner-io-panel-always-visible.md

## Evidence（証拠）
- make verify
- make evidence（out/evidence にログ保存）

## DoD（Definition of Done）
- spec の Acceptance Criteria を満たす
- verify/evidence が成功し、引継ぎ4点が揃う
