<!-- docs/issues/2026-02-14-issue-TBD-runner-io-panel-always-visible.md -->

# Issue: Runner I/O 設定パネルを常時可視にし、未設定での Run を防ぐ

- Issue: TBD
- Spec: docs/specs/active/2026-02-14-issue-TBD-runner-io-panel-always-visible.md
- Status: active
- Updated: 2026-02-14

## Context（背景 / 現状）
- Task 実行（Run）時に evaluate が `Runner I/O is not set` で失敗する。
- 以前は別パネルのプルダウンで `Input=cat input.csv` / `Output=>> output.csv` を設定できたが、現状その UI が非表示になり、ユーザーが I/O をセットできない。
- さらに、コマンドパネル側に `cat input.csv` / `>> output.csv` が “見えているだけ” の状態があり、実際の評価に使われる `runnerIO`（input/output）が null のままでも「設定済み」と誤認しやすい。
- その結果、失敗が連続し results 保存や遷移の検証も進まない（本質原因の切り分けが難しくなる）。

## Goal（勝利条件）
- Runner I/O を設定する必須パネルが常時可視で、ユーザーが必ず修正できる。
- `runnerIO` の状態と UI 表示が一致し、幽霊デフォルト（見えるだけで未設定）が消える。
- `runnerIO` 未設定のときは Run を実行できず、evaluate API を叩かない。

## Non-goals（やらないこと）
- DB スキーマ変更、保存仕様の大改修
- コマンドカタログ全体の再設計（今回は I/O パネルの復旧と整合性が主）
- Clerk/認証まわりの追加修正

## Scope（Do / Don’t）
### Do（このIssueでやる）
- CommandBuilder 画面上に Runner I/O 設定パネルを常時表示する（モードに関わらず）。
- `runnerIO` の SSOT（単一の真実）を store/state に寄せ、表示も評価入力もそれを参照する。
- `runnerIO` 未設定なら Run を disabled にし、理由と修正方法を表示する（LPIC学習者向けに stdin/stdout の簡潔な説明も付与）。
- 既存の “見えているだけの cat/>> 表示” があるなら撤去 or `runnerIO` と同期させる。

### Don’t（このIssueではやらない）
- “失敗でも results を保存する” などの保存方針変更（別Issueで扱う）
- 画面全体のレイアウト刷新（必要最小限のUI追加・整形に留める）

## Spec（Single Source of Truth）
- docs/specs/active/2026-02-14-issue-TBD-runner-io-panel-always-visible.md

## Evidence（証拠）
- make verify
- make evidence（out/evidence にログ保存）

## DoD（Definition of Done）
- spec の Acceptance Criteria を満たす
- make verify / make evidence が再現可能に成功
- 引継ぎ4点（spec/差分/sha/log）が揃う
- 機密情報が repo に含まれない
