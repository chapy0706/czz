<!-- docs/handoff/2026-02-08-issue-TBD-typecheck-biome-triage.md -->

# Issue: typecheck が通らない（apps/user: results page / theme-provider）

- Issue: TBD
- Spec: TBD
- Status: blocked
- Owner: ちゃぴぃ
- Updated: 2026-02-08

---

## Context（背景 / 現状）

`pnpm -w exec biome check . --write --unsafe --max-diagnostics=10000` は **52 warnings**（主に `any` / `<img>` / `non-null assertion`）を出しているが、致命的ではなく進行は可能。

一方で `pnpm -w typecheck` が落ちており、現在は **9 errors / 2 files** まで絞れている。

- 直近の typecheck 結果（抜粋）
  - `apps/user/app/results/[resultId]/page.tsx`
    - `@/components/ui/separator` が見つからない（TS2307）
    - `ApiResponse<EvaluateOkShape>` に `error` プロパティが無い（TS2339 ×4）
    - `Button asChild` が型に無い（TS2322 ×2）
  - `apps/user/src/components/providers/theme-provider.tsx`
    - `next-themes/dist/types` が見つからない（TS2307）
    - `NextThemesProvider` への props 型が噛み合わない（TS2559）

補足:
- 1つ前のログでは `@clerk/nextjs` / `drizzle-orm` / `@neondatabase/auth/*` など「依存モジュールが見つからない」系が大量に出ていたが、今回のログでは消えている（何らかの install/修正が入った可能性あり）。

---

## Goal（勝利条件）

- `pnpm -w typecheck` が成功する
- （任意）Biome の warning を「今すぐ直すもの」と「後で直すもの」に仕分けできている

---

## Non-goals（やらないこと）

- Biome warning（`any` 全撲滅、`<img>` を全て `next/image` に移行、など）をこのタイミングで全部片付けない
- 認証（Clerk/Neon）・DB（Drizzle）まわりの大改修

---

## Scope（Do / Don’t）

### Do（このIssueでやる）

- `Separator` の import 不整合を解消（ファイル追加 or import 変更）
- `ApiResponse` を正しく絞り込んで `error` を読む（型ガード）
- `Button asChild` を扱えるようにするか、使わない書き方へ寄せる
- `ThemeProvider` の型定義を **壊れにくい書き方**に変更（`ComponentProps` を使う）

### Don’t（このIssueではやらない）

- warning をゼロにする
- UI全体のコンポーネント設計の再設計

---

## Evidence（証拠）

実行コマンド:

```bash
pnpm -w exec biome check . --write --unsafe --max-diagnostics=10000
pnpm -w typecheck
```

typecheck のエラー（要点）:

```txt
apps/user/app/results/[resultId]/page.tsx
- Cannot find module '@/components/ui/separator'
- Property 'error' does not exist on type 'ApiResponse<EvaluateOkShape>'
- Property 'asChild' does not exist on type 'Button...'

apps/user/src/components/providers/theme-provider.tsx
- Cannot find module 'next-themes/dist/types'
- props 型が NextThemesProvider と噛み合わない
```

---

## Fix Plan（最短で通す手順案）

### 1) Separator が無い問題

選択肢 A（shadcn/ui の `separator` を追加する）:

- `apps/user/src/components/ui/separator.tsx` を作る
- 既存の import `@/components/ui/separator` をそのまま通す

選択肢 B（既存のコンポーネントに合わせて import を変える）:

- すでに `apps/user/src/components/ui/*` に同等コンポーネントがあるなら、それに合わせて import を修正

※ 現状のエラーからは「ファイルが無い」が濃厚なので、A が最短。

---

### 2) ApiResponse の `error` を読む（型ガード）

`ApiResponse<T>` が例えば下記のような union を想定しているケース:

- ok: ` { ok: true; value: T }`
- err: `{ ok: false; error: { kind: string; message: string } }`

この場合、`res.error` は「常にある」わけではないので、まず `ok` で分岐する。

例（方針）:

```ts
if (res.ok !== true) {
  const kind = typeof res.error?.kind === "string" ? res.error.kind : "UNKNOWN";
  const message = typeof res.error?.message === "string" ? res.error.message : "Unknown error";
  // error 表示へ
  return ...
}
// ここから先は ok 側として扱える
const value = res.value;
```

ポイント:
- `in` 演算子や `res.ok` の boolean で **絞り込みを作る**のがコツ
- どうしても `ok` が無い設計なら、`"error" in res` のような判定を使う

---

### 3) Button の `asChild` 問題

原因候補は2つ:

- いま使っている `Button` 実装が `asChild` をサポートしていない（shadcn/ui の Slot 版ではない）
- `Button` の型定義が古く、`asChild` が定義されていない

最短の回避（設計を崩さず、型だけ通す）:

- `asChild` をやめて、`Link` に `button` 相当の class を当てる
  - `buttonVariants()` を用意しているならそれを使う
  - 無い場合は、`Button` の className を参考に `Link` 側へ移す

本命（今後の一貫性が良い）:

- `Button` を shadcn/ui の Slot 対応版に揃えて `asChild` を正式サポート

---

### 4) ThemeProvider の型問題（next-themes）

`next-themes/dist/types` が無いので、型 import を **壊れにくい形**にする。

推奨:

- `ThemeProviderProps` を direct import しない
- `React.ComponentProps<typeof NextThemesProvider>` を使う

例（方針）:

```ts
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type Props = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: Props) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

---

## DoD（Definition of Done）

- `pnpm -w typecheck` が成功
- `apps/user` の `dev/build` が最低限通る（任意）
- 直した理由が引継ぎに残っている（このファイルに追記でOK）
- secrets / 機密情報が repo に混入していない

---

## Decision Log（任意）

- 2026-02-08: ThemeProviderProps は `dist/types` 参照をやめ、`ComponentProps` で追従する方針（next-themes の内部パス変更に強い）

---

## Next（任意）

1. `Separator` を追加（or import 修正）
2. `ApiResponse` の絞り込み修正（`res.ok` or `"error" in res`）
3. `Button asChild` を解消（`Link` + class へ寄せる or Button 実装を Slot 対応へ）
4. `ThemeProvider` を `ComponentProps` 方式へ変更
5. `pnpm -w typecheck` 再実行 → 追加で出たエラーを同様に潰す
