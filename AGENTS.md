<!-- AGENTS.md -->

# AGENTS.md - Codex 実働ガイド（共通）

このリポジトリの「真実」は `docs/specs/` にある。作業は spec から始める。

## 仕様（SDD）ルール
- GitHub Issue は入口（短い導線）
- 仕様の単一の真実は `docs/specs/active/<spec>.md`
- Codex は **Issue本文ではなく spec を読む**
- 実装で学びが出たら spec を更新して整合させる（Spec First）

## 作業開始前（必須）
1. 対象 spec を読む: docs/specs/active/<spec>.md
2. Acceptance Criteria / Non-goals / NFR / Test Plan を確認
3. 変更対象を探す前に rg/grep で絞り込む（全体読み禁止）

## 作業ループ（基本）
1. spec の AC を満たすテスト（または検証手順）を先に用意
2. 実装
3. 必ず実行: make verify
4. 仕上げに実行: make evidence（out/evidence にログ保存）
5. 失敗したら修正、成功したら引継ぎ文を作る

## 引継ぎ（最低限書くこと）
- 対象 spec（パス）
- 変更ファイル一覧（git diff --name-only）
- git SHA
- make verify / make evidence の結果（要点）

## 絶対にやらないこと
- spec に書いていない機能を勝手に追加しない
- .env* を読む/書く/内容を貼り付けない
- secrets/ や鍵ファイルを作らない・保存しない
- git push しない（人間が確認して実行）
- 破壊的コマンドを実行しない（rm -rf, reset --hard, force push など）

## 困ったとき（止める条件）
- 仕様が曖昧 / AC が矛盾 → 作業を止めて質問する
- テストが通らない → 3回まで調査・修正。改善しないなら根拠（ログ/差分）付きで質問する
