<!-- docs/specs/active/2026-02-15-issue-TBD-beginner-terminal-ui-ja.md -->

# Spec: 擬似ターミナルUIの表示文言を初心者モードでは日本語化する

- Issue: TBD
- Status: draft
- Updated: 2026-02-15

## Context（背景 / 現状）

擬似ターミナル（コマンドライン）UIに表示される文言が、初心者モードでも英語のまま残っている。
学習向けの体験としては、日本語のほうが迷いが減るため、初心者モードでは UI 表示文言を日本語に寄せたい。

一方で、上級者モードは “UNIXっぽさ” を残すため、既存の英語表示を維持したい（最小変更）。

## Goal（目的）

- 初心者モードの擬似ターミナルUI表示文言が日本語になる
- 上級者モードの表示（英語）は維持される
- 表示文言の切替は `uiModeStore` に従い、ハードコード散乱を防ぐ
- CommandBuilder のコマンドライン表示（中央のパイプライン行）も初心者モードで日本語になる

## Non-goals（やらないこと）

- 本格的な多言語対応基盤（i18nフレームワーク導入、言語切替UI、辞書管理の大改造）
- 実行エンジンや評価結果の仕様変更（保存される output の意味や判定ロジックを変えない）
- コマンド名そのもの（DSL/コマンド種別）を日本語へ変更（表示ラベルは対象だが、内部キーは変更しない）

## Desired Behavior（期待する挙動）

### 初心者モード
- 擬似ターミナルUIのラベル/ボタン/状態文言が日本語で表示される
  - 例: Run / Running / Output / Result / Copy / Clear / Retry / Error など
- CommandBuilder のパイプライン行に表示されるコマンド名が日本語で表示される
- CommandBuilder のパイプライン行に表示される Runner の入力/出力が日本語で表示される
- Runner の入力/出力のプルダウン選択肢も初心者モードでは日本語で表示される
- Runner の出力プルダウンは 1 種類（追記のみ）にする
- Advanced(JSON) 的な上級者向け表現があれば、初心者モードでは出さない or 日本語にする（既存方針に合わせる）
- 既存の評価ロジックや保存される実行結果（output等）に影響がない

### 上級者モード
- 既存どおり英語表示（または現状の表示）を維持する

## Approach（実装方針）

### 方針概要
- 擬似ターミナルUIで使用する表示文言を「辞書 + 関数」に集約する
- `uiModeStore`（beginner/advanced）で `ja/en` を選ぶ
- UIコンポーネント内に英語/日本語の直書きを増やさない（今後の変更容易性）
- CommandBuilder のパイプライン表示は `commandCatalog` の `beginnerLabel` を利用する

### 実装イメージ
- `apps/user/src/lib/terminal/terminalStrings.ts` を新設（または既存の util があればそこへ）
  - `terminalText`（キー → { en, ja }）を定義
  - `tTerminal(key, mode)` で文字列取得
- 擬似ターミナルの表示層（React component）で `tTerminal` を使い、直書きを置換する
- 注意: output を DB に保存している経路がある場合は、保存値に UI 見出し（Output: など）を混ぜない
  - もし `formatOutput.ts` が「保存値」にも使われているなら、UI表示専用のフォーマットへ分離する

## Touch Points（変更対象候補）

tree.txt より、擬似ターミナル関連はここが中心になりやすい:

- `apps/user/src/lib/terminal/PseudoTerminalRunner.tsx`
- `apps/user/src/lib/terminal/ResultPanel.tsx`
- `apps/user/src/lib/terminal/RunToResultButton.tsx`
- `apps/user/src/lib/terminal/useRunToResultButton.ts`
- `apps/user/src/lib/terminal/formatOutput.ts`
- `apps/user/src/lib/terminal/terminalStore.ts`
- `apps/user/src/lib/ui-mode/uiModeStore.ts`（既存：モード判定）
- `apps/user/src/lib/command-builder/CommandBuilder.tsx`

※ まずは `rg -n "Run|Running|Output|Result|Copy|Clear|Retry|Error" apps/user/src/lib/terminal` のように探索し、英語の直書き箇所を洗い出す。

## Implementation Plan（最小ステップ）

1. 文字列辞書を追加
   - `terminalStrings.ts`（仮）に `terminalText` と `tTerminal` を追加
   - 文字列キーは stable にする（例: `runButton`, `runningLabel`, `outputTitle` など）

