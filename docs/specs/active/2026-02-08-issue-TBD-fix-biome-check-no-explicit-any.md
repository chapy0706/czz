<!-- docs/issues/2026-02-08-issue-TBD-fix-biome-check-no-explicit-any.md -->

# Issue: make evidence が lint（biome check）で落ちる（noExplicitAny / noImgElement）

- Issue: TBD
- Spec: docs/specs/active/TBD-biome-check-no-explicit-any.md（未作成なら TBD）
- Status: draft
- Owner: ちゃぴぃ
- Updated: 2026-02-08

---

## Context（背景 / 現状）

`make evidence` を実行すると `pnpm check`（= `biome check .`）で停止する。

- 実行コマンド（例）

```bash
make evidence EVIDENCE_DIR="out/evidence" \
  VERIFY_MODE="local" \
  VERIFY_LINT="1" \
  VERIFY_TYPECHECK="1" \
  VERIFY_TEST="1" \
  VERIFY_BUILD="0" \
  bash scripts/evidence.sh czz.evidence
```

- 失敗内容（要点）
  - `lint/suspicious/noExplicitAny`（`as any` / `: any` の使用）
  - `lint/performance/noImgElement`（`<img>` の使用）

---

## Goal（勝利条件）

- `pnpm -w check` が **errors=0** で成功する
- `make evidence` が lint で止まらず、次の `typecheck/test` まで進める（少なくとも lint を通す）

---

## Non-goals（やらないこと）

- warnings をゼロにする（まずは errors を潰してパイプラインを動かす）
- 画面仕様の作り替え（/result や /tasks の挙動改善などの大改修）

---

## Command（コマンド確認 / root package.json）

- Lint/format: `pnpm -w check` / `pnpm -w check:write`
- Typecheck: `pnpm -w typecheck`
- Unit test: `pnpm -w test:unit`（= `vitest run`）

---

## Scope（Do / Don’t）

### Do（このIssueでやる）

1) `noExplicitAny` を解消（最優先）
- `as any` を `unknown` に置き換え、型ガード（type guard）で絞り込む
- `: any` を `: unknown` または適切な型へ置き換える
- その場しのぎで `biome-ignore` を乱発しない（必要なら「なぜ必要か」をコメントで最小限に）

2) `noImgElement` を解消（危険が少ない箇所から）
- ローカル画像・静的画像は `next/image` へ移行する
- リモート画像（ドメイン許可が不明）など **ランタイム破壊のリスクがある箇所**は、
  - `next/image` 化できるならする
  - できないなら `biome-ignore` を付けて理由を明記（「domain 設定が未確定」など）

3) 変換ロジックを重複させない
- 可能なら `apps/user/src/lib/shared/unknown.ts` のような小さな共通ユーティリティ（`isRecord` など）を作り、各所で使う

### Don’t（このIssueではやらない）

- Zod を大量導入して全面スキーマ化（必要最小限に留める）
- コンポーネント設計の全面整理（別Issue）

---

## Targets（ログで指摘された主な箇所）

`noExplicitAny`（例）:

- `apps/user/app/api/tasks/[taskId]/evaluate/route.ts`
  - `const any = result as any`
  - `results.filter((r: any) => ...)`
- `apps/user/app/result/page.tsx`
  - `const json = (await res.json()) as any`
  - `function isCaseOk(c: any)`
  - `function pickCaseTitle(c: any, ...)`
  - `function pickCaseDetail(c: any)`
  - `const any = res as any`
  - `(res as any).output`, `(res as any)?.error`, `as any[]`
- `apps/user/app/results/running/ResultsRunningClient.tsx`
  - `const commands = (program as any)?.commands`
- `apps/user/app/tasks/[taskId]/page.tsx`
  - `const r = raw as any`
  - `const json = (await res.json()) as any`
  - `const raw = (params as any)?.taskId ...`
- `apps/user/app/tasks/page.tsx`
  - `const any = data as any`
- `apps/user/src/lib/command-builder/CommandEditorSheet.tsx`
  - `(obj as any)[p.key]`
  - `(parsed as any).type = typeRaw`
- `apps/user/src/lib/command-builder/CommandList.tsx`
  - `type Command = { id: string; value: any }`

`noImgElement`（例）:
- `apps/user/app/result/page.tsx`（結果のアイコン表示）
- `apps/user/src/components/auth/auth-user-badge.tsx`（アバター表示）

---

## Implementation Plan（Codex向け）

### 0) まず全体像を可視化（診断ログを取り直す）

```bash
pnpm -w check --max-diagnostics=10000
# もし pnpm script にオプションが渡せない場合:
pnpm -w exec biome check . --max-diagnostics=10000
```

「errors が 3 つだけ」なのか、「errors が多いが表示上限で見えていない」かを確定する。

### 1) noExplicitAny を潰す（unknown + type guard）

- 方針:
  - `any` は「何でも通る」ので、Biome が怒るのは正しい
  - `unknown` は「何か分からない」を表せて、そこから絞り込める（安全）
- 推奨ユーティリティ（小さく）
  - `apps/user/src/lib/shared/unknown.ts`
    - `isRecord(x): x is Record<string, unknown>`
    - `getString(r, key): string | undefined`
    - `getArray(r, key): unknown[] | undefined`

### 2) `<img>` を整理する（危険度で分ける）

- ローカル画像（public 配下等） → `next/image` へ
- リモート画像（avatar 等）
  - `next/image` へ移行するなら `next.config` の images 設定が必要か確認
  - 設定が未確定なら、まずは `biome-ignore` + 理由コメントで lint を通す（仕様決定は別Issue）

### 3) 仕上げ（再実行）

```bash
pnpm -w check
pnpm -w typecheck
pnpm -w test:unit
make evidence EVIDENCE_DIR="out/evidence" VERIFY_MODE="local" VERIFY_LINT="1" VERIFY_TYPECHECK="1" VERIFY_TEST="1" VERIFY_BUILD="0" bash scripts/evidence.sh czz.evidence
```

---

## DoD（Definition of Done）

- `pnpm -w check` が成功（errors=0）
- `make evidence` が lint で落ちない
- 変更点が「安全（unknown + 絞り込み）」になっている（`any` に逃げていない）
- 変更ファイル一覧、最終SHA、実行ログ要点が引き継げる状態になっている

---

## Handoff（Codexの最後の出力）

- `git diff --name-only`
- 最終SHA
- 実行したコマンドと結果（要点）
- `any → unknown` への置換と絞り込み方針（どこに type guard を置いたか）
