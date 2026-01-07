// docs/dev-memo-port-3100-eaddrinuse.md

# 開発メモ: Next.js dev 起動で `EADDRINUSE :::3100` が出るときの対処（macOS）

`Error: listen EADDRINUSE: address already in use :::3100` は、**3100 番ポートを別プロセスが掴んでいる**状態。
多くの場合、前回の `next dev`（node）が残っている。

---

## 最短手順（推奨）

### 1) 3100 を掴んでいるプロセスを特定する

```bash
lsof -nP -iTCP:3100 -sTCP:LISTEN
```

出力例のイメージ:

- `node` / `next` が出る → 前回の dev サーバが残っている
- `com.docker.*` が出る → Docker がポート公開している可能性

### 2) PID を停止する（まずは穏やかに）

```bash
kill -TERM <PID>
```

### 3) まだ空かない場合（最後の手段）

```bash
kill -KILL <PID>
```

---

## ワンライナー（毎回ラクしたい）

### 3100 を LISTEN している PID をまとめて停止（TERM）

```bash
lsof -tiTCP:3100 -sTCP:LISTEN | xargs -n 1 kill -TERM
```

### まだ残る場合（KILL）

```bash
lsof -tiTCP:3100 -sTCP:LISTEN | xargs -n 1 kill -KILL
```

---

## Docker が原因か確認する

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

`0.0.0.0:3100->...` のように見えたら、そのコンテナが 3100 を掴んでいる。

停止例:

```bash
docker stop <CONTAINER_NAME>
```

---

## どうして再発する？

- dev サーバをターミナル終了で雑に閉じた（`Ctrl+C` で終了できていない）
- E2E（Playwright 等）が起動したサーバが残った
- 例外発生時にプロセスが落ちずゾンビ化した

---

## 予防の小さな習慣

- dev サーバは `Ctrl+C` で終了する
- 起動前に一度だけ確認する
  ```bash
  lsof -nP -iTCP:3100 -sTCP:LISTEN
  ```

---

## それでも急ぐときの逃げ道（ポートを変える）

3100 にこだわらず一時的に別ポートで起動する。

```bash
pnpm --filter user-app exec next dev --port 3101
```

ただし、プロジェクト内で 3100 を前提にしているリンクや設定がある場合は注意する。
