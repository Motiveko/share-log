# Reframe - CBT 기반 자가 치료 웹 앱 세부 기획서

> 인지행동치료(CBT) 기법을 활용한 모바일 우선 웹 앱. AI 상담, 감정 추적, 사고 일지, 대처 도구 등을 통해 사용자의 자가 치료를 돕는다.

---

## 목차

1. [데이터 모델](#1-데이터-모델)
2. [API 설계](#2-api-설계)
3. [LLM 통합 아키텍처](#3-llm-통합-아키텍처)
4. [프론트엔드 설계](#4-프론트엔드-설계)
5. [PWA 설정](#5-pwa-설정)
6. [신규 의존성](#6-신규-의존성)
7. [백그라운드 잡](#7-백그라운드-잡-bullmq)
8. [보안](#8-보안)
9. [구현 순서](#9-구현-순서)

---

## 1. 데이터 모델

기존 엔티티(`User`, `AuthProvider`, `PushSubscription`)를 유지하고, 아래 18개 엔티티를 신규 추가한다. 모든 엔티티는 `/packages/entities/src/`에 위치하며 TypeORM 데코레이터를 사용한다.

### 1.1 UserProfile

사용자 온보딩 데이터. `User`와 1:1 관계.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| userId | uuid (FK → User, UNIQUE) | |
| nickname | varchar(50) | 표시 닉네임 |
| primaryConcerns | varchar[] | 주요 고민 (분노, 불안, 우울 등) |
| stressLevel | smallint | 초기 스트레스 수준 (1-10) |
| goals | varchar[] | 치료 목표 |
| onboardingCompleted | boolean | 온보딩 완료 여부 (default: false) |
| onboardingStep | smallint | 현재 온보딩 단계 (default: 0) |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

**인덱스:** `userId` (UNIQUE)

### 1.2 UserSettings

사용자 앱 설정.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| userId | uuid (FK → User, UNIQUE) | |
| theme | enum('light','dark','system') | 테마 (default: 'system') |
| moodReminderEnabled | boolean | 감정 기록 리마인더 (default: true) |
| moodReminderTime | time | 리마인더 시간 (default: '21:00') |
| journalReminderEnabled | boolean | 일기 리마인더 (default: false) |
| journalReminderTime | time | 일기 리마인더 시간 (default: '22:00') |
| missionReminderEnabled | boolean | 미션 리마인더 (default: true) |
| missionReminderTime | time | 미션 리마인더 시간 (default: '09:00') |
| emergencyContact | varchar(100) | 긴급 연락처 (nullable) |
| emergencyContactPhone | varchar(20) | 긴급 연락처 전화번호 (nullable) |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

**인덱스:** `userId` (UNIQUE)

### 1.3 MoodEntry

감정 기록.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| userId | uuid (FK → User) | |
| score | smallint | 기분 점수 (1-10) |
| emotionTags | varchar[] | 감정 태그 (화남, 불안, 슬픔 등) |
| note | text | 메모 (nullable) |
| triggers | varchar[] | 트리거 (nullable) |
| recordedAt | timestamptz | 기록 시점 |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

**인덱스:** `userId`, `(userId, recordedAt)`

### 1.4 ThoughtDiary

CBT 사고 일지 (9단계).

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| userId | uuid (FK → User) | |
| situation | text | 1단계: 상황 |
| automaticThought | text | 2단계: 자동적 사고 |
| emotions | jsonb | 3단계: 감정 목록 `[{name: string, intensity: number}]` |
| beliefStrength | smallint | 4단계: 신념 강도 (0-100) |
| cognitiveDistortions | varchar[] | 5단계: 인지 왜곡 유형 |
| evidence | text | 6단계: 근거 (이 생각을 뒷받침하는 증거) |
| counterEvidence | text | 7단계: 반증 (이 생각에 반하는 증거) |
| alternativeThought | text | 8단계: 대안적 사고 |
| outcome | jsonb | 9단계: 결과 `{emotions: [{name, intensity}], beliefStrength: number, reflection: string}` |
| isComplete | boolean | 완성 여부 (default: false) |
| currentStep | smallint | 현재 작성 단계 (1-9, default: 1) |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

**인덱스:** `userId`, `(userId, createdAt)`, `(userId, isComplete)`

### 1.5 Journal

자유 일기 + 감사 일기.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| userId | uuid (FK → User) | |
| type | enum('free','gratitude') | 일기 유형 |
| title | varchar(200) | 제목 (nullable) |
| content | text | 내용 (암호화 저장) |
| aiAnalysis | text | AI 분석 결과 (nullable) |
| mood | smallint | 작성 시 기분 (1-10, nullable) |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

**인덱스:** `userId`, `(userId, type)`, `(userId, createdAt)`

### 1.6 ChatSession

LLM 대화 세션.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| userId | uuid (FK → User) | |
| title | varchar(200) | 세션 제목 (자동 생성 또는 사용자 지정) |
| summary | text | 세션 요약 (nullable) |
| isArchived | boolean | 보관 여부 (default: false) |
| messageCount | int | 메시지 수 (default: 0) |
| lastMessageAt | timestamptz | 마지막 메시지 시간 (nullable) |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

**인덱스:** `userId`, `(userId, isArchived)`, `(userId, lastMessageAt)`

### 1.7 ChatMessage

대화 메시지.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| sessionId | uuid (FK → ChatSession) | |
| role | enum('user','assistant','system') | 메시지 역할 |
| content | text | 메시지 내용 (암호화 저장) |
| tokenCount | int | 토큰 수 (nullable) |
| quickActions | jsonb | 빠른 액션 `[{label: string, action: string, params?: object}]` (nullable) |
| hasCrisisContent | boolean | 위기 콘텐츠 감지 여부 (default: false) |
| createdAt | timestamptz | |

**인덱스:** `sessionId`, `(sessionId, createdAt)`

### 1.8 DailyMission

행동 활성화 미션 카탈로그.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| title | varchar(200) | 미션 제목 |
| description | text | 미션 설명 |
| category | enum('exercise','social','mindfulness','self-care','creative','outdoor') | 카테고리 |
| difficulty | enum('easy','medium','hard') | 난이도 |
| estimatedMinutes | smallint | 예상 소요 시간 (분) |
| targetConcerns | varchar[] | 대상 고민 (분노, 불안 등) |
| isDefault | boolean | 기본 미션 여부 (default: true) |
| createdByUserId | uuid (FK → User, nullable) | 사용자 커스텀 미션 시 생성자 |
| createdAt | timestamptz | |

**인덱스:** `category`, `targetConcerns`

### 1.9 UserMissionAssignment

일일 미션 할당.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| userId | uuid (FK → User) | |
| missionId | uuid (FK → DailyMission) | |
| assignedDate | date | 할당 날짜 |
| status | enum('pending','completed','skipped') | 상태 (default: 'pending') |
| completedAt | timestamptz | 완료 시간 (nullable) |
| reflection | text | 완료 후 소감 (nullable) |
| createdAt | timestamptz | |

**인덱스:** `(userId, assignedDate)`, `(userId, status)`

### 1.10 CopingTool

대처 도구 정의.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| name | varchar(100) | 도구 이름 |
| description | text | 설명 |
| category | enum('breathing','relaxation','meditation','grounding','other') | 카테고리 |
| durationSeconds | int | 수행 시간 (초) |
| instructions | jsonb | 단계별 안내 `[{step: number, text: string, durationMs: number, animation?: string}]` |
| targetEmotions | varchar[] | 대상 감정 |
| iconName | varchar(50) | 아이콘 식별자 |
| sortOrder | smallint | 정렬 순서 |
| createdAt | timestamptz | |

**인덱스:** `category`, `sortOrder`

### 1.11 CopingToolUsage

대처 도구 사용 기록.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| userId | uuid (FK → User) | |
| toolId | uuid (FK → CopingTool) | |
| completedFullSession | boolean | 전체 세션 완료 여부 |
| moodBefore | smallint | 사용 전 기분 (1-10, nullable) |
| moodAfter | smallint | 사용 후 기분 (1-10, nullable) |
| usedAt | timestamptz | 사용 시간 |
| createdAt | timestamptz | |

**인덱스:** `userId`, `(userId, usedAt)`

### 1.12 EducationalContent

교육 자료.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| title | varchar(200) | 제목 |
| slug | varchar(200) | URL 슬러그 (UNIQUE) |
| summary | text | 요약 |
| content | text | 마크다운 본문 |
| category | enum('cbt-basics','cognitive-distortions','emotion-regulation','anger-management','anxiety','mindfulness','relationships','self-esteem') | 카테고리 |
| tags | varchar[] | 태그 |
| readingTimeMinutes | smallint | 예상 읽기 시간 |
| sortOrder | smallint | 정렬 순서 |
| isPublished | boolean | 게시 여부 (default: true) |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

**인덱스:** `slug` (UNIQUE), `category`, `isPublished`

### 1.13 UserContentProgress

교육 자료 읽기 진행.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| userId | uuid (FK → User) | |
| contentId | uuid (FK → EducationalContent) | |
| isCompleted | boolean | 읽기 완료 여부 (default: false) |
| completedAt | timestamptz | 완료 시간 (nullable) |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

**인덱스:** `(userId, contentId)` (UNIQUE), `userId`

### 1.14 Badge

배지 정의.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| name | varchar(100) | 배지 이름 |
| description | text | 획득 조건 설명 |
| iconName | varchar(50) | 아이콘 식별자 |
| category | enum('streak','recording','diary','mission','education','milestone') | 카테고리 |
| condition | jsonb | 획득 조건 `{type: string, threshold: number}` |
| sortOrder | smallint | 정렬 순서 |
| createdAt | timestamptz | |

### 1.15 UserBadge

사용자 배지 획득 기록.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| userId | uuid (FK → User) | |
| badgeId | uuid (FK → Badge) | |
| earnedAt | timestamptz | 획득 시간 |
| createdAt | timestamptz | |

**인덱스:** `(userId, badgeId)` (UNIQUE), `userId`

### 1.16 UserStreak

연속 기록 추적.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| userId | uuid (FK → User, UNIQUE) | |
| currentStreak | int | 현재 연속 일수 (default: 0) |
| longestStreak | int | 최장 연속 일수 (default: 0) |
| lastActiveDate | date | 마지막 활동 날짜 (nullable) |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

**인덱스:** `userId` (UNIQUE)

### 1.17 LlmUsage

LLM 사용량 추적.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| userId | uuid (FK → User) | |
| provider | varchar(50) | 프로바이더 이름 (gemini, openai 등) |
| model | varchar(100) | 모델 이름 |
| inputTokens | int | 입력 토큰 수 |
| outputTokens | int | 출력 토큰 수 |
| endpoint | varchar(100) | 사용된 엔드포인트 (chat, journal-analysis 등) |
| usedAt | timestamptz | 사용 시간 |
| createdAt | timestamptz | |

**인덱스:** `userId`, `(userId, usedAt)`, `(userId, provider)`

### 엔티티 관계도

```
User (기존)
 ├── 1:1 UserProfile
 ├── 1:1 UserSettings
 ├── 1:1 UserStreak
 ├── 1:N MoodEntry
 ├── 1:N ThoughtDiary
 ├── 1:N Journal
 ├── 1:N ChatSession
 │       └── 1:N ChatMessage
 ├── 1:N UserMissionAssignment
 │       └── N:1 DailyMission
 ├── 1:N CopingToolUsage
 │       └── N:1 CopingTool
 ├── 1:N UserContentProgress
 │       └── N:1 EducationalContent
 ├── 1:N UserBadge
 │       └── N:1 Badge
 └── 1:N LlmUsage
```

---

## 2. API 설계

모든 엔드포인트는 `/api` 프리픽스를 사용한다. 인증이 필요한 엔드포인트는 🔒로 표시.

### 2.1 Onboarding (`/api/onboarding`)

| Method | Path | 설명 |
|--------|------|------|
| 🔒 GET | `/api/onboarding/status` | 온보딩 상태 조회 (완료 여부, 현재 단계) |
| 🔒 POST | `/api/onboarding/submit` | 온보딩 데이터 제출 (전체 또는 단계별) |
| 🔒 PATCH | `/api/onboarding/profile` | 온보딩 후 프로필 수정 |

**POST `/api/onboarding/submit`** Request:
```typescript
{
  nickname: string;
  primaryConcerns: string[];   // ['anger', 'anxiety', 'depression', ...]
  stressLevel: number;          // 1-10
  goals: string[];              // ['emotion-regulation', 'self-understanding', ...]
  notificationConsent: boolean;
}
```

### 2.2 Chat (`/api/chat`)

| Method | Path | 설명 |
|--------|------|------|
| 🔒 GET | `/api/chat/sessions` | 세션 목록 (페이지네이션, 아카이브 필터) |
| 🔒 POST | `/api/chat/sessions` | 새 세션 생성 |
| 🔒 GET | `/api/chat/sessions/:id` | 세션 상세 + 메시지 목록 |
| 🔒 DELETE | `/api/chat/sessions/:id` | 세션 삭제 |
| 🔒 POST | `/api/chat/sessions/:id/messages` | 메시지 전송 (SSE 스트리밍 응답) |
| 🔒 PATCH | `/api/chat/sessions/:id/archive` | 세션 아카이브/언아카이브 |

**POST `/api/chat/sessions/:id/messages`** Request:
```typescript
{
  content: string;
}
```

Response: **SSE 스트리밍** (`text/event-stream`)
```
event: start
data: {"messageId": "uuid"}

event: delta
data: {"content": "안녕"}

event: delta
data: {"content": "하세요"}

event: quickActions
data: {"actions": [{"label": "사고 일지 작성하기", "action": "navigate", "params": {"path": "/thought-diary/new"}}]}

event: crisis
data: {"detected": true, "message": "힘든 상황이시군요..."}

event: done
data: {"tokenCount": 150, "hasCrisisContent": false}
```

### 2.3 Mood (`/api/mood`)

| Method | Path | 설명 |
|--------|------|------|
| 🔒 GET | `/api/mood` | 감정 기록 목록 (페이지네이션, 날짜 범위 필터) |
| 🔒 POST | `/api/mood` | 감정 기록 생성 |
| 🔒 GET | `/api/mood/:id` | 감정 기록 상세 |
| 🔒 PATCH | `/api/mood/:id` | 감정 기록 수정 |
| 🔒 DELETE | `/api/mood/:id` | 감정 기록 삭제 |
| 🔒 GET | `/api/mood/summary` | 통계 요약 (기간별 평균, 감정 분포, 트리거 빈도) |
| 🔒 GET | `/api/mood/calendar` | 캘린더 데이터 (월별 일자 + 기분 점수) |

**POST `/api/mood`** Request:
```typescript
{
  score: number;         // 1-10
  emotionTags: string[]; // ['화남', '짜증', '불안', ...]
  note?: string;
  triggers?: string[];
  recordedAt?: string;   // ISO 8601, 없으면 현재 시간
}
```

**GET `/api/mood/summary`** Query:
```
?from=2025-01-01&to=2025-01-31
```

Response:
```typescript
{
  averageScore: number;
  totalEntries: number;
  emotionDistribution: { [emotion: string]: number };
  triggerDistribution: { [trigger: string]: number };
  dailyAverages: { date: string; average: number }[];
}
```

### 2.4 Thought Diary (`/api/thought-diary`)

| Method | Path | 설명 |
|--------|------|------|
| 🔒 GET | `/api/thought-diary` | 사고 일지 목록 (페이지네이션, 완성 필터) |
| 🔒 POST | `/api/thought-diary` | 사고 일지 생성 |
| 🔒 GET | `/api/thought-diary/:id` | 사고 일지 상세 |
| 🔒 PATCH | `/api/thought-diary/:id` | 사고 일지 수정 (단계별 자동 저장) |
| 🔒 DELETE | `/api/thought-diary/:id` | 사고 일지 삭제 |
| 🔒 GET | `/api/thought-diary/distortion-stats` | 인지 왜곡 통계 |

**PATCH `/api/thought-diary/:id`** Request (단계별 부분 업데이트):
```typescript
{
  currentStep: number;
  situation?: string;
  automaticThought?: string;
  emotions?: { name: string; intensity: number }[];
  beliefStrength?: number;
  cognitiveDistortions?: string[];
  evidence?: string;
  counterEvidence?: string;
  alternativeThought?: string;
  outcome?: {
    emotions: { name: string; intensity: number }[];
    beliefStrength: number;
    reflection: string;
  };
  isComplete?: boolean;
}
```

**GET `/api/thought-diary/distortion-stats`** Response:
```typescript
{
  totalDiaries: number;
  distortionCounts: { [distortion: string]: number };
  topDistortions: { name: string; count: number; percentage: number }[];
  monthlyTrend: { month: string; counts: { [distortion: string]: number } }[];
}
```

### 2.5 Journal (`/api/journal`)

| Method | Path | 설명 |
|--------|------|------|
| 🔒 GET | `/api/journal` | 일기 목록 (페이지네이션, 유형 필터) |
| 🔒 POST | `/api/journal` | 일기 작성 |
| 🔒 GET | `/api/journal/:id` | 일기 상세 |
| 🔒 PATCH | `/api/journal/:id` | 일기 수정 |
| 🔒 DELETE | `/api/journal/:id` | 일기 삭제 |
| 🔒 POST | `/api/journal/:id/analyze` | AI 분석 요청 (SSE 스트리밍) |

**POST `/api/journal`** Request:
```typescript
{
  type: 'free' | 'gratitude';
  title?: string;
  content: string;
  mood?: number;  // 1-10
}
```

**POST `/api/journal/:id/analyze`** Response: SSE 스트리밍
```
event: start
data: {"analysisId": "uuid"}

event: delta
data: {"content": "일기에서 느껴지는 감정은..."}

event: done
data: {"tokenCount": 200}
```

### 2.6 Mission (`/api/mission`)

| Method | Path | 설명 |
|--------|------|------|
| 🔒 GET | `/api/mission/today` | 오늘의 미션 목록 |
| 🔒 PATCH | `/api/mission/assignments/:id/complete` | 미션 완료 처리 |
| 🔒 GET | `/api/mission/history` | 미션 수행 히스토리 (페이지네이션) |
| 🔒 GET | `/api/mission/catalog` | 미션 카탈로그 (카테고리 필터) |
| 🔒 POST | `/api/mission/custom` | 커스텀 미션 생성 |

**PATCH `/api/mission/assignments/:id/complete`** Request:
```typescript
{
  reflection?: string;  // 완료 소감
}
```

**GET `/api/mission/today`** Response:
```typescript
{
  date: string;
  missions: {
    assignmentId: string;
    mission: {
      id: string;
      title: string;
      description: string;
      category: string;
      difficulty: string;
      estimatedMinutes: number;
    };
    status: 'pending' | 'completed' | 'skipped';
    completedAt?: string;
  }[];
}
```

### 2.7 Coping Tools (`/api/coping-tools`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/coping-tools` | 도구 목록 (카테고리 필터) |
| GET | `/api/coping-tools/:id` | 도구 상세 (instructions 포함) |
| 🔒 POST | `/api/coping-tools/:id/usage` | 사용 기록 저장 |
| 🔒 GET | `/api/coping-tools/usage/history` | 사용 히스토리 |

**POST `/api/coping-tools/:id/usage`** Request:
```typescript
{
  completedFullSession: boolean;
  moodBefore?: number;  // 1-10
  moodAfter?: number;   // 1-10
}
```

### 2.8 Education (`/api/education`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/education` | 교육 자료 목록 (카테고리 필터, 페이지네이션) |
| 🔒 GET | `/api/education/recommended` | 사용자 맞춤 추천 자료 |
| GET | `/api/education/:slug` | 교육 자료 상세 |
| 🔒 POST | `/api/education/:id/complete` | 읽음 표시 |
| 🔒 GET | `/api/education/progress` | 읽기 진행 현황 |

**GET `/api/education/recommended`** Response:
```typescript
{
  items: {
    id: string;
    title: string;
    summary: string;
    category: string;
    readingTimeMinutes: number;
    isCompleted: boolean;
    reason: string;  // 추천 이유
  }[];
}
```

### 2.9 Analytics (`/api/analytics`)

| Method | Path | 설명 |
|--------|------|------|
| 🔒 GET | `/api/analytics/dashboard` | 대시보드 종합 데이터 |
| 🔒 GET | `/api/analytics/mood-trend` | 감정 트렌드 (기간 필터) |
| 🔒 GET | `/api/analytics/distortion-trend` | 인지 왜곡 트렌드 |
| 🔒 GET | `/api/analytics/badges` | 배지 목록 + 획득 상태 |
| 🔒 GET | `/api/analytics/streak` | 스트릭 정보 |

**GET `/api/analytics/dashboard`** Response:
```typescript
{
  todayMood: { score: number; emotionTags: string[] } | null;
  weeklyMoodAverage: number;
  weeklyMoodData: { date: string; average: number }[];
  currentStreak: number;
  longestStreak: number;
  todayMissions: { total: number; completed: number };
  recentBadge: { name: string; iconName: string; earnedAt: string } | null;
  motivationalQuote: string;
  quickTip: string;
}
```

### 2.10 Settings (`/api/settings`)

| Method | Path | 설명 |
|--------|------|------|
| 🔒 GET | `/api/settings` | 설정 조회 |
| 🔒 PATCH | `/api/settings` | 설정 수정 |
| 🔒 GET | `/api/settings/profile` | 프로필 조회 |
| 🔒 PATCH | `/api/settings/profile` | 프로필 수정 |
| 🔒 POST | `/api/settings/export` | 데이터 내보내기 (JSON) |

**PATCH `/api/settings`** Request:
```typescript
{
  theme?: 'light' | 'dark' | 'system';
  moodReminderEnabled?: boolean;
  moodReminderTime?: string;       // "HH:mm"
  journalReminderEnabled?: boolean;
  journalReminderTime?: string;
  missionReminderEnabled?: boolean;
  missionReminderTime?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
}
```

### 공통 규약

**페이지네이션** (GET 목록 API):
```
?page=1&limit=20
```

Response 형태:
```typescript
{
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**에러 응답**:
```typescript
{
  statusCode: number;
  message: string;
  error?: string;
}
```

---

## 3. LLM 통합 아키텍처

### 3.1 Provider 추상화 (Strategy 패턴)

파일 위치: `/apps/api/src/lib/llm/`

```typescript
// llm-provider.interface.ts
interface LlmProvider {
  readonly name: string;
  generateStream(params: LlmStreamParams): AsyncGenerator<LlmStreamChunk>;
  countTokens(text: string): Promise<number>;
}

interface LlmStreamParams {
  systemPrompt: string;
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
}

interface LlmMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface LlmStreamChunk {
  type: 'text' | 'done' | 'error';
  content?: string;
  tokenCount?: { input: number; output: number };
  error?: string;
}
```

### 3.2 Gemini Provider (기본 구현)

```typescript
// gemini-provider.ts
@injectable()
class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async *generateStream(params: LlmStreamParams): AsyncGenerator<LlmStreamChunk> {
    const model = this.client.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: params.systemPrompt,
    });

    const chat = model.startChat({
      history: this.convertMessages(params.messages.slice(0, -1)),
    });

    const lastMessage = params.messages[params.messages.length - 1];
    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      yield { type: 'text', content: chunk.text() };
    }

    const response = await result.response;
    yield {
      type: 'done',
      tokenCount: {
        input: response.usageMetadata?.promptTokenCount ?? 0,
        output: response.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }
}
```

### 3.3 LLM Service

```typescript
// llm-service.ts
@injectable()
class LlmService {
  private providers: Map<string, LlmProvider>;
  private defaultProvider: string;

  constructor(@inject('GeminiProvider') gemini: GeminiProvider) {
    this.providers = new Map([['gemini', gemini]]);
    this.defaultProvider = process.env.LLM_DEFAULT_PROVIDER || 'gemini';
  }

  getProvider(name?: string): LlmProvider {
    return this.providers.get(name || this.defaultProvider)!;
  }
}
```

### 3.4 CBT 시스템 프롬프트

```typescript
// prompts/cbt-counselor.ts
export const CBT_COUNSELOR_SYSTEM_PROMPT = `
당신은 "리프레임"이라는 인지행동치료(CBT) 기반 자가치료 앱의 AI 상담사입니다.

## 역할
- 공감적이고 따뜻한 태도로 대화합니다.
- 소크라테스식 문답법으로 사용자가 스스로 인지 왜곡을 발견하도록 유도합니다.
- 절대로 진단이나 처방을 하지 않습니다.
- 전문 상담사나 의료 전문가를 대체하지 않음을 인지합니다.

## 대화 원칙
1. 먼저 사용자의 감정을 검증(validation)합니다.
2. 구체적인 상황을 파악합니다.
3. 자동적 사고를 식별합니다.
4. 인지 왜곡이 있는지 부드럽게 탐색합니다.
5. 대안적 관점을 함께 찾아봅니다.
6. 필요 시 대처 도구나 활동을 제안합니다.

## 인지 왜곡 유형
흑백논리, 과일반화, 정신적 필터링, 긍정 격하, 성급한 결론(독심술/점쟁이 오류),
확대/축소, 감정적 추론, 당위적 사고, 낙인찍기, 개인화

## 안전 규칙
- 자살, 자해, 타해 관련 내용 감지 시 즉시 전문 상담 연락처를 안내합니다.
- 의학적 조언이나 약물 관련 질문에는 전문가 상담을 권유합니다.
- 사용자의 감정을 절대 평가하거나 판단하지 않습니다.

## 응답 스타일
- 한국어로 답변합니다.
- 200자 이내의 짧은 메시지로 대화합니다.
- 이모지를 적절히 사용하되 과하지 않게 합니다.
- 한 번에 하나의 질문만 합니다.
`;
```

### 3.5 위기 감지

```typescript
// crisis-detector.ts
const CRISIS_KEYWORDS = [
  '자살', '죽고 싶', '죽을', '자해', '손목', '목숨',
  '살고 싶지 않', '사라지고 싶', '없어지고 싶',
];

const CRISIS_RESPONSE = {
  message: '많이 힘드시군요. 당신의 안전이 가장 중요합니다.',
  contacts: [
    { name: '자살예방상담전화', number: '1393', available: '24시간' },
    { name: '정신건강위기상담전화', number: '1577-0199', available: '24시간' },
    { name: '생명의전화', number: '1588-9191', available: '24시간' },
  ],
};
```

### 3.6 대화 컨텍스트 관리

- **슬라이딩 윈도우:** 최근 20개 메시지를 LLM 컨텍스트로 전달
- **세션 제목 자동 생성:** 첫 2회 교환 후 LLM에 제목 생성 요청
- **세션 요약:** 장기 세션 시 이전 대화 요약을 시스템 프롬프트에 포함

### 3.7 Rate Limiting

Redis 기반 슬라이딩 윈도우 방식:

| 윈도우 | 제한 | Redis 키 |
|--------|------|----------|
| 분당 | 10 요청 | `rate:llm:{userId}:minute` |
| 시간당 | 60 요청 | `rate:llm:{userId}:hour` |
| 일당 | 200 요청 | `rate:llm:{userId}:day` |

초과 시 `429 Too Many Requests` 응답.

---

## 4. 프론트엔드 설계

### 4.1 네비게이션 구조

하단 5탭 네비게이션:

| 탭 | 아이콘 | 라벨 | 설명 |
|----|--------|------|------|
| Home | 🏠 | 홈 | 대시보드 |
| Record | 📝 | 기록 | 감정, 사고 일지, 일기 |
| Chat | 💬 | 상담 | AI 챗봇 |
| Tools | 🧰 | 도구 | 대처 도구, 교육 자료, 미션 |
| Stats | 📊 | 분석 | 통계, 배지, 스트릭 |

### 4.2 라우트 구성

```
/                           # 홈 대시보드
/onboarding                 # 온보딩 위저드
/login                      # 로그인

# 기록 탭
/record                     # 기록 탭 홈 (감정/사고일지/일기 바로가기)
/record/mood                # 감정 기록 목록 + 캘린더
/record/mood/new            # 새 감정 기록
/record/mood/:id            # 감정 기록 상세
/record/thought-diary       # 사고 일지 목록
/record/thought-diary/new   # 새 사고 일지 (9단계 위저드)
/record/thought-diary/:id   # 사고 일지 상세/수정
/record/journal             # 일기 목록
/record/journal/new         # 새 일기 작성
/record/journal/:id         # 일기 상세/수정

# 상담 탭
/chat                       # 채팅 세션 목록
/chat/:sessionId            # 채팅 대화 화면

# 도구 탭
/tools                      # 도구 탭 홈
/tools/coping               # 대처 도구 목록
/tools/coping/:id           # 대처 도구 실행 화면
/tools/education            # 교육 자료 목록
/tools/education/:slug      # 교육 자료 상세
/tools/mission              # 미션 목록
/tools/mission/history      # 미션 수행 히스토리

# 분석 탭
/stats                      # 분석 대시보드
/stats/badges               # 배지 목록

# 설정
/settings                   # 설정
/settings/profile           # 프로필 수정
/settings/export            # 데이터 내보내기
```

### 4.3 온보딩 플로우 (8단계)

```
1. 환영 → 앱 소개, 주요 기능 안내
2. 개인정보 동의 → 데이터 수집, 암호화 설명
3. 주요 고민 선택 → 분노/불안/우울/스트레스/관계/자존감 (복수 선택)
4. 스트레스 수준 → 슬라이더 (1-10)
5. 목표 선택 → 감정 조절/자기 이해/습관 개선/대인관계 (복수 선택)
6. 닉네임 설정 → 앱 내 표시 이름
7. 알림 설정 → 푸시 알림 권한, 기본 리마인더 시간
8. 완료 → AI 상담사 환영 인사, 홈으로 이동
```

각 단계는 framer-motion 슬라이드 전환 애니메이션 적용.

### 4.4 홈 대시보드

```
┌─────────────────────────┐
│  오늘의 한마디 (동기부여) │
├─────────────────────────┤
│  감정 요약               │
│  😊 7/10 "괜찮은 하루"   │
├─────────────────────────┤
│  주간 감정 차트           │
│  ▁▃▅▇▅▃▁ (Recharts)     │
├─────────────────────────┤
│  오늘의 미션 (2/3 완료)   │
│  ■■□                     │
├─────────────────────────┤
│  퀵 액션 그리드           │
│ ┌──────┐ ┌──────┐       │
│ │감정  │ │상담  │       │
│ │기록  │ │시작  │       │
│ ├──────┤ ├──────┤       │
│ │호흡  │ │사고  │       │
│ │운동  │ │일지  │       │
│ └──────┘ └──────┘       │
└─────────────────────────┘
```

### 4.5 채팅 UI

- **메시지 버블:** 사용자(우측, primary color) / AI(좌측, surface color)
- **SSE 스트리밍:** 텍스트가 실시간으로 타이핑되는 효과
- **빠른 액션 버튼:** AI 응답 하단에 제안 버튼 배열
- **위기 알림 배너:** 위기 감지 시 화면 상단에 고정 배너 + 전문 상담 연락처
- **입력 영역:** 텍스트 입력 + 전송 버튼, 자동 높이 조절 textarea
- **세션 리스트:** 최근 대화 세션 목록, 아카이브 필터

### 4.6 감정 기록 UI (4단계)

```
Step 1: 이모지 선택
  😡 😢 😰 😊 😐 😤 😔 🤔 😌 🥰

Step 2: 기분 점수 슬라이더
  1 ──────●────── 10

Step 3: 감정 태그 선택 (복수)
  [화남] [짜증] [불안] [슬픔] [외로움] [기쁨] ...

Step 4: 메모 + 트리거
  📝 메모 입력
  🎯 트리거 태그: [직장] [가족] [건강] ...
```

### 4.7 사고 일지 UI (9단계 위저드)

각 단계는 독립 화면으로 구성, 하단 진행 표시 바 포함. 자동 저장(debounce 1초).

| 단계 | 화면 | 입력 |
|------|------|------|
| 1 | 상황 | textarea + 가이드 문구 "무슨 일이 있었나요?" |
| 2 | 자동적 사고 | textarea + "그때 어떤 생각이 떠올랐나요?" |
| 3 | 감정 | 감정 칩 선택 + 각 감정 강도 슬라이더 (0-100) |
| 4 | 신념 강도 | "이 생각을 얼마나 믿나요?" 슬라이더 (0-100) |
| 5 | 인지 왜곡 | 왜곡 유형 칩 선택 (복수) + 각 설명 툴팁 |
| 6 | 근거 | "이 생각을 뒷받침하는 증거는?" textarea |
| 7 | 반증 | "이 생각에 반하는 증거는?" textarea |
| 8 | 대안적 사고 | "더 균형 잡힌 생각은?" textarea |
| 9 | 결과 | 감정 변화 확인 + 새 신념 강도 + 성찰 메모 |

### 4.8 대처 도구 UI

- **목록:** 카드 그리드 (아이콘 + 이름 + 소요 시간 + 대상 감정)
- **실행 화면:** 풀스크린 모달
  - **호흡 운동:** 원형 애니메이션 (framer-motion) - 들이쉬기/참기/내쉬기 사이클
  - **근육 이완:** 단계별 텍스트 안내 + 타이머
  - **명상:** 타이머 + 배경 사운드(optional)
  - **그라운딩:** 5-4-3-2-1 감각 입력 폼
- **완료 후:** 기분 변화 체크 (사용 전/후 비교)

### 4.9 분석 대시보드

Recharts 기반 차트:

- **감정 트렌드 LineChart:** 일별/주별/월별 기분 점수 추이
- **감정 분포 PieChart:** 감정 태그별 비율
- **인지 왜곡 BarChart:** 왜곡 유형별 빈도
- **스트릭 표시:** 현재 연속 일수 + 최장 기록
- **배지 그리드:** 획득/미획득 배지 목록

### 4.10 Zustand Store 구조

```typescript
// 기존 auth, theme 슬라이스에 추가
stores/
  auth-store.ts      // (기존) 인증 상태
  theme-store.ts     // (기존) 테마
  onboarding-store.ts // 온보딩 위저드 상태
  mood-store.ts       // 감정 기록 폼 상태
  chat-store.ts       // 현재 채팅 세션/메시지 상태
  thought-diary-store.ts // 사고 일지 위저드 상태
```

### 4.11 TanStack Query 키 구조

```typescript
queryKeys = {
  mood: {
    all: ['mood'],
    list: (filters) => ['mood', 'list', filters],
    detail: (id) => ['mood', 'detail', id],
    summary: (range) => ['mood', 'summary', range],
    calendar: (month) => ['mood', 'calendar', month],
  },
  chat: {
    sessions: (filters) => ['chat', 'sessions', filters],
    session: (id) => ['chat', 'session', id],
    messages: (sessionId) => ['chat', 'messages', sessionId],
  },
  thoughtDiary: {
    all: ['thought-diary'],
    list: (filters) => ['thought-diary', 'list', filters],
    detail: (id) => ['thought-diary', 'detail', id],
    distortionStats: () => ['thought-diary', 'distortion-stats'],
  },
  journal: {
    all: ['journal'],
    list: (filters) => ['journal', 'list', filters],
    detail: (id) => ['journal', 'detail', id],
  },
  mission: {
    today: () => ['mission', 'today'],
    history: (filters) => ['mission', 'history', filters],
    catalog: (filters) => ['mission', 'catalog', filters],
  },
  copingTools: {
    all: ['coping-tools'],
    detail: (id) => ['coping-tools', 'detail', id],
    usageHistory: () => ['coping-tools', 'usage-history'],
  },
  education: {
    all: ['education'],
    list: (filters) => ['education', 'list', filters],
    detail: (slug) => ['education', 'detail', slug],
    recommended: () => ['education', 'recommended'],
    progress: () => ['education', 'progress'],
  },
  analytics: {
    dashboard: () => ['analytics', 'dashboard'],
    moodTrend: (range) => ['analytics', 'mood-trend', range],
    distortionTrend: () => ['analytics', 'distortion-trend'],
    badges: () => ['analytics', 'badges'],
    streak: () => ['analytics', 'streak'],
  },
  settings: {
    all: () => ['settings'],
    profile: () => ['settings', 'profile'],
  },
};
```

---

## 5. PWA 설정

### 5.1 manifest.json

```json
{
  "name": "리프레임 - CBT 자가 치료",
  "short_name": "리프레임",
  "description": "인지행동치료 기반 AI 자가 치료 앱",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#4A90D9",
  "background_color": "#FFFFFF",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "categories": ["health", "lifestyle", "medical"]
}
```

### 5.2 서비스 워커

기존 서비스 워커를 강화:

- **정적 자산 캐싱:** App Shell (HTML, CSS, JS, 폰트) → Cache First
- **API 캐싱:** 교육 자료, 대처 도구 목록 → Stale While Revalidate
- **오프라인 폴백:** 네트워크 미연결 시 `/offline.html` 표시
- **백그라운드 동기화:** 오프라인에서 작성한 감정 기록/일기를 온라인 복귀 시 자동 전송
- **푸시 알림 수신:** `push` 이벤트 → 알림 표시 → 클릭 시 딥링크 이동

### 5.3 설치 프롬프트

`beforeinstallprompt` 이벤트 캡처 → 커스텀 설치 배너 표시:
- 3회 이상 방문 후 표시
- "홈 화면에 추가하고 더 편리하게 사용하세요" 메시지
- 닫기 후 7일 뒤 재표시

### 5.4 푸시 알림 카테고리

| 카테고리 | 트리거 | 내용 예시 |
|----------|--------|-----------|
| 감정 기록 | 설정된 리마인더 시간 | "오늘 기분은 어떠세요? 감정을 기록해보세요 📝" |
| 일기 | 설정된 리마인더 시간 | "오늘 하루를 돌아보며 일기를 써보세요 ✍️" |
| 미션 | 미완료 미션 존재 시 설정된 시간 | "오늘의 미션이 기다리고 있어요! 💪" |
| 스트릭 | 하루 미활동 시 | "연속 기록이 끊기기 전에 오늘도 기록해보세요 🔥" |
| 배지 | 획득 즉시 | "새로운 배지를 획득했어요! 🏅" |
| 미완성 일지 | 작성 시작 후 24시간 미완성 | "작성 중인 사고 일지가 있어요. 마무리해볼까요?" |

---

## 6. 신규 의존성

### API (`/apps/api`)

| 패키지 | 용도 |
|--------|------|
| `@google/generative-ai` | Google Gemini SDK |

### Web (`/apps/web`)

| 패키지 | 용도 |
|--------|------|
| `recharts` | 차트 (감정 트렌드, 통계) |
| `framer-motion` | 애니메이션 (호흡 운동, 온보딩 전환, 축하 효과) |
| `date-fns` | 날짜 유틸리티 |
| `react-markdown` | 교육 콘텐츠 마크다운 렌더링 |

### 공유 (`/packages/constants`)

신규 의존성 없음. 아래 상수를 추가:

```typescript
// emotion-tags.ts
export const EMOTION_TAGS = [
  '화남', '짜증', '분노', '불안', '걱정', '두려움',
  '슬픔', '우울', '외로움', '기쁨', '평온', '감사',
  '수치심', '죄책감', '질투', '실망', '좌절', '혼란',
] as const;

// cognitive-distortions.ts
export const COGNITIVE_DISTORTIONS = [
  { id: 'all-or-nothing', name: '흑백논리', description: '상황을 양극단으로만 봅니다.' },
  { id: 'overgeneralization', name: '과일반화', description: '하나의 사건으로 모든 것을 일반화합니다.' },
  { id: 'mental-filter', name: '정신적 필터링', description: '부정적인 면만 골라 봅니다.' },
  { id: 'disqualifying-positive', name: '긍정 격하', description: '긍정적 경험을 무시하거나 평가절하합니다.' },
  { id: 'jumping-to-conclusions', name: '성급한 결론', description: '근거 없이 부정적 결론에 도달합니다.' },
  { id: 'magnification', name: '확대/축소', description: '부정적인 것은 확대하고 긍정적인 것은 축소합니다.' },
  { id: 'emotional-reasoning', name: '감정적 추론', description: '감정을 사실의 증거로 여깁니다.' },
  { id: 'should-statements', name: '당위적 사고', description: '"~해야 한다"는 사고에 갇힙니다.' },
  { id: 'labeling', name: '낙인찍기', description: '자신이나 타인에게 극단적 라벨을 붙입니다.' },
  { id: 'personalization', name: '개인화', description: '모든 것을 자신의 탓으로 돌립니다.' },
] as const;

// mission-categories.ts
export const MISSION_CATEGORIES = [
  'exercise', 'social', 'mindfulness', 'self-care', 'creative', 'outdoor',
] as const;

// coping-tool-categories.ts
export const COPING_TOOL_CATEGORIES = [
  'breathing', 'relaxation', 'meditation', 'grounding', 'other',
] as const;
```

---

## 7. 백그라운드 잡 (BullMQ)

기존 `notification-worker`를 확장하여 아래 잡 타입을 추가한다.

### 잡 목록

| 잡 이름 | 스케줄 | 설명 |
|---------|--------|------|
| `mood-reminder` | 사용자별 설정 시간 | 감정 기록 리마인더 푸시 알림 |
| `journal-reminder` | 사용자별 설정 시간 | 일기 쓰기 리마인더 푸시 알림 |
| `mission-reminder` | 사용자별 설정 시간 | 미완료 미션 리마인더 푸시 알림 |
| `daily-mission-assign` | 매일 00:05 KST | 각 사용자에게 3개 미션 자동 할당 |
| `streak-calculate` | 매일 00:10 KST | 전일 활동 기반 스트릭 계산/업데이트 |
| `badge-check` | 이벤트 트리거 | 조건 충족 시 배지 부여 |
| `llm-usage-aggregate` | 매일 01:00 KST | 일별 LLM 사용량 집계 |
| `incomplete-diary-notify` | 작성 시작 후 24시간 | 미완성 사고 일지 알림 |

### 잡 상세

**daily-mission-assign:**
- 사용자의 `primaryConcerns`를 기반으로 관련 미션 3개 선택
- 난이도 배분: easy 1개, medium 1개, hard 또는 medium 1개
- 최근 7일 내 할당된 미션은 제외하여 다양성 확보

**streak-calculate:**
- `MoodEntry`, `Journal`, `ThoughtDiary` 중 하나라도 해당 날짜에 기록이 있으면 활동으로 인정
- 전일 활동 없으면 `currentStreak = 0`
- `longestStreak` 업데이트
- 스트릭 끊김 위험 시 알림 전송

**badge-check:**
- 이벤트 기반 트리거 (감정 기록 저장, 사고 일지 완성, 미션 완료 등)
- Badge 테이블의 `condition` JSON과 사용자 데이터 매칭
- 조건 충족 시 `UserBadge` 생성 + 축하 알림

---

## 8. 보안

### 8.1 데이터 암호화

**AES-256-GCM 암호화 대상 필드:**
- `ChatMessage.content`
- `ThoughtDiary.situation`, `automaticThought`, `evidence`, `counterEvidence`, `alternativeThought`
- `Journal.content`, `aiAnalysis`

```typescript
// /apps/api/src/lib/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(data: string): string {
  const [ivHex, authTagHex, encryptedHex] = data.split(':');
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return decipher.update(encryptedHex, 'hex', 'utf8') + decipher.final('utf8');
}
```

TypeORM `@BeforeInsert`, `@BeforeUpdate`, `@AfterLoad` 데코레이터로 자동 암/복호화 처리. 또는 커스텀 Column Transformer를 사용:

```typescript
const EncryptedColumn = (): PropertyDecorator =>
  Column({
    type: 'text',
    transformer: {
      to: (value: string) => (value ? encrypt(value) : value),
      from: (value: string) => (value ? decrypt(value) : value),
    },
  });
```

### 8.2 사용자 데이터 스코핑

모든 데이터 접근 쿼리에 `userId` 조건을 필수로 포함:

```typescript
// 모든 Repository의 기본 메서드
findByUser(userId: string, id: string) {
  return this.repository.findOne({ where: { id, userId } });
}
```

### 8.3 LLM API 키 관리

- API 키는 서버 환경 변수로만 관리
- 클라이언트에 절대 노출하지 않음
- LLM 호출은 반드시 서버 사이드에서만 실행

### 8.4 프롬프트 인젝션 방지

- 사용자 입력을 시스템 프롬프트와 분리
- 입력 길이 제한 (메시지당 2000자)
- 시스템 프롬프트에 역할 고수 지시 포함

### 8.5 Rate Limiting

- LLM 엔드포인트: 섹션 3.7 참조
- 일반 API: 기존 Rate Limiting 정책 유지
- 인증 실패: 5회 연속 실패 시 5분 잠금

---

## 9. 구현 순서

아래 10단계로 순차적으로 구현한다. 각 단계는 독립적으로 배포 가능하도록 설계한다.

### Phase 1: Foundation

**데이터 모델 + 마이그레이션 + 공유 상수/인터페이스**

- [ ] 18개 신규 TypeORM 엔티티 작성 (`/packages/entities`)
- [ ] 공유 인터페이스 정의 (`/packages/interfaces`) - DTO, Response 타입
- [ ] 공유 상수 추가 (`/packages/constants`) - 감정 태그, 인지 왜곡, 카테고리
- [ ] TypeORM 마이그레이션 생성 및 실행
- [ ] 암호화 유틸리티 (`/apps/api/src/lib/encryption.ts`)

### Phase 2: Onboarding

**UserProfile + UserSettings + 온보딩 API + UI**

- [ ] Onboarding API 모듈 (3개 엔드포인트)
- [ ] Settings API 모듈 (5개 엔드포인트)
- [ ] 온보딩 8단계 위저드 UI (framer-motion 전환)
- [ ] 온보딩 가드 미들웨어 (미완료 시 온보딩으로 리다이렉트)
- [ ] 하단 탭 네비게이션 레이아웃

### Phase 3: Core Recording

**감정 기록 + 일기**

- [ ] Mood API 모듈 (7개 엔드포인트)
- [ ] Journal API 모듈 (6개 엔드포인트, AI 분석 제외)
- [ ] 감정 기록 4단계 UI
- [ ] 감정 목록 + 캘린더 뷰
- [ ] 일기 작성/목록 UI (자유 일기 + 감사 일기)

### Phase 4: CBT Core

**사고 일지 9단계 위저드**

- [ ] Thought Diary API 모듈 (5개 엔드포인트)
- [ ] 9단계 위저드 UI (자동 저장, 진행 표시)
- [ ] 인지 왜곡 선택 UI (설명 툴팁)
- [ ] 사고 일지 목록/상세 뷰
- [ ] 인지 왜곡 통계 API

### Phase 5: LLM Chat

**프로바이더 추상화 + Chat API + Chat UI**

- [ ] LLM Provider 인터페이스 + Gemini 구현
- [ ] LLM Service (프로바이더 관리)
- [ ] 위기 감지 모듈
- [ ] CBT 시스템 프롬프트
- [ ] Chat API 모듈 (6개 엔드포인트, SSE 스트리밍)
- [ ] Rate Limiting 미들웨어
- [ ] 채팅 UI (SSE 스트리밍, 메시지 버블, 빠른 액션)
- [ ] Journal AI 분석 연동 (SSE)

### Phase 6: Tools

**대처 도구 + 교육 자료**

- [ ] Coping Tools API 모듈 (4개 엔드포인트)
- [ ] Education API 모듈 (5개 엔드포인트)
- [ ] 대처 도구 UI (카드 그리드 + 실행 화면)
- [ ] 호흡 운동 원형 애니메이션 (framer-motion)
- [ ] 교육 자료 목록 + 마크다운 리더 (react-markdown)
- [ ] 초기 교육 콘텐츠 시드 데이터
- [ ] 초기 대처 도구 시드 데이터

### Phase 7: Missions

**데일리 미션 + 워커 잡**

- [ ] Mission API 모듈 (5개 엔드포인트)
- [ ] 미션 카탈로그 시드 데이터
- [ ] `daily-mission-assign` 워커 잡
- [ ] `mission-reminder` 워커 잡
- [ ] 미션 UI (오늘의 미션, 히스토리)

### Phase 8: Analytics

**스트릭/배지 + 대시보드 차트**

- [ ] Analytics API 모듈 (5개 엔드포인트)
- [ ] 배지 시드 데이터
- [ ] `streak-calculate` 워커 잡
- [ ] `badge-check` 워커 잡
- [ ] 홈 대시보드 UI (Recharts)
- [ ] 분석 대시보드 UI (트렌드 차트, 배지 그리드)

### Phase 9: PWA

**서비스 워커 강화 + 매니페스트 + 설치 프롬프트**

- [ ] `manifest.json` 작성
- [ ] 서비스 워커 강화 (캐싱 전략, 오프라인 폴백)
- [ ] 설치 프롬프트 배너 컴포넌트
- [ ] 푸시 알림 워커 잡 (`mood-reminder`, `journal-reminder` 등)
- [ ] `incomplete-diary-notify` 워커 잡
- [ ] `llm-usage-aggregate` 워커 잡

### Phase 10: Polish

**모바일 UX 최적화, 알림 튜닝, 성능**

- [ ] 모바일 터치 최적화 (큰 터치 영역, 스와이프)
- [ ] 다크 모드 완성
- [ ] 애니메이션 튜닝 (성능 vs 품질)
- [ ] API 응답 최적화 (쿼리 최적화, 캐싱)
- [ ] 이미지/자산 최적화
- [ ] 에러 바운더리 + 폴백 UI
- [ ] 접근성 (a11y) 검토
- [ ] 데이터 내보내기 기능 완성
