FROM node:20-alpine

# pnpm を使うため corepack を有効化
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# 依存関係解決に必要なファイルだけ先にコピー
COPY package.json pnpm-workspace.yaml ./

# 各アプリ・パッケージの package.json もコピー
COPY apps/user/package.json apps/user/
COPY apps/admin/package.json apps/admin/
COPY packages/dsl-core/package.json packages/dsl-core/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/

# 依存インストール
RUN pnpm install

# 残りのソースコードをコピー
COPY . .

# デフォルトでは何も起動しない（docker-compose 側で command 指定）
CMD ["pnpm", "dev:user"]
