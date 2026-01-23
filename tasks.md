# Share-Log 개발 작업 목록

## 작업 상태 범례

- [ ] 미완료
- [x] 완료
- [~] 진행 중

---

## Phase 1: 인프라 및 기초 설정

> 의존성: 없음 (최초 단계)

### 1.1 프로젝트 설정

- [x] Monorepo 구조 확인 및 패키지 설정 검토
- [x] ESLint, Prettier, TypeScript 설정 확인
- [ ] Docker Compose 로컬 환경 테스트

### 1.2 데이터베이스 설계

- [x] Entity 설계 및 구현 (`packages/entities`)
  - [x] User Entity (nickname, slackWebhookUrl, isProfileComplete 추가)
  - [x] Workspace Entity
  - [x] WorkspaceMember Entity (참여자, 권한 관리)
  - [x] Invitation Entity
  - [x] Log Entity
  - [x] LogCategory Entity
  - [x] LogMethod Entity
  - [x] Adjustment Entity (정산 결과 포함)
  - [x] NotificationSetting Entity
- [ ] TypeORM Migration 설정
- [ ] 초기 마이그레이션 파일 생성

---

## Phase 2: 인증 시스템

> 의존성: Phase 1.2 (User Entity)

### 2.1 Google OAuth 인증

- [x] Passport.js Google Strategy 설정
- [x] 세션 관리 (express-session + Redis)
- [x] 인증 미들웨어 구현

### 2.2 인증 API

- [x] GET /auth/google - Google OAuth 로그인 시작
- [x] GET /auth/google/callback - OAuth 콜백 처리
- [x] POST /auth/logout - 로그아웃
- [x] GET /user (auth/me) - 현재 사용자 정보

### 2.3 프론트엔드 인증

- [x] 로그인 페이지 (/login) UI
- [x] Google 로그인 버튼 연동
- [x] 인증 상태 관리 (Zustand)
- [x] Protected Route 구현

---

## Phase 3: 사용자 관리

> 의존성: Phase 2 (인증)

### 3.1 사용자 API

- [x] GET /users/search - 닉네임/이메일 검색
- [x] PATCH /users/me - 프로필 수정
- [x] DELETE /users/me - 회원 탈퇴

### 3.2 프론트엔드 페이지

- [x] 웰컴 페이지 (/welcome) - 닉네임 설정 폼
- [x] 프로필 페이지 (/profile) - 프로필 수정 폼

---

## Phase 4: 워크스페이스 핵심 기능

> 의존성: Phase 3 (사용자)

### 4.1 워크스페이스 API

- [x] POST /workspaces - 생성
- [x] GET /workspaces - 내 워크스페이스 목록
- [x] GET /workspaces/:id - 상세 조회
- [x] PATCH /workspaces/:id - 수정
- [x] DELETE /workspaces/:id - 삭제 (Master만)

### 4.2 멤버 관리 API

- [x] GET /workspaces/:id/members - 멤버 목록
- [x] PATCH /workspaces/:id/members/:userId - 권한 변경 (Master만)
- [x] DELETE /workspaces/:id/members/:userId - 추방 (Master만)

### 4.3 마지막 방문 워크스페이스

- [x] Redis에 마지막 방문 워크스페이스 저장
- [x] 워크스페이스 접근 시 자동 갱신

### 4.4 프론트엔드 페이지

- [x] 빈 워크스페이스 페이지 (/workspace/empty)
- [x] 워크스페이스 생성 페이지 (/workspace/new)
- [x] LNB 컴포넌트 (워크스페이스 목록, 정산 목록)

---

## Phase 5: 초대 시스템

> 의존성: Phase 4 (워크스페이스)

### 5.1 초대 API

- [x] POST /workspaces/:id/invitations - 초대 생성
- [x] GET /invitations - 내가 받은 초대 목록
- [x] PATCH /invitations/:id - 수락/거절

### 5.2 초대 이메일 발송

> ⏳ Phase 8로 연기됨 (8.5 참고)

### 5.3 프론트엔드

- [x] 사용자 검색 컴포넌트 (Dialog)
- [x] 초대 알림 표시 (빈 워크스페이스 페이지)
- [x] 초대 수락/거절 UI

### 5.4 워크스페이스 생성 시 초대

- [x] 백엔드: CreateWorkspaceDto에 inviteeEmails 추가
- [x] 백엔드: 워크스페이스 생성 시 초대 생성 로직 추가
- [x] 프론트엔드: 워크스페이스 생성 폼에 사용자 검색/초대 기능 추가

---

## Phase 6: Log (지출/수입) 기능

> 의존성: Phase 4 (워크스페이스)

### 6.1 카테고리/수단 API

- [ ] 카테고리 CRUD API
- [ ] 수단 CRUD API
- [ ] 기본 수단 (신용카드, 체크카드, 현금) 시드 데이터

### 6.2 Log API

- [ ] POST /workspaces/:id/logs - 생성
- [ ] GET /workspaces/:id/logs - 목록 (필터, 페이지네이션)
- [ ] PATCH /workspaces/:id/logs/:logId - 수정
- [ ] DELETE /workspaces/:id/logs/:logId - 삭제

### 6.3 대시보드 통계 API

