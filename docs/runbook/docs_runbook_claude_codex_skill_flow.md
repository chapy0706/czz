<!-- docs/runbook/claude-codex-skill-flow.md -->

# Runbook: Spec → /codex → /claude-codex-workflow → Codex（実装）運用フロー

このドキュメントは、このプロジェクト内で **Claude Code と Codex を安全に協奏させる共通手順**を固定するためのもの。
「毎回説明しなくても、同じ品質で動く」状態を目指す。

---

## このフローで達成したいこと

- **仕様の単一の真実（SSOT）** を `docs/specs/active/*.md` に置き、手戻り（ズレ）を減らす
- 実装担当（Codex）が推測しないように、**入力（spec）を揃える**
- 最後に `make verify` と `make evidence` を必ず回し、**証拠ログ**を残す
- 「Plan → Approve → Implement → Verify」を型として固定する

---

## 前提（守るルール）

- 真実は `docs/specs/active/<spec>.md`（Issue本文は入口。古くなる前提）
- `.env / keys / tokens / secrets` は **読まない・出さない・コミットしない**
- 破壊的コマンド禁止（`rm -rf` / `git reset --hard` / force push など）
- 外部ネットワークアクセスは原則しない（必要なら人間判断）
- 読む前に絞る（rg/grep、範囲指定。全体読みをしない）

参照:
- `CLAUDE.md`
- `AGENTS.md`
- `.claude/skills/*`（/codex, /claude-codex-workflow）
- `docs/runbook/*`

---

## ディレクトリ配置（このプロジェクトに置けば回る）

- Spec（真実）: `docs/specs/active/<YYYY-MM-DD-issue-...>.md`
- Issue（入口）: `docs/issues/<YYYY-MM-DD-issue-...>.md`
- Skills（コマンド化）:
  - `.claude/skills/codex/SKILL.md`
  - `.claude/skills/claude-codex-workflow/SKILL.md`

この配置にしておけば、プロジェクト内で共通の流れとして運用できる。

---

## 運用フロー（最短の一本道）

### Step 0: Spec を書く（最重要）
最初に spec を用意する。最低限これがあれば回る。

- Goal / Non-goals
- Acceptance Criteria（受け入れ条件）
- 調査の当たり（候補ファイル）
- Implementation Plan（最小ステップ）
- Test Plan（`make verify` / `make evidence`）

Spec は「読む人が推測しなくて済む」量にする。長文より、曖昧さを減らすのが勝ち。

---

### Step 1: /codex（Plan: read-only）
Claude Code に、spec を渡して **計画だけ**を出させる。

入力（例）:
- `/codex spec=docs/specs/active/<spec>.md`

期待する出力:
1. Specの要約（Goal / Non-goals / AC）
2. 変更対象の当たり（候補ファイル・責務）
3. リスク（安全/変更容易性/性能/運用）
4. 実行計画（最小ステップ、verify/evidence まで）
5. Codex に渡す最小プロンプト（テンプレ）

ここでは「実装しない」。設計を固めて、推測を潰すフェーズ。

---

### Step 2: Approve（人間）
/codex の結果が spec と一致しているかを人間が確認する。

チェック観点:
- spec の AC に紐づいているか
- touch 範囲が狭いか（PoCなら特に）
- 禁止事項に触れていないか（secrets/破壊的コマンド/外部アクセス）

承認できたら次へ。

---

### Step 3: /claude-codex-workflow（Codexプロンプト生成）
Claude Code に「Codex へ渡すプロンプト」を **コピペ可能な形**で作らせる。

入力（例）:
- `/claude-codex-workflow spec=docs/specs/active/<spec>.md mode=poc`

出力（最低限含める）:
- spec: <PATH>
- mode: <poc|normal>
- do: 3〜10行
- dont: 禁止事項
- touch: 触って良い領域（重要）
- must: verify/evidence、引継ぎ4点
- output: 変更ファイル一覧 / SHA / evidenceログ名

---

### Step 4: Codex（Implement）
Codex CLI に Step 3 のプロンプトを投入して実装する。

重要:
- Codex に「勝手に広げる余地」を与えないため、**touch を狭く**する
- `git push` はしない（人間が最終確認後に行う）

---

### Step 5: Verify（品質ゲート）
実装後、必ず repo ルートで実行する。

- `make verify`
- `make evidence`

そして、引継ぎ4点を揃える:
- spec パス
- `git diff --name-only`
- SHA（`git rev-parse --short HEAD`）
- evidenceログ名（`out/evidence/*.log`）

---

## 引継ぎ4点（コピペ用テンプレ）

```
spec: docs/specs/active/<spec>.md
files:
- <git diff --name-only の結果>
sha: <git rev-parse --short HEAD>
evidence: out/evidence/<latest>.log
```

---

## よくある落とし穴（先に潰す）

- 「半分以下」「きれいに」など曖昧表現だけで spec を書く  
  → どこをどうするか（DOMに出さない、幅/余白/文字など）を具体化する

- “CSSで隠す” だけで非表示扱いにする  
  → 非表示要件がある場合は **DOM非生成** を明記する

- touch が広すぎて、無関係な変更が混ざる  
  → `apps/user/**` 全域ではなく、まずは `apps/user/app/page.tsx` など狙う

- verify/evidence を最後に回さない  
  → これを忘れると「成功の証拠」が消える。儀式として固定する

---

## いつこのフローを使うか

- 仕様が曖昧でズレやすいUI改修
- 影響範囲が読みにくいリファクタリング
- 新規機能（ただし spec を厚くし、touch 範囲を明確化する）

逆に、単純な1行修正ならこのフローを省略してもよい。ただし **verify/evidence は省略しない**。

---

## 更新ポリシー

- このrunbookは「運用の失敗から学んだこと」を追記して育てる
- spec の書き方がブレたら、まずこのrunbookに戻して整える
