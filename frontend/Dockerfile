# ---- base stage ----
# node 版本与 mise.toml / CI workflows 保持一致；Node 25+ 已移除 corepack，
# 升级到更高版本时需把下面的 corepack 换成 npm i -g pnpm@10.10.0
FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

# ---- build stage ----
FROM base AS builder

ENV NODE_ENV=production
ENV NEXT_PUBLIC_LINUX_DO_CREDIT_BACKEND_URL=https://build-placeholder.invalid
ENV LINUX_DO_CREDIT_SESSION_COOKIE_NAME=__LINUX_DO_CREDIT_SESSION_COOKIE_NAME__
ENV LINUX_DO_CREDIT_RATE_LIMIT_ENABLED=__LINUX_DO_CREDIT_RATE_LIMIT_ENABLED__
ENV LINUX_DO_CREDIT_BACKEND_URL=https://build-placeholder-2.invalid

ARG VERSION=""
ARG BUILD_DATE=""

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN if [ -n "$VERSION" ] || [ -n "$BUILD_DATE" ]; then \
  VERSION="$VERSION" BUILD_DATE="$BUILD_DATE" node -e "const fs = require('fs'); const pkg = require('./package.json'); const version = process.env.VERSION; const buildDate = process.env.BUILD_DATE; if (version) pkg.version = version; if (buildDate) pkg.buildDate = buildDate; fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\\n')"; \
fi

RUN pnpm build

RUN grep -rl \
    -e "https://build-placeholder.invalid" \
    -e "https://build-placeholder-2.invalid" \
    -e "__LINUX_DO_CREDIT_SESSION_COOKIE_NAME__" \
    -e "__LINUX_DO_CREDIT_RATE_LIMIT_ENABLED__" \
    /app/.next > /app/.replace.files

# ---- runner stage ----
FROM base AS runner

WORKDIR /app

COPY --from=builder /app .

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["pnpm", "start"]
