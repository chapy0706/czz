<!-- .claude/rules/02-security.md -->

# Security Rules（短い）

- .env / keys / tokens / secrets を読まない、ログに出さない、コミットしない
- 破壊的コマンドは禁止（rm -rf / reset --hard / force push）
- 外部ネットワークアクセスは原則しない（必要なら人間確認）
- 迷ったら安全側（deny）に倒す
