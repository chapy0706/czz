# czz / apps/user 本番用 Dockerfile
# パス: infra/docker/app.Dockerfile
#
# Coolify の設定
#   Build Pack: Dockerfile
#   Dockerfile Location: /infra/docker/app.Dockerfile
#   Base Directory: /（ルート・空欄）
#   Port: 3000

FROM node:20-alpine AS base

# corepack で pnpm を有効化
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# -------------------------------------------------------
# Stage 1: 依存関係のインストール
# -------------------------------------------------------
FROM base AS deps

WORKDIR /app

# 依存関係解決に必要なファイルだけ先にコピー（キャッシュ効率化）
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# 各アプリ・パッケージの package.json もコピー
COPY apps/user/package.json ./apps/user/
COPY apps/admin/package.json ./apps/admin/
COPY packages/domain/package.json ./packages/domain/
COPY packages/dsl-core/package.json ./packages/dsl-core/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/

# 依存インストール（lock ファイルで固定）
RUN pnpm install --frozen-lockfile

# -------------------------------------------------------
# Stage 2: ビルド
# -------------------------------------------------------
FROM base AS builder

WORKDIR /app

# deps ステージから node_modules をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/user/node_modules ./apps/user/node_modules 2>/dev/null || true

# ソースコード全体をコピー
COPY . .

# apps/user をビルド
RUN pnpm --filter user-app build

# -------------------------------------------------------
# Stage 3: 本番イメージ
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
