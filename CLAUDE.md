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
    - User, AuthProvider, PushSubscription
    - Workspace, WorkspaceMember, Invitation
    - Log, LogCategory, LogMethod
    - Adjustment
    - NotificationSetting
  /interfaces          # TypeScript interfaces/types (shared)
    - user, workspace, invitation, log, adjustment, notification-setting, error
  /ui                  # React UI component library (Radix UI based)
  /hooks               # Shared React hooks
  /logger              # Winston logger wrapper
  /notification        # Notification service utilities (Slack, Discord)
  /utils               # Common utility functions
  /constants           # Shared constants
  /eslint-config       # Shared ESLint configuration
  /typescript-config   # Shared TypeScript configurations
  /jest-presets        # Jest configuration presets
```

## Key Patterns

**API (`/apps/api`):**
- Entry: `src/index.ts` → `src/app.ts`
- Dependency injection via tsyringe (`@injectable()`, `@inject()`)
- Auth flow: Passport.js Google OAuth → express-session → Redis store
- Middleware chain: request context → logging → body parsing → helmet → CORS → session → passport → routes

```
/apps/api/src
  /features              # Feature-based modules (controller → service → repository)
    /user                # 사용자 인증/프로필 (auth-controller, user-controller, service, repository)
    /workspace           # 워크스페이스 CRUD, 멤버 관리, 마지막 방문
    /invitation          # 초대 생성/수락/거절
    /log                 # 지출/수입 기록, 카테고리/수단 관리, 통계
    /adjustment          # 정산 생성/조회/계산
    /notification-setting # 알림 설정
    /storage             # MinIO 파일 업로드
    /push                # 웹 푸시 구독 관리
  /errors                # 커스텀 에러 클래스 (AppError, BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError)
  /middlewares           # auth, cors, error, logger, not-found, passport, request-context, session, validation
  /decorators            # controller, request-validator
  /lib                   # datasource, redis, jwt, logger, request-context, action-queue
  /config                # 환경 변수 설정
```

**Web (`/apps/web`):**
- Entry: `src/main.tsx`
- SSR server in `/server` (Express + vite-node)
- API client with axios + TanStack Query
- State: Zustand with slice pattern for scaling
- Style: tailwindCSS

```
/apps/web/src
  /api                   # API 클라이언트
    /base                # 도메인별 API 함수 (user, workspace, invitation, log, category, method, stats, adjustment, notification-setting)
    http-client.ts       # Axios 인스턴스
    index.ts             # API 객체 통합 export

  /features              # Feature-based 모듈
    /auth                # 인증 상태 관리 (store.ts, google-login-button)
    /workspace           # 워크스페이스 (store, workspace-card, workspace-form)
    /workspace-settings  # 설정 페이지 섹션 (member-management, category-method, notification-setting)
    /invitation          # 초대 (store, invitation-list, invite-user-dialog)
    /log                 # 지출/수입 (store, log-filter, log-form-dialog, log-list-item, log-summary)
    /category            # 카테고리 (store, category-manage-dialog)
    /method              # 결제수단 (store, method-manage-dialog)
    /stats               # 통계 차트 (store, daily-chart, method-chart, category-chart, user-stats-table)
    /adjustment          # 정산 (store, adjustment-form, adjustment-list-item, adjustment-result-view)
    /notification-setting # 알림 설정 (store)
    /toast               # 토스트 알림 (toast-service, toast)
    /modal               # 모달 서비스 (modal-service, modal-provider) - alert, confirm, destructive
    /theme               # 테마 (store)

  /components/ui         # 범용 UI 컴포넌트 (shadcn/ui 스타일)
    button, input, label, card, dialog, alert-dialog, select, tabs, table,
    date-picker, date-range-picker-modal, tooltip, switch, checkbox,
    form-field, spinner, loading, empty-state, error-state

  /pages                 # 라우트 페이지
    login, welcome, profile, not-found,
    workspace-empty, workspace-new, workspace-dashboard, workspace-settings,
    adjustment-list, adjustment-new, adjustment-detail

  /layouts               # 레이아웃 컴포넌트
    base, workspace-layout, header, footer, lnb

  /routes                # 라우팅 가드
    protected-route, workspace-route
    # 참고: 로그인 페이지(/pages/login.tsx)는 이미 로그인된 사용자를 홈으로 리다이렉트

  /lib                   # 유틸리티 (utils, http, error, logger)
