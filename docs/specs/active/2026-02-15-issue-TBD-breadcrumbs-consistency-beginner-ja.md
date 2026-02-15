<!-- docs/specs/active/2026-02-15-issue-TBD-breadcrumbs-consistency-beginner-ja.md -->

# Spec: パンくずリストの整合性修正と初心者モード日本語化

- Issue: TBD
- Owner: TBD
- Status: draft
- Updated: 2026-02-15

## Why（目的）
- 画面遷移が複雑な領域（課題・結果）で、現在地を誤認しないナビゲーションを用意する。
- 初心者モードは日本語UI中心なので、パンくずも日本語にして学習体験の“迷子率”を下げる。

## 対象範囲
- `apps/user` のパンくずコンポーネントと、その表示箇所
  - 既存候補: `apps/user/src/components/nav/global-breadcrumbs.tsx`
- 対象ルート（最低限）
  - `/`
  - `/tasks`
  - `/tasks/[taskId]`
  - `/results/running`
  - `/results/[resultId]`

## 非対象（やらないこと）
- i18nフレームワーク導入、辞書の大規模化
- ルートURL構造の大改修
- パンくず以外のナビゲーションUI刷新

## NFR（非機能要件：4軸）
- 安全性: UIモード状態に依存しても hydration mismatch を起こしにくい実装にする。
- 変更容易性: ルート追加時に1箇所（定義）を足すだけで追随できる。
- 性能: パンくずは軽量であること（不要なデータ取得を避ける）。
- 運用: E2Eなど“目視に頼らない確認”を1つ入れる（可能な範囲で）。

## 仕様（表示ルール）
- パンくずは「現在のURLパス」に対して整合することを優先する。
- ラベルは UIモードで切り替える。
  - 初心者モード: 日本語
  - 上級者モード: 既存トーンを維持（英語/UNIX風のままでもよいが、整合性は取る）
- 動的セグメントは「安定ラベル」でよい（タイトル表示は将来拡張）。
  - `/tasks/[taskId]` : 初心者「課題」 / 上級者「task」
  - `/results/[resultId]` : 初心者「結果」 / 上級者「result」
- 結果系のパンくずは `トップ > 課題一覧 > 結果` を優先して表示する。
  - `/results/running` と `/results/[resultId]` が対象

## ラベル案（最小セット）
- `/` : 初心者「トップ」 / 上級者「Home」
- `/tasks` : 初心者「課題一覧」 / 上級者「Tasks」
- `/tasks/[taskId]` : 初心者「課題」 / 上級者「task」
- `/results/running` : 初心者「実行中」 / 上級者「running」
- `/results/[resultId]` : 初心者「結果」 / 上級者「result」

注:
- `/results/*` が `/tasks/*` 配下に無いので、パンくずの階層表示は「URL構造に整合」する形（例: `トップ > 結果`）になりやすい。
- ただしUX的に `トップ > 課題 > 結果` を出したい場合は、将来のルート設計変更を別Issueで扱う。

## Acceptance Criteria（受け入れ条件）
1. 対象ルートでパンくずが破綻しない（リンク先が存在し、現在地が分かる）。
2. 初心者モードでは日本語ラベルが表示される。
3. 上級者モードでは既存のトーンを維持しつつ、誤った表示（例: 無関係な階層、誤リンク）が無い。
4. モード切替で表示が追随し、hydration mismatch を起こさない。
5. `make verify` と `make evidence` が成功する。
6. （推奨）E2Eでパンくずの文字列を1ケース以上検証する。

## 実装方針
- ルート→表示定義を “中央集約” する（例: `routeMeta` のようなテーブル）。
- `global-breadcrumbs.tsx` は以下を行うだけに寄せる:
  - `usePathname()` からセグメント分割
  - テーブルからラベル解決（UIモードで分岐）
  - 表示とリンク生成（最後だけ非リンク）
- UIモード取得は既存の `ui-mode` ストア/Provider に寄せ、初期値がぶれないように注意する。

## 変更候補ファイル
- `apps/user/src/components/nav/global-breadcrumbs.tsx`
- （必要なら追加）
  - `apps/user/src/lib/nav/routeMeta.ts`（新規：ルート定義テーブル）
  - `e2e/tests/user-flow-top-to-result.spec.ts`（パンくずの簡単な期待値チェック追加）

## テスト計画
- 必須
  - `make verify`
  - `make evidence`
- 推奨
  - E2Eで、少なくとも `/tasks` と `/tasks/[taskId]` のパンくずを確認する（既存テストに追記）

## リスクと対策
- リスク: UIモードの初期値差で hydration mismatch
  - 対策: パンくずを client component に寄せ、初期状態が一致する既存Provider経由で読む。必要なら “初期描画は共通ラベル” のフェイルセーフも検討。
- リスク: ルート追加時にパンくずが更新されずズレる
  - 対策: 定義テーブルの単一箇所をSSOTにし、テストで検知する。
