<!-- docs/issues/2026-02-09-issue-TBD-top-audio-panel-shrink-top-only.md -->

# Issue: TOPの音量ON/OFFパネルを縮小し、TOP限定で表示する

- Issue: TBD
- Spec: docs/specs/active/2026-02-09-issue-TBD-top-audio-panel-shrink-top-only.md
- Status: draft
- Owner: TBD
- Updated: 2026-02-09

## 背景 / 現状
- TOP画面に表示されている「BGM/SFX 音量 ON/OFF パネル」が大きく、画面を占有してUXが崩れている。
- 現状、TOP以外のページでも同パネルが表示されている（または表示され得る）ため、TOP専用の要素として閉じたい。

## 目的（Why）
- TOPでの初期導線を邪魔しないサイズに抑える。
- 表示責務をTOPに限定し、意図しないページでの表示を防ぐ（疎結合・変更容易性の確保）。

## スコープ（Do）
- パネルの視覚サイズを現状の半分以下にする（幅/高さ/余白/文字サイズを含む）。
- 表示条件をTOP画面限定にする（TOP以外ではDOMに出さない）。

## スコープ（Don’t）
- 音量ON/OFFの仕様変更（状態保持、音の鳴り方、保存先などの変更）
- TOP以外のUI改修
- 無関係なリファクタリング、デザイン刷新

## 受け入れ条件（Definition of Done）
- TOP画面でパネルが表示され、縮小されている（「半分以下」と判断できる）。
- TOP以外（tasks一覧、task詳細、results、credits、account/settings 等）ではパネルが表示されない（DOMに出ない）。
- ON/OFF の動作が既存から変わらない（状態・音の挙動）。
- `make verify` が成功する。
- `make evidence` が成功し、`out/evidence/*.log` が生成される。
- 引継ぎ4点（specパス / 変更ファイル一覧 / SHA / evidenceログ名）が揃う。

## 実装メモ（当たり）
- TOP: `apps/user/app/page.tsx`（または `apps/user/src/components/top/*`）
- もしレイアウトに入っているなら: `apps/user/app/layout.tsx` / `apps/user/src/components/providers/*`
- 音量状態: `apps/user/src/lib/audio/audioSettingsStore.ts` など

## 検証
- `make verify`
- `make evidence`
- `git diff --name-only`
