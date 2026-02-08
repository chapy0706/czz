<!-- .claude/rules/01-architecture.md -->

# Architecture Rules（短い）

- 依存方向は Domain -> Application -> Infra
- boundary で unknown を Zod parse（型の嘘を通さない）
- UI（Next.js/RSC/Client）は domain に侵入しない
- 変更は小さく、影響範囲を言語化する（安全/変更容易性/性能/運用）