```

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

**Web Data Fetching Guidelines:**

API 호출 및 로딩/에러 상태 관리는 TanStack Query(react-query)를 사용한다.

역할 분리:
- **TanStack Query**: 서버 상태 관리 (API 데이터 조회, 캐싱, 로딩/에러 상태)
- **Zustand Store**: 클라이언트 상태 관리 (UI 상태, 필터, 모달 열림 등)

기본 패턴:
```typescript
// 데이터 조회: useQuery
const { data, isLoading, isError, error, refetch } = useQuery({
  queryKey: ['logs', workspaceId, filter],
  queryFn: () => API.log.list(workspaceId, filter),
});

// 데이터 변경: useMutation
const createMutation = useMutation({
  mutationFn: (dto: CreateLogDto) => API.log.create(workspaceId, dto),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['logs', workspaceId] });
  },
});
```

로딩/에러 상태 렌더링:
```typescript
if (isLoading) return <Loading />;
if (isError) return <ErrorState error={error} onRetry={refetch} />;
if (!data || data.length === 0) return <EmptyState />;
return <DataList data={data} />;
```

Query Key 컨벤션:
- 도메인 단위로 시작: `['logs', ...]`, `['workspaces', ...]`
- 계층적 구조: `['logs', workspaceId]`, `['logs', workspaceId, logId]`
- 필터/파라미터 포함: `['logs', workspaceId, { page, limit, ...filter }]`

주의사항:
- Zustand store에서 API 호출 및 로딩/에러 상태를 직접 관리하지 않는다
- `isLoading`, `isError` 등 react-query가 제공하는 상태를 활용한다
- 관련 쿼리 무효화는 `queryClient.invalidateQueries()`를 사용한다

**Worker (`/apps/notification-worker`):**
- BullMQ worker consuming jobs from Redis queue
- Shares TypeORM entities with API

## Error Handling Pattern

**API 에러 응답 구조:**
```typescript
// apps/api/src/errors/base-error.ts
// AppError를 상속받은 커스텀 에러: BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError
// 에러 응답: { code: "ERROR_CODE", message: "..." }
```

**에러 코드 정의:**
- `packages/interfaces/src/error.ts`: 공용 에러 코드 상수 정의
- `apps/web/src/lib/error.ts`: 에러 코드별 사용자 친화적 메시지 매핑

**프론트엔드 에러 처리:**
- `apps/web/src/components/ui/error-state.tsx`: 에러 상태 UI 컴포넌트
- `apps/web/src/components/ui/loading.tsx`: 로딩 상태 UI 컴포넌트
- `apps/web/src/components/ui/empty-state.tsx`: 빈 상태 UI 컴포넌트

## Modal Service (Alert/Confirm)

브라우저 native `confirm()`/`alert()` 대신 커스텀 모달을 사용한다.

**기본 사용법:**
```typescript
import { modalService } from "@web/features/modal";

// 확인 모달 (확인/취소 버튼)
const confirmed = await modalService.confirm("정말 진행하시겠습니까?");
if (!confirmed) return;

// 알림 모달 (확인 버튼만)
await modalService.alert("처리가 완료되었습니다.");

// 위험 동작 확인 모달 (삭제 등 - 빨간 버튼)
const confirmed = await modalService.destructive("정말 삭제하시겠습니까?");
if (!confirmed) return;
```

**옵션:**
```typescript
interface ModalOptions {
  title?: string;      // 모달 제목 (선택)
  message: string;     // 모달 본문 (필수)
  confirmText?: string; // 확인 버튼 텍스트 (기본: "확인", destructive는 "삭제")
  cancelText?: string;  // 취소 버튼 텍스트 (기본: "취소")
}

// 옵션 사용 예시
await modalService.confirm("정산을 완료하시겠습니까?", {
  title: "정산 완료",
  confirmText: "완료",
});

await modalService.destructive("정말 추방하시겠습니까?", {
  confirmText: "추방",
});
```

**모달 타입:**
- `confirm`: 일반 확인 모달 (기본 버튼)
- `alert`: 알림 모달 (확인 버튼만)
- `destructive`: 위험 동작 확인 모달 (빨간 버튼)

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
