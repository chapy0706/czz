# czz / apps/user 用 Dockerfile
# リポジトリルートに "Dockerfile" として配置する
#
# Coolify の設定
#   Build Pack: Dockerfile
#   Base Directory: /（ルート・空欄）
#   Port: 3000

# -------------------------------------------------------
# Stage 1: 依存関係のインストール
# -------------------------------------------------------
FROM node:20-alpine AS deps

RUN npm install -g pnpm

WORKDIR /app

# ワークスペース設定をコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# 各パッケージの package.json だけ先にコピー（キャッシュ効率化）
COPY apps/user/package.json ./apps/user/
COPY packages/domain/package.json ./packages/domain/
COPY packages/dsl-core/package.json ./packages/dsl-core/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/

# 依存関係をインストール
RUN pnpm install --frozen-lockfile

# -------------------------------------------------------
# Stage 2: ビルド
# -------------------------------------------------------
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# deps ステージから node_modules をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/user/node_modules ./apps/user/node_modules

# ソースコード全体をコピー
COPY . .

# apps/user をビルド
RUN pnpm --filter user-app build

# -------------------------------------------------------
# Stage 3: 本番イメージ
# -------------------------------------------------------
FROM node:20-alpine AS runner

RUN npm install -g pnpm

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
