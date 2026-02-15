# Contributing Guide

czz は **Issue → spec → evidence** の流れを重視します。SSOT は `docs/specs/` です。

## 基本フロー
1. Issue で入口を作る（短く）
2. `docs/specs/active/<spec>.md` を更新（SSOT）
3. 実装 → `make verify` → `make evidence`

## ルール（最小）
- 仕様外の変更をしない
- 機密情報を扱わない
- 破壊的コマンドは runbook に従う
- 変更は最小単位で

## 参考リンク
- アーキテクチャ: `./czz_architecture.md`
- 技術スタック: `./tech-stacks.md`
- コーディング指針: `./coding-guidelines.md`
- 運用手順: `./runbook/`
