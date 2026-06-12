# czz / apps/user 本番用 Dockerfile
# パス: infra/docker/app.Dockerfile
#
# Coolify の設定
#   Build Pack: Dockerfile
#   Dockerfile Location: /infra/docker/app.Dockerfile
#   Base Directory: /（ルート・空欄）
#   Port: 3000

FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# -------------------------------------------------------
# Stage 1: 依存関係のインストール＋ビルド
# -------------------------------------------------------
FROM base AS builder

WORKDIR /app

# ソースコード全体をコピー
COPY . .

# 依存インストール（ワークスペース全体を解決するため全部コピー後に実行）
RUN pnpm install --frozen-lockfile

# apps/user をビルド
RUN pnpm --filter user-app build

# -------------------------------------------------------
# Stage 2: 本番イメージ
# -------------------------------------------------------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# ビルド成果物をコピー
COPY --from=builder /app/apps/user/.next ./apps/user/.next
COPY --from=builder /app/apps/user/public ./apps/user/public
COPY --from=builder /app/apps/user/package.json ./apps/user/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

EXPOSE 3000

CMD ["pnpm", "--filter", "user-app", "start"]
