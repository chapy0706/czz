<!-- .claude/README.md -->

# .claude

Claude Code の設定・ルール・フック。

## 目的
- 事故（機密参照・破壊的コマンド）を減らす
- ルールを短く保ち、トークンを節約する

## 構成
- settings.json: permissions と hooks
- rules/: 常時参照する短いルール
- hooks/: PreToolUse で強制するガード