2. UI表示層で置換
   - `PseudoTerminalRunner.tsx` / `ResultPanel.tsx` / `RunToResultButton.tsx` を優先
   - `uiModeStore` から mode を取得し、`tTerminal(key, mode)` を使用

3. 保存値への影響を遮断
   - 表示用の見出し/説明文は UI 表示でのみ付与する
   - もし formatOutput が保存値に混ざるなら、`formatOutputForDisplay(mode)` のように分離

4. テスト更新（あれば）
   - `pseudo-terminal.spec.ts` が文言に依存しているなら、`data-testid` や role を優先するよう調整
   - 初心者モード時に日本語文言が出る最低限のアサーションを追加（過剰にしない）

## Acceptance Criteria（受け入れ条件）

- 初心者モードで擬似ターミナルUIを開くと、主要な表示文言が日本語になっている
- 上級者モードでは既存の英語表示が維持される
- CommandBuilder のパイプライン表示は初心者モードでコマンド名と Runner I/O が日本語になる
- `make verify` が成功する
- `make evidence` が成功し、ログが `out/evidence/` に出る

## Test Plan（テスト計画）

- 手動（最低限）
  - 初心者モードで tasks 実行画面を開き、擬似ターミナル周辺の主要ラベルが日本語であることを確認
  - 上級者モードに切替え、同じ箇所が英語に戻ることを確認
  - 実行結果（output/resultStatus 等）が従来と矛盾しないことを確認

- 自動（可能なら）
  - E2E/コンポーネントテストで beginner/advanced の切替に応じた文言が出ることを最小限確認
  - 文言依存の brittle test は避け、`data-testid` を優先


<!-- docs/issues/2026-02-15-issue-TBD-beginner-terminal-ui-ja.md -->

# Issue: 擬似ターミナルUIの表示文言を初心者モードでは日本語化する

- Issue: TBD
- Spec: docs/specs/active/2026-02-15-issue-TBD-beginner-terminal-ui-ja.md
- Status: draft
- Updated: 2026-02-15

## Context（背景 / 現状）
- 擬似ターミナル（コマンドライン）UIの表示文言が、初心者モードでも英語のまま残っている。
- 学習体験のノイズになるため、初心者モードでは日本語表示に寄せたい。

## Goal（勝利条件）
- 初心者モードの擬似ターミナルUI表示文言が日本語になる
- 上級者モードの表示は現状維持（英語）
- `make verify` / `make evidence` が通る

## Non-goals（やらないこと）
- i18n基盤の導入（多言語切替UI、翻訳管理の大改造）
- 実行/評価ロジックや保存される output の仕様変更
- 内部キー（command type 等）を日本語化

## Scope（Do / Don’t）
### Do（このIssueでやる）
- `apps/user/src/lib/terminal/**` の英語直書きを辞書化し、初心者モードでは日本語を表示
- `uiModeStore` に従って ja/en を切替
- 表示のための文言だけを変更し、保存値へ混入させない

### Don’t（このIssueではやらない）
- 翻訳の網羅（全画面の完全日本語化）
- UI全体のリデザイン
- DSL/コマンド内部表現の変更

## Spec（Single Source of Truth）
- docs/specs/active/2026-02-15-issue-TBD-beginner-terminal-ui-ja.md

## Evidence（証拠）
- make verify
- make evidence

## DoD（Definition of Done）
- spec の Acceptance Criteria を満たす
- make verify / evidence が再現可能に成功
- 引継ぎ4点（spec/差分/sha/log）が揃う
- 機密情報が repo に含まれない


<!-- docs/prompts/2026-02-15-issue-TBD-beginner-terminal-ui-ja.md -->

# Claude Code 実行プロンプト（コピペ用）

## Step 1: Plan（read-only）

/codex spec=docs/specs/active/2026-02-15-issue-TBD-beginner-terminal-ui-ja.md

## Step 2: Codex 実装プロンプト生成

/claude-codex-workflow spec=docs/specs/active/2026-02-15-issue-TBD-beginner-terminal-ui-ja.md mode=normal

## 実装時の注意（Codex に渡すべき制約）

- 触ってよい範囲: `apps/user/src/lib/terminal/**`（必要最小限で `apps/user/src/lib/ui-mode/**` まで）
- `.env*` や secrets を読まない/出さない/コミットしない
- 破壊的コマンド禁止（rm -rf / reset --hard / force push など）
- 外部ネットワークアクセスは行わない（必要なら人間判断）
- 最後に `make verify` と `make evidence` を必ず実行し、引継ぎ4点を提示する
