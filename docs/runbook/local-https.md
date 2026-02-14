<!-- docs/runbook/local-https.md -->

# Local HTTPS (Clerk)

## Why
- ローカル開発は `https://localhost:3100` を使う。
- `http://localhost:3100` だと Clerk の Cookie が `Secure` のため `signed-out` になりやすい。

## Certificates
- 証明書は `apps/user/certificates/` にある。

## Usage
1. `https://localhost:3100` で開く
2. 認証が `signed-out` のままなら、URL が `https` になっているか確認する
