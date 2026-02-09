<!-- docs/specs/active/2026-02-09-issue-TBD-top-audio-panel-shrink-top-only.md -->

# Spec: TOPの音量ON/OFFパネルを縮小し、TOP限定で表示する

- Issue: TBD（関連: Issue #65 の「TOP音量パネルUX」系）
- Updated: 2026-02-09
- Owner: TBD
- Status: active（PoCタスクとして最初に回す）

## Goal
- TOP画面の「BGM/SFX 音量 ON/OFF パネル」を **現状の半分以下**の視覚サイズに縮小する。
- パネルの表示を **TOP画面限定** にし、TOP以外のページでは **DOMに出さない**。

## Non-goals
- 音量ON/OFFの仕様変更（保存方式、状態名、初期値、音源、鳴動タイミングなど）
- TOP以外のページのUI改修
- 無関係なデザイン統一・大規模リファクタリング

## Background
- TOPは最初に触れる導線であり、視覚ノイズを最小化したい。
- 「TOP専用UI」が他ページに漏れると、責務が曖昧になり改修コストが上がる。
- 最初のSkills運用タスクとして、UI変更を小さく・検証を確実に通す題材に向いている。

## Acceptance Criteria
### A. サイズ
- TOP画面で対象パネルが表示され、視覚サイズが現状の半分以下である（幅/高さ/余白/文字サイズ含む）。

### B. 表示範囲
- TOP以外のページで対象パネルが表示されない（CSSで隠すのではなく、DOMに出さない）。

### C. 振る舞い維持
- ON/OFF動作（状態の反映・保存・音の挙動）が既存から変わらない。

### D. 証拠
- `make verify` が成功する。
- `make evidence` が成功し、`out/evidence/*.log` が生成される。
- 引継ぎ4点（specパス / 変更ファイル一覧 / SHA / evidenceログ名）が揃う。

## NFR（4軸）
- 安全性: 秘密情報に触れない。破壊的コマンド禁止。
- 変更容易性: TOP専用UIの責務をTOPに閉じ、他ページへの漏れを防ぐ。
- 性能: DOM削減（TOP以外で描画しない）により悪化しない。
- 運用: verify/evidence で変更が常に追跡できる。

## 調査の当たり（候補）
- TOPの構成: `apps/user/app/page.tsx` / `apps/user/src/components/top/*`
- もしレイアウト常駐なら: `apps/user/app/layout.tsx` / `apps/user/src/components/providers/*`
- 音量状態: `apps/user/src/lib/audio/audioSettingsStore.ts` など

## Implementation Plan（最小）
1. 既存の音量パネルの配置箇所を特定（TOP直下に移す or TOP限定レンダリングにする）
2. パネルのスタイルを縮小（幅/パディング/フォント/間隔を調整）
3. TOP以外でDOMに出ないことを確認
4. `make verify` / `make evidence` 実行
5. 引継ぎ4点を残す

## Test Plan
- 画面確認: TOPで表示され縮小、TOP以外で非表示（DOM非生成）
- `make verify`
- `make evidence`
- `git diff --name-only`
