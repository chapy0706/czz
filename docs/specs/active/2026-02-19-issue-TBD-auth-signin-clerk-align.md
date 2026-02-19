<!-- docs/specs/active/2026-02-19-issue-TBD-auth-signin-clerk-align.md -->

# Spec: Auth Sign-in/Sign-up の Clerk パネル位置ズレ修正

- Status: draft
- Updated: 2026-02-19

## Context
ログイン（サインイン）画面で、Clerk のサインインパネル（カード）が画面に対してわずかにズレて見える。

現状の `app/auth/sign-in` / `app/auth/sign-up` は Clerk の提供コンポーネントを表示しているが、
ページ側のラッパ要素（container/余白/中央寄せ）と Clerk 側の固定幅が噛み合っておらず、
特にスマホ幅や特定の画面幅で「中心から外れている」「左に寄っている」ように見える可能性がある。

対象パス候補（実物は repo で確認する）:
- `apps/user/app/auth/sign-in/[[...sign-in]]/page.tsx`
- `apps/user/app/auth/sign-up/[[...sign-up]]/page.tsx`
- （必要なら）`apps/user/app/auth/layout.tsx` を新規作成して共通レイアウト化

上記の構成は tree で確認できる。fileciteturn0file1

## Goal
- Sign-in / Sign-up 画面で Clerk パネルが「視覚的に中央」に表示され、ズレが解消される
- スマホでも横スクロールが発生しない
- 既存の認証フロー（URL/ルーティング/Clerk 設定）を壊さない

## Non-goals
- 認証方式や Clerk 設定の見直し（キー/プロバイダ/セッション等）
- 画面デザインの全面刷新（背景やコンテンツ追加）
- 既存ページ全体のレイアウト方針変更（auth 以外への影響は出さない）

## Acceptance Criteria

### AC1: Desktop で中央揃え
- 例: 幅 1024px 以上で、Clerk のカードが左右中央に配置される
- 左右余白が視覚的に均等で、コンテンツが片側に寄らない

### AC2: Mobile で崩れない
- 例: 幅 375px 前後で、横スクロールが発生しない
- 画面左右に最低 16px 程度の余白があり、カードが画面端に密着しない
- アドレスバーの伸縮を考慮し、縦方向に極端な切れが発生しない（`svh/dvh` などの利用を検討）

### AC3: Sign-up も同等
- Sign-up 画面も同じレイアウトルールで表示される（片方だけ直って片方がズレるのを避ける）

### AC4: 影響範囲を auth に閉じる
- 変更は `apps/user/app/auth/**` を中心に最小限
- 既存のトップや課題画面、結果画面の配置に影響が出ない

### AC5: 品質ゲート
- `make verify` が通る
- `make evidence` を実行し、ログが `out/evidence/` に残る

## Design / Implementation Notes

### 方針（推奨）
重複を避けるため、`apps/user/app/auth/layout.tsx` を作って auth 配下を共通の「中央寄せシェル」で包む。

中央寄せシェルの要件:
- `min-height` はモバイル向けに `100svh` または `100dvh` 系を優先（ブラウザUI伸縮対策）
- 横方向は `w-full` + `max-width`（例: `max-w-md`）で抑える
- `px-4` 相当の左右余白を常に付ける
- `flex` で `items-center` / `justify-center` を基本にしつつ、モバイルで上寄せが必要なら `py` と `items-start` を条件分岐

Clerk 側の `appearance` で root 要素に class を付けられる場合は、
ページ側のラッパで吸収できないズレを `appearance.elements` で補正してよい（ただし最小限）。

### 調査観点
- ルート `layout.tsx` や `globals.css` の container 指定が auth にも効いていないか
- `main`/`section` の `mx-auto` + `w-full` が二重になっていないか
- Clerk の root が `width: 100%` なのか固定幅なのか

## Test Plan
- ローカル起動（例: `make dev-user`）後に以下を確認
  - `/auth/sign-in` を PC / スマホ幅で確認
  - `/auth/sign-up` を PC / スマホ幅で確認
  - 横スクロール有無、左右余白、中央揃え
- 仕上げに `make verify` → `make evidence`

## Rollback Plan
- auth 配下の追加した layout / class を戻すだけで元に戻る構成にする（他ページに影響がない前提）
