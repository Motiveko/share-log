# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Development
pnpm dev                    # Start all apps in dev mode (API, web, worker)
pnpm build                  # Build all packages and apps
pnpm lint                   # Run ESLint across all packages
pnpm typecheck              # Run TypeScript type checking
pnpm test                   # Run all tests
pnpm format                 # Format code with Prettier

# Running specific app
pnpm --filter api dev       # Run only API
pnpm --filter web dev       # Run only web
pnpm --filter notification-worker dev

# Running single test
pnpm --filter api test -- --testPathPattern="filename"
pnpm --filter web test -- --testPathPattern="filename"

# Local infrastructure (PostgreSQL, Redis, MinIO, etc.)
docker compose -f infra/docker-compose-local.yml up -d
```

## Architecture Overview

**Monorepo Structure (Turbo + pnpm)**

```
/apps
  /api                  # Express.js backend (TypeORM, tsyringe DI, Passport.js)
  /web                  # React 19 + Vite frontend (React Router v7, Zustand, TanStack Query)
  /notification-worker  # BullMQ background job processor

/packages
  /entities            # TypeORM database entities (shared)
  /interfaces          # TypeScript interfaces/types (shared)
  /ui                  # React UI component library (Radix UI based)
  /hooks               # Shared React hooks
  /logger              # Winston logger wrapper
  /notification        # Notification service utilities
  /utils               # Common utility functions
  /constants           # Shared constants
  /eslint-config       # Shared ESLint configuration
  /typescript-config   # Shared TypeScript configurations
  /jest-presets        # Jest configuration presets
```

## Key Patterns

**API (`/apps/api`):**
- Entry: `src/index.ts` → `src/app.ts`
- Feature-based modules in `/features` (controllers, services, repositories)
- Dependency injection via tsyringe (`@injectable()`, `@inject()`)
- Route binding: Controllers extend base controller, routes auto-registered
- Auth flow: Passport.js Google OAuth → express-session → Redis store
- Middleware chain: request context → logging → body parsing → helmet → CORS → session → passport → routes

**Web (`/apps/web`):**
- Entry: `src/main.tsx`
- SSR server in `/server` (Express + vite-node)
- Feature-based pages in `/features` and `/pages`
- API client with axios + TanStack Query
- State: Zustand with slice pattern for scaling
- Style: tailwindCSS

**Web Component Guidelines:**

컴포넌트 위치 결정 기준:
```
/apps/web/src
  /components/ui/     # 범용 UI 컴포넌트 (Button, Input, Modal, Card 등)
                      # - 비즈니스 로직 없음, props로만 동작
                      # - shadcn/ui 스타일 (cva + tailwind)
                      # - 다른 feature에서 2회 이상 사용되는 경우

  /features/{feature}/
    /components/      # 해당 feature 전용 컴포넌트
                      # - 특정 도메인 로직 포함 가능
                      # - 해당 feature 내에서만 사용
    index.tsx         # feature entry (container/page)

  /layouts/           # 페이지 레이아웃 (Header, Footer, Sidebar 등)
  /pages/             # 라우트 페이지 컴포넌트
```

컴포넌트 분리 원칙:
1. **단일 책임**: 하나의 컴포넌트는 하나의 역할만 담당
2. **재사용 기준**: 같은 UI가 2곳 이상에서 필요하면 `/components/ui/`로 추출
3. **비즈니스 로직 분리**: UI 컴포넌트는 표현만, 로직은 hooks나 container에서 처리
4. **Props 설계**:
   - variant, size 등 스타일 변형은 cva 사용
   - className은 항상 외부에서 주입 가능하게 (cn 유틸 활용)
   - asChild 패턴으로 컴포넌트 합성 지원

네이밍 컨벤션:
- 파일명: kebab-case (`user-profile-card.tsx`)
- 컴포넌트명: PascalCase (`UserProfileCard`)
- Feature 컴포넌트: `{Feature}{Role}` (예: `LogListItem`, `AdjustmentForm`)

**Worker (`/apps/notification-worker`):**
- BullMQ worker consuming jobs from Redis queue
- Shares TypeORM entities with API

## Infrastructure Services (Local)

Docker compose (`infra/docker-compose-local.yml`) provides:
- PostgreSQL 15 (port 5432)
- Redis (port 6379)
- MinIO S3-compatible storage (ports 9000/9001)
- Bull Board job queue UI (port 3009)
- Grafana + Loki for logs (port 3101)

## Testing

- Backend: Jest + Supertest (`@repo/jest-presets/node`)
- Frontend: Jest (`@repo/jest-presets/browser`)
- Test database used for integration tests (setup/teardown patterns in API tests)