- [ ] GET /workspaces/:id/stats - 통계 데이터
  - [ ] 일자별 지출/수입 데이터 (선 차트용)
  - [ ] 수단별 지출 데이터 (파이 차트용)
  - [ ] 카테고리별 지출/수입 데이터 (파이 차트용)
  - [ ] 사용자별 지출/수입 데이터 (표용)

### 6.4 프론트엔드 페이지

- [ ] 워크스페이스 대시보드 (/workspace/:id)
  - [ ] 상단 필터 영역 (기간, 사용자, 수단, 카테고리)
  - [ ] 일자별 Log 그래프 (선 차트)
  - [ ] 수단별 Log 그래프 (파이 차트)
  - [ ] 카테고리별 지출/수입 (파이 차트)
  - [ ] Log 목록 (무한 스크롤)
  - [ ] 사용자별 Log 표
- [ ] Log 추가/수정 Dialog
- [ ] 카테고리 관리 UI
- [ ] 수단 관리 UI

---

## Phase 7: 정산 기능

> 의존성: Phase 6 (Log)

### 7.1 정산 API

- [ ] POST /workspaces/:id/adjustments - 생성
- [ ] GET /workspaces/:id/adjustments - 목록
- [ ] GET /workspaces/:id/adjustments/:adjustmentId - 상세
- [ ] PATCH /workspaces/:id/adjustments/:adjustmentId - 수정
- [ ] DELETE /workspaces/:id/adjustments/:adjustmentId - 삭제
- [ ] POST /workspaces/:id/adjustments/:adjustmentId/complete - 완료 처리

### 7.2 정산 계산 로직

- [ ] 정산 대상 Log 필터링 (기간, 카테고리, 수단)
- [ ] 균등 분할 계산
- [ ] 송금 최적화 알고리즘 (최소 송금 횟수)

### 7.3 프론트엔드 페이지

- [ ] 정산 목록 (/workspace/:id/adjustment)
- [ ] 정산 생성 (/workspace/:id/adjustment/new)
- [ ] 정산 상세 (/workspace/:id/adjustment/:adjustmentId)
- [ ] 정산 수정 (/workspace/:id/adjustment/:adjustmentId?update)

---

## Phase 8: 알림 시스템

> 의존성: Phase 6, Phase 7 (Log, 정산 이벤트 발생)

### 8.1 알림 설정 API

- [ ] GET /workspaces/:id/notification-settings
- [ ] PATCH /workspaces/:id/notification-settings

### 8.2 웹 푸시 알림

- [ ] Service Worker 설정
- [ ] Push API 구독 관리
- [ ] 푸시 메시지 발송 (notification-worker)

### 8.3 Slack 웹훅 연동

- [ ] Slack 웹훅 메시지 포맷
- [ ] 웹훅 발송 Worker 구현

### 8.4 프론트엔드

- [ ] 워크스페이스 설정 페이지 (/workspace/:id/setting)
  - [ ] 카테고리/수단 관리 섹션
  - [ ] 멤버 관리 섹션 (초대/추방/권한)
  - [ ] 알림 설정 섹션

### 8.5 초대 이메일 발송 (Phase 5에서 연기됨)

- [ ] 초대 이메일 발송용 worker 생성 (invitation-mail-worker)
- [ ] 이메일 템플릿 작성
- [ ] BullMQ Job 등록

---

## Phase 9: 마무리 및 최적화

### 9.1 UI/UX 개선

- [ ] 반응형 레이아웃 검토
- [ ] 로딩 상태 UI
- [ ] 에러 처리 UI
- [ ] 빈 상태 UI

### 9.2 성능 최적화

- [ ] API 응답 캐싱
- [ ] 프론트엔드 번들 최적화
- [ ] 이미지 최적화 (썸네일, 프로필)

### 9.3 테스트

- [ ] API 통합 테스트
- [ ] 프론트엔드 컴포넌트 테스트
- [ ] E2E 테스트 (주요 플로우)

### 9.4 배포 준비

- [ ] 환경 변수 정리
- [ ] CI/CD 파이프라인 구성
- [ ] 프로덕션 인프라 설정

---

## 작업 의존 관계 다이어그램

```
Phase 1 (인프라/DB)
    │
    ▼
Phase 2 (인증)
    │
    ▼
Phase 3 (사용자)
    │
    ▼
Phase 4 (워크스페이스) ──────┐
    │                        │
    ├───────────┐            │
    ▼           ▼            │
Phase 5     Phase 6          │
(초대)      (Log)            │
                │            │
                ▼            │
            Phase 7 ◄────────┘
            (정산)
                │
                ▼
            Phase 8
            (알림)
                │
                ▼
            Phase 9
            (마무리)
```

---

## 참고 사항

### 기술 스택

- **Backend**: Express.js, TypeORM, tsyringe (DI), Passport.js
- **Frontend**: React 19, Vite, React Router v7, Zustand, TanStack Query
- **Worker**: BullMQ
- **Database**: PostgreSQL, Redis
- **Storage**: MinIO (S3 호환)

### 개발 명령어

```bash
pnpm dev                    # 전체 개발 서버 실행
pnpm --filter api dev       # API만 실행
pnpm --filter web dev       # Web만 실행
pnpm typecheck              # 타입 체크
pnpm test                   # 테스트 실행
```
