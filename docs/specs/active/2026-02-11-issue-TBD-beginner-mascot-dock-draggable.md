<!-- docs/specs/active/2026-02-11-issue-TBD-beginner-mascot-dock-draggable.md -->

# Spec: 初心者マスコットDockをドラッグ移動可能にして被りを回避する

- Status: active
- Updated: 2026-02-11
- SSOT: このSpec（当面）

## Background
初心者モードで常時表示しているマスコットDock（想定: `apps/user/src/components/beginner/beginner-mascot-dock.tsx`）が、
画面最下部に固定されているため、プレイグラウンドの結果表示などと **重なって邪魔** になる。

一方、アカウントパネルは「どこでも移動できる」方式になっており、同様のUXに寄せたい。

## Goal
- 初心者マスコットDockを **ドラッグで移動できる** ようにする
- 位置が被って邪魔なとき、ユーザーが自分で回避できる
- 操作の誤爆（スクロール/タップ）を最小化する
- 既存機能（初心者モードの導線、音・トグル等）を壊さない

## Non-goals
- マスコットDockの見た目の大幅刷新
- 新しい演出/アニメーション追加（最小限の移動のみ）
- 永続化の高度化（同期・サーバ保存など）
- 上級者モードへの表示追加（初心者モード対象のまま）

## UX / Requirements
- Dockは画面上で自由に移動できる（ドラッグ）
- 画面外には出ない（境界クランプ）
- ドラッグ中はクリックSFXなどの誤作動を起こさない
- **「元の位置に戻す」** 手段を用意する（例: 小さなリセットボタン or 長押しでリセット）
- モバイルで操作しやすい（指で掴めるハンドル領域を用意）

## Persistence（保存）
- 位置は localStorage 等に **保存して復元** する（推奨）
  - 理由: 毎回避け直す手間をなくす
  - ただし保存が難しければ Phase 1 は「セッション中のみ保持」でも可（Phaseで段階導入）
- 保存キーは初心者Dock専用に分ける（terminalStore等に混ぜない）

## Acceptance Criteria
### A. ドラッグ移動
- 初心者モードでマスコットDockをドラッグ移動できる
- 画面外に出ない（左右上下の境界で止まる）

### B. 被り回避
- プレイグラウンド結果表示や下部UIと重なった場合に、ユーザーが移動して回避できる

### C. 誤操作対策
- タップ/クリック操作とドラッグが競合しない（閾値を設ける等）
- ドラッグ中に「意図しないボタン動作」が発火しない

### D. リセット
- 位置をデフォルトに戻す手段がある（UI or gesture）
- リセット後も正常に操作できる

### E. 既存挙動維持
- 初心者モードの他UI（音量・設定・コマンド操作など）に副作用がない

### F. 証拠
- make verify / make evidence 成功
- 引継ぎ4点（spec / 変更ファイル / SHA / evidenceログ）

## Target Files (likely)
- `apps/user/src/components/beginner/beginner-mascot-dock.tsx`
- （必要なら）Dock位置用の小さなstore/util（例: `apps/user/src/lib/beginner/*`）

## Implementation Notes（推奨アプローチ）
- 既存の「移動できるアカウントパネル」があるなら、その実装を **最優先で流用** する（同じ挙動・同じガード）
- Pointer Events（pointerdown/move/up）で実装し、モバイルを優先
- クリックとドラッグの閾値（例: 5〜8px）を設けて誤爆を減らす
- 位置は `{x, y}` を保存。初期位置は「画面下端・中央寄り」など現状と同等に

## Phased Plan
- Phase 1: ドラッグ移動 + 境界クランプ + 誤操作対策
- Phase 2: 位置保存（localStorage） + リセット
- Phase 3: 追加の微調整（ハンドル領域、アクセシビリティ）

## Verification Steps
1. 初心者モードでDockをドラッグできる
2. 端末回転/リサイズでもDockが画面外に行かない
3. Dockの各ボタン/操作がドラッグと競合しない
4. リセット動作がある
5. `make verify`
6. `make evidence`

## Codex Prompt（minimum）
spec: docs/specs/active/2026-02-11-issue-TBD-beginner-mascot-dock-draggable.md

do:
- 初心者モードのマスコットDock（beginner-mascot-dock.tsx）をドラッグ移動可能にする
- 画面外に出ないよう境界クランプ
- クリック/タップとドラッグの誤爆を防ぐ（閾値、ドラッグ中はクリック抑止）
- リセット手段を用意（ボタン or 長押し）
- 可能なら位置を localStorage に保存して復元
- make verify → make evidence

dont:
- 見た目の大幅変更、演出追加
- secrets/keys/tokens を扱わない
- 破壊的コマンド禁止 / git push しない

output:
- 変更ファイル一覧 / SHA / evidenceログ名
