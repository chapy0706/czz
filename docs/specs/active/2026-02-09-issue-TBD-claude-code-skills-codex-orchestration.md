<!-- docs/specs/active/2026-02-09-issue-TBD-claude-code-skills-codex-orchestration.md -->

# Spec: Claude Code Skills で Codex 連携をワークフロー化する（#70拡張）

- Issue: TBD（関連: docs/issues/2026-02-09-issue-TBD-claude-code-skills-codex-orchestration.md / Issue #70）
- Updated: 2026-02-09
- Owner: TBD
- Mode: PoC → 安定化

## Goal
- Claude Code Skills を repo に導入し、Claude→Codex協奏を “手順” ではなく “コマンド” として再現できるようにする。
- SDD（spec が真実）と安全ガード、verify/evidence の証拠運用を崩さずに、連携を型化する。

## Non-goals
- MCP 等の別方式への全面移行
- アプリ機能の新規追加（Skills導入検証に無関係な変更）
- 自動承認（人間のApproveを省略する設計）

## Background
- 現在の運用は Issue を入口にし、spec と verify/evidence を中心に据えている。
- ただし Claude Code と Codex の連携はコピペ/手動手順に寄り、再現性が下がりやすい。
- Skills を使って「Plan → Approve → Implement → Verify」を固定し、作業の乱れとズレを減らしたい。

## Acceptance Criteria
### A. Skills の導入（repo）
- `.claude/skills/codex/SKILL.md` が存在し、/codex が「実装なし（read-only）」のガイドとして成立している。
- `.claude/skills/claude-codex-workflow/SKILL.md` が存在し、/claude-codex-workflow が「Plan→Approve→Implement→Verify」の手順を明示している。

### B. SSOT と安全ガードの固定
- Skills 内で「spec を読む」「Issue本文を読まない」が明記されている。
- `.env / keys / tokens / secrets` を扱わない、破壊的コマンド禁止、外部ネットワーク原則禁止が明記されている。

### C. PoC（1往復の成功）
- PoC の範囲が “最小” である（docs/.claude 周りの追加に閉じる）。
- `make verify` が成功する。
- `make evidence` が成功し、`out/evidence/*.log` が生成される。
- 引継ぎ4点が揃う（specパス / git diff --name-only / SHA / evidenceログ名）。

## NFR（4軸）
- 安全性: secrets を扱わない。破壊的コマンド禁止。外部アクセスは原則しない。
- 変更容易性: Skills と spec/issue は疎結合（SSOT は spec、Issue は入口）。
- 性能: 実行時負荷は増やさない（PoC は docs/.claude の追加のみ）。
- 運用: verify/evidence により、成功/失敗がログで追跡できる。

## Test Plan（証拠の取り方）
- `make verify`
- `make evidence`（out/evidence にログ生成）
- `git diff --name-only` で変更ファイル一覧を取得

## Implementation Plan（PoC）
1. Skills を追加
   - `.claude/skills/codex/SKILL.md`
   - `.claude/skills/claude-codex-workflow/SKILL.md`

2. Issue を入口として整える（薄く）
   - docs/issues/2026-02-09-issue-TBD-claude-code-skills-codex-orchestration.md

3. verify/evidence を回す
   - make verify
   - make evidence

4. 引継ぎ4点を残す
   - spec / files / sha / evidence log

## Notes
- #70 の土台（CLAUDE.md / AGENTS.md / .claude/rules / verify/evidence）は保持する。
- PoC 完了後、必要があれば CLAUDE.md に「.claude/skills の位置づけ」を追記する。
