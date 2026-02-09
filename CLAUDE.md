<!-- CLAUDE.md -->

# czz Project Constitution (Claude Code)

## 境界（変わりにくい）
- 依存方向: Domain -> Application -> Infra（逆流させない）
- Domain は UI/DB/Next.js に依存しない（interface で隔離）
- unknown は境界で Zod parse（UseCase / API 層で validate）
- 副作用（I/O, 時刻, 乱数, 外部アクセス）は境界に閉じる
- 秘密情報（.env, keys, tokens）は repo に入れない・読まない・ログに出さない

## 仕様の単一の真実（SDD）
- GitHub Issue は「入口」に徹する（短く、古くならない）
- 仕様の単一の真実（Single Source of Truth）は `docs/specs/` に置く
- AI（Claude/Codex）は **Issue本文ではなく spec を読む**（ズレ防止 + トークン節約）
- 実装で学びが出たら spec を更新して整合させる（Spec First）

## 品質ゲート（必ず実行）
- make verify（品質ゲート）
- make evidence（ログを out/evidence に保存）
- （CI）make ci

## 参照（詳細はここに集約）
- AGENTS.md（Codex 実働ガイド）
- .claude/rules/*（短いルール）
- .claude/skills/*（Claude Code Skills。連携手順はここに型化する）
- docs/specs/README.md（Spec運用）
- docs/runbook/*（調査・運用の型）

## コンテキスト節約（読み込みルール）
- 全体を読む前に rg/grep で絞る
- 関数名・行番号・対象ファイルを指定して読む（広く読まない）
- 500行以上のファイルは分割して読む（範囲指定）
- タスク切替時は、issue番号 / specパス / 変更ファイル / エラー を残してコンテキストをクリア

## compaction 時に保持する情報
- 現在の issue 番号と spec のパス
- 直近の変更ファイル一覧（git diff --name-only）
- エラー/ログがあればその全文（最小限）
