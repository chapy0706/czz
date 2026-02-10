# WezTerm ハンドオフ運用（Claude ⇄ Codex）

## pane_id の取得

```sh
wezterm cli list
```

`pane_id` を控える。

## 環境変数のセット例

```sh
export WEZ_PANE_CODEX=123
export WEZ_PANE_CLAUDE=456
```

## Claude → Codex

1. `.ai/handoff/to_codex.txt` を作成・更新する
2. `scripts/wez/send-handoff.sh --to codex --file .ai/handoff/to_codex.txt` を実行
3. プレビューとサイズを確認し、`y` を入力すると送信される

## Codex → Claude

1. `.ai/handoff/to_claude.txt` を作成・更新する
2. `scripts/wez/send-handoff.sh --to claude --file .ai/handoff/to_claude.txt` を実行
3. プレビューとサイズを確認し、`y` を入力すると送信される

## 事故防止

- 危険語検知（`rm -rf`, `reset --hard`, `force push`, `push --force`, `secrets`, `.env`）がある場合は送信しない
- `y` 承認のときのみ送信
- サイズ上限 100KB 超は送信しない
