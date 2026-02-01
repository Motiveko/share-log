# syntax=docker/dockerfile:1
FROM node:18-alpine AS base

# pnpm 설치
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

WORKDIR /app

# 전체 소스 복사 (turborepo workspace 구조 유지)
COPY . .

# 의존성 설치
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 빌드 (turbo가 의존성 패키지들도 함께 빌드)
RUN pnpm run build --filter=notification-worker

# ============================================
# Production stage - 최소화된 이미지
# ============================================
FROM node:18-alpine AS runner

WORKDIR /app

# 빌드 결과물만 복사 (tsup이 모든 의존성을 번들링하므로 node_modules 불필요)
COPY --from=base /app/apps/notification-worker/dist ./dist
COPY --from=base /app/apps/notification-worker/.env.production ./.env.production

# 로그 디렉토리 생성
RUN mkdir -p /app/logs

# 보안을 위해 non-root 유저 사용
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser && \
    chown -R appuser:nodejs /app/logs
USER appuser

# 환경변수 설정 (dotenv가 .env.production을 로드하도록)
ENV PHASE=production

EXPOSE 5052

CMD ["node", "dist/index.js"]
