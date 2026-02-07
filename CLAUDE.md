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

# Database migration
pnpm --filter api typeorm migration:generate -- -n MigrationName
pnpm --filter api typeorm migration:run

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
                       #   기존: User, AuthProvider, PushSubscription
                       #   CBT: UserProfile, UserSettings, MoodEntry, ThoughtDiary, Journal,
                       #        ChatSession, ChatMessage, DailyMission, UserMissionAssignment,
                       #        CopingTool, CopingToolUsage, EducationalContent, UserContentProgress,
                       #        Badge, UserBadge, UserStreak, LlmUsage
  /interfaces          # TypeScript interfaces/types (shared)
                       #   CBT: Mood DTOs, ThoughtDiary DTOs, Chat DTOs, Journal DTOs,
                       #        Mission DTOs, Analytics DTOs, LLM types (LlmProvider, LlmMessage, etc.)
  /ui                  # React UI component library (Radix UI based)
  /hooks               # Shared React hooks
  /logger              # Winston logger wrapper
  /notification        # Notification service utilities
  /utils               # Common utility functions
  /constants           # Shared constants
                       #   CBT: EMOTION_TAGS, COGNITIVE_DISTORTIONS, MISSION_CATEGORIES,
                       #        COPING_TOOL_CATEGORIES
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
- LLM 통합: `src/lib/llm/` - Provider 추상화 (Strategy 패턴), Gemini 기본
- SSE 스트리밍: Chat 메시지, Journal AI 분석 엔드포인트에서 `text/event-stream` 사용
- 데이터 암호화: `src/lib/encryption.ts` - AES-256-GCM (채팅 내용, 사고 일지, 일기)
- Feature 모듈: user, storage, push, test (기존) + onboarding, chat, mood, thought-diary, journal, mission, coping-tool, education, analytics, settings (CBT)

**Web (`/apps/web`):**
- Entry: `src/main.tsx`
- SSR server in `/server` (Express + vite-node)
- Feature-based pages in `/features` and `/pages`
- API client with axios + TanStack Query
- State: Zustand with slice pattern for scaling
- 네비게이션: 하단 5탭 (홈, 기록, 상담, 도구, 분석)
- 차트: Recharts (감정 트렌드, 통계 시각화)
- 애니메이션: framer-motion (온보딩, 호흡 운동, 축하 효과, 페이지 전환)
- 마크다운: react-markdown (교육 콘텐츠 렌더링)

**Worker (`/apps/notification-worker`):**
- BullMQ worker consuming jobs from Redis queue
- Shares TypeORM entities with API
- 스케줄링 잡: mood-reminder, journal-reminder, mission-reminder, daily-mission-assign (00:05 KST), streak-calculate (00:10 KST), badge-check (이벤트), llm-usage-aggregate (01:00 KST), incomplete-diary-notify (24시간 후)

## LLM Integration

- **Provider:** Google Gemini (기본), 추상화 인터페이스(`LlmProvider`)로 다른 프로바이더 전환 가능
- **위치:** `/apps/api/src/lib/llm/`
- **시스템 프롬프트:** `/apps/api/src/lib/llm/prompts/` - CBT 상담사 역할, 한국어, 소크라테스식 문답
- **컨텍스트:** 슬라이딩 윈도우 (최근 20개 메시지)
- **Rate Limiting:** Redis 기반, 분당 10 / 시간당 60 / 일당 200 요청
- **Safety:** 위기 키워드 감지(`crisis-detector.ts`) → 전문 상담 연락처 자동 안내

## PWA

- `manifest.json` - standalone, portrait, 한국어 앱명
- 서비스 워커 캐싱: App Shell (Cache First), API (Stale While Revalidate)
- 오프라인 폴백 페이지
- 설치 프롬프트 배너 (`beforeinstallprompt`)
- 푸시 알림 카테고리: 감정 기록, 일기, 미션, 스트릭, 배지, 미완성 일지

## Security

- 민감 데이터 AES-256-GCM 암호화 (채팅 내용, 사고 일지, 일기)
- 사용자별 데이터 스코핑 (모든 쿼리에 userId 필수)
- LLM API 키 서버 사이드 관리 (클라이언트 미노출)
- 프롬프트 인젝션 방지 (시스템/사용자 프롬프트 분리, 입력 길이 제한)
- LLM Rate Limiting (Redis 슬라이딩 윈도우)

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
