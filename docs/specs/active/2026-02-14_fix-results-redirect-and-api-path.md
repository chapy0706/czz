# Issue: results 詳細への遷移が /api/results/* に迷い込み NotFound になるのを修正

## 背景 / 現状

`POST /api/tasks/:taskId/evaluate` は `ok: true` と `resultId` を返しているが、直後に UI が `/api/results/<resultId>` へ遷移してしまい NotFound が表示される。

（パンくずも `home / api / results / result` になっている）

## 目的

- evaluate 完了後は必ず `/results/<resultId>` へ遷移
- `/results/<resultId>` で Result を表示できる
- `/api/results/*` に行ってしまう経路を排除（必要なら互換リダイレクト）

## 対応方針

詳細は Spec を参照:
- `docs/specs/active/fix-results-redirect-and-api-path.md`

## 受け入れ条件（抜粋）

- evaluate 成功時に `/results/<resultId>` へ遷移する
- `/results/<resultId>` に結果が表示される（存在しない場合は NotFound）
- lint/typecheck/test が通る
