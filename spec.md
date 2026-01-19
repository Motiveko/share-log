
Share-Log 라는 서비스를 만들려고 해. 기능명세서를 정리하려고 하는데, 만들려는 서비스는 아래와 같이 정의할 수 있어.

## 1. 기본 컨셉
- Share Log는 하나의 가계부를 초대 기반으로 모인 여러 사람과 공유해서 사용할 수 있는 서비스.
- 유저가 하나의 가계부(workspace)를 생성하면, 검색을 통해 유저를 초대할 수 있음.
	- 가계부는 workspace라고 정의한다.
- 초대받은 유저와 함께 가계부를 작성하고 워크스페이스 대시보드 통해서 지출/수입 내역을 확인 가능하다.
	- 하나의 지출/수입은 Log라고 정의한다.
- Log의 수단/카테고리는 사용자가 직접 추가/수정/삭제가 가능하다.

## 2. 지원 환경
- PC 브라우저
- 추후지원
	- MW 브라우저(반응형이 아닌 별도 서비스로 제공)

## 3. 페이지 구성
- 로그인 전
	- 로그인 페이지 (/login)
- 로그인 후
	- 웰컴 페이지 (/welcome)
	- 프로필 (/profile)
	- 빈 워크스페이스(/workspace/empty)
	- 워크스페이스 생성(/workspace/new)
	- 워크스페이스 대시보드 (/workspace/:id)
	- 워크스페이스 설정(/workspace/:id/setting)
		- Log의 수단/카테고리 관리
		- 사용자 초대/추방
		- 알람 설정(사용자 개인별 설정)
	- 정산 
		- 정산 목록 (/workspace/:id/adjustment)
		- 정산 생성 (/workspace/:id/adjustment/new)
		- 정산 상세 (/workspace/:id/adjustment/:id)
		- 정산 수정 (/workspace/:id/adjustment/:id?update)
			- TODO : ?update 쿼리를 이용한 방식을 고려했으나 더 범용적인 방안이 있다면 변경

## 4. 도메인별 기능 구성
### 4.1 회원
- 유저 정보는 아래와 같은 정보를 가지고 있다.
	- id
	- 닉네임
	- 이메일 주소
	- 프로필 사진
- 유저는 웹푸시 알림을 위한 정보도 가지고 있다.
- 로그인/회원가입은 구글로그인으로 대체한다.
- 회원가입 후 닉네임이 미설정 상태로, 닉네임을 설정할 수 있는 /welcome 페이지로 랜딩된다.
	- 미설정 상태로 다시 접속시 /welcome 페이지로 랜딩한다.
- 워크스페이스에 회원 초대시 검색은 닉네임/이메일 주소 모두 사용하여 검색한다.

### 4.2 워크스페이스
- 워크스페이스는 여러 사람이 공동 작업하는 공유 가계부 1개를 의미한다.
- 워크스페이스는 아래와 같은 정보를 가지고있다.
	- id
	- 이름
	- 썸네일 이미지(optional)
	- 배너 이미지(optional)
	- 참여 유저 목록
		- 유저 id
		- 초대 상태(초대중, 수락, 거부, 추방)
		- 권한(Master, Member)
	- 초대(invitation)
	- 지출/수입 Log
		- id
		- 타입(지출/수입)
		- Log의 수단(e.g. 체크카드/신용카드/현금 )
		- Log의 카테고리
		- 날짜
		- 금액
		- 메모
		- 유저
	- 정산(adjustment)
		- id
		- 기간
		- 이름
		- 카테고리(특정 기간동안 정산할 지출 Log의 카테고리, 최소 1개)
		- 상태(생성됨, 정산 완료됨)
		- 정산 참여자 목록 (유저 id 리스트)
		- 정산 결과(adjustment_result)
			- 총 지출 금액
			- 1인당 부담 금액 (균등 분할)
			- 개인별 지출 금액
			- 송금 정보 리스트
				- 송금자 유저 id
				- 수취자 유저 id
				- 송금 금액
	- Log 카테고리
		- id
		- 카테고리명
	- Log 수단
		- id
		- 타입
			- 기본 제공값 (신용카드, 체크카드, 현금)
			- 사용자 입력값 (문자열)
		- 이름
	- 알림설정
		- id
		- 유저 id
		- 타입
			- Log추가, Log삭제, 정산생성, 정산완료 등(추후 추가될 수 있음)
			- 복수선택 가능

### 4.3 초대(invitation)
- 초대는 개별 워크스페이스에 다른 유저를 초대하는 기능이다.
- 초대는 아래 정보를 가지고 있다.
	- id
	- 워크스페이스 id
	- 초대할 유저의 email 주소
	- email 발송 여부
	- 초대 상태(초대중, 초대거부, 초대취소, 초대완료)



## 5. 페이지별 기능
### 5.1 로그인 (/login)
- 사용자가 로그인하지 않은 상태로 페이지 접근시 무조건 로그인 페이지로 이동한다.
- 로그인 페이지의 가운데에는 구글 로그인 버튼이 노출된다.
- 구글 로그인 버튼 클릭시 구글 oauth 페이지로 랜딩되면서, 로그인을 한다.

### 5.2 웰컴 (/welcome)
- 웰컴 페이지에서는 사용자 정보를 입력받을 수 있다. 입력받고 나면 빈 워크스페이스 페이지(/workspace/empty)로 이동한다.
- 입력받는 정보는 아래와 같다
	- 닉네임(필수값)
	- 프로필사진
	- slack 웹 훅 주소

- 최초 로그인(가입)후 사용자 정보를 입력받지 않은 상태라면 무조건 웰컴 페이지로 랜딩된다.

### 5.3 빈 워크스페이스 (/workspace/empty)
- 사용자는 아래의 경우 빈 워크스페이스 페이지로 이동한다.
	- 로그인 완료
	- 웰컴 페이지에서 사용자 정보 입력 완료
	- 생성한 워크스페이스 없음
- 빈 워크스페이스에는 유저 상태에 따라 아래 정보가 노출된다.
	- 현재 초대받은 상태의 워크스페이스가 있는 경우 - 초대 정보와 수락/거절 버튼이 노출된다.
	- 현재 초대받은 상태의 워크스페이스가 없는 경우 - 워크스페이스 생성 버튼이 노출된다.



### 5.4 워크스페이스 생성 (/workspace/new)
- 워크스페이스 생성시 아래 정보를 입력받는다.
	- 이름
	- 썸네일 이미지
	- 배너 이미지
	- 초대할 이메일 주소 추가
- 워크스페이스 생성이 완료되면 생성한 워크스페이스 대시보드 페이지로 이동한다


### 5.5 워크스페이스 대시보드 (/workspace/:id)
- 사용자가 /, /workspace, /workspace/empty, /login 페이지로 접근한 경우, 마지막으로 방문했던 워크스페이스의 대시보드 페이지로 이동한다.
- /workspace/:id 로 이동한 경우 해당 워크스페이스 대시보드를 보여주고, 마지막 방문했던 워크스페이스 페이지를 갱신한다.
- 마지막 방문 워크스페이스는 서버에서 redis에 저장한다.
- 마지막 방문 워크스페이스를 알 수 없는 경우, 가장 최근에 생성한 workspace로 이동한다.
- 워크스페이스 페이에는 아래와 같은 정보가 보여진다.
	- 좌측
		- LNB
			- LNB 최상단에는 유저정보, 현재 워크스페이스 이름이 보인다.
			- LNB의 유저정보 아래에는 워크스페이스 목록이 보인다. 워크스페이스 이름과 썸네일이 보인다.
				- 현재 워크스페이스 외의 다른 워크스페이스 클릭시 해당 워크스페이스 대시보드로 이동한다.
			- 워크스페이스 목록 아래에는 현재 워크스페이스의 정산목록이 보인다.
				- 정산목록 클릭시 정산 상세 페이지로 이동한다.
			- LNB의 하단에는 워크스페이스 설정버튼, 프로필버튼, 로그아웃버튼이 보인다.
	- 컨텐츠 영역
		- 상단 필터영역
			- 기간 셀렉터, 기본적으로 현재 달(1일부터 말일)
				- 클릭시 기본적으로 월 단위 셀렉트가 제공되고 기간설정시 임의의 기간을 설정 가능하다.
			- 그 외 필터(중복 선택 가능한 형태, 복수개일경우 AND로 동작)
				- 추가된 사용자
				- 추가된 수단
				- 추가된 카테고리
		- 날짜 셀렉터에 의해 동적으로 변하는 컴포넌트들
			- 컴포넌트는 사각형으로 분리되어있다.
			- 선택 기간의 일자별 Log 그래프(선 차트, 지출/수입 각각 별도 선)
			- 선택 기간의 수단별 Log 그래프(파이 차트)
				- Log 수단 관리 버튼 제공
			- 선택 기간의 카테고리별 지출/수입 (파이 차트)
				- 카테고리 관리 버튼 제공
			- 선택 기간의 Log 내용(최신순부터 역순으로, 무한 스크롤 적용)
				- Log 추가 버튼
					- Log 추가는 Dialog에 폼을 입력받아서 추가한다.
					- Log 추가/수정 모두 동일한 형태의 Dialog를 공유한다.
				- Log에 휴지통 버튼으로 삭제 제공(confirm으로 동작)
				- Log 수정 버튼 제공
			- 선택 기간의 사용자별 Log 표
			- 선택 기간에 걸쳐있는 정산의 결과표
		- 우측 하단에 유틸 버튼
			- Log 추가
			- 사용자 초대
			- 정산 생성

### 5.6 워크스페이스 설정 (/workspace/:id/setting)
- 현재 워크스페이스에 대한 설정을 할 수 있는 페이지로, 아래와 같은 정보가 노출된다.
	- Log의 수단/카테고리 관리
	- 사용자 관리
		- 초대/추방
			- 추방은 Master에게만 노출되고 사용 가능한 기능이다.
		- 권한 관리
			- 사용자의 권한을 Master/Member 로 변경 가능하다.
			- 권한 관리는 Master에게만 노출되고 사용 가능한 기능이다.

		- 개인의 알림 설정
			- 설정 페이지 접근시 유저별로 자신의 알림 설정이 가능하다.
			- 알림 설정은 워크스페이스에 어떤 액션이 발생했을 때 알림을 받을지에 대한 정의이다.
			- 알림 발송은 웹 푸시를 사용한다. 사용자가 원하는 다양한 형태(개인 slack webhook등)으로 확장도 가능하다.
			- 알림 발생 액션은 아래와 같다.(추후 추가 가능)
				- Log 추가
				- Log 삭제
				- 권한 변경
				- 새로운 정산 생성
				- 정산 완료
					- 정산

	- 워크스페이스 삭제
		- 워크스페이스 삭제는 Master만 가능하다.

### 5.7 정산 목록 (/workspace/:id/adjustment)
- 현재 워크스페이스의 정산 목록을 볼 수 있는 페이지로 아래와 같은 정보가 노출된다.		
	- 정산 목록
		- 정산 내역을 수정/삭제할 수 있는 버튼 존재
		- 수정 버튼 클릭시 정산 수정 페이지로 이동
	- 정산 생성 버튼
		- 클릭시 정산 생성페이지로 이동

### 5.8 정산 생성 (/workspace/:id/adjustment/new)
- 새로운 정산을 만들 수 있는 페이지, 폼 입력을 받는다. 입력값은 대략 아래와 같다
	- 정산 기간
	- 정산 카테고리
		- 복수선택 가능
		- optional, 없으면 전체
	- 정산 결재
		- 복수선택 가능
		- optional, 없으면 전체
	- 정산인원
		- 복수선택 가능
		- optional, 없으면 워크스페이스 참여자 전체

### 5.9 정산 상세 (/workspace/:id/adjustment/:adjustmentId)
- 정산의 상세 정보를 확인할 수 있는 페이지로 아래와 같은 정보가 노출된다.
	- 정산 기본 정보 (이름, 기간, 상태)
	- 정산 대상 카테고리/수단 목록
	- 정산 참여자 목록
	- 정산 결과
		- 총 지출 금액
		- 1인당 부담 금액
		- 개인별 지출 금액 표
		- 송금 안내 (누가 누구에게 얼마를 보내야 하는지)
	- 정산 완료 버튼 (상태가 "생성됨"일 때만 노출)
	- 수정/삭제 버튼

### 5.10 정산 수정 (/workspace/:id/adjustment/:adjustmentId?update)
- 기존 정산을 수정할 수 있는 페이지
- 정산 생성 페이지(5.8)와 동일한 폼 구조를 사용
- 기존 정산 정보가 폼에 미리 채워져 있음
- 상태가 "정산 완료됨"인 경우 수정 불가

### 5.11 프로필 (/profile)
- 사용자 본인의 프로필 정보를 확인/수정할 수 있는 페이지
	- 닉네임 수정
	- 프로필 사진 수정
	- 이메일 주소 (읽기 전용, Google OAuth에서 제공)
	- Slack 웹훅 주소 수정
- 웹 푸시 알림 설정
	- 브라우저 알림 권한 요청/해제
- 계정 탈퇴 버튼

## 6. API 엔드포인트 (참고용)
### 6.1 인증
- POST /auth/google - Google OAuth 로그인
- POST /auth/logout - 로그아웃
- GET /auth/me - 현재 사용자 정보

### 6.2 사용자
- GET /users/search - 사용자 검색 (닉네임/이메일)
- PATCH /users/me - 사용자 정보 수정
- DELETE /users/me - 회원 탈퇴

### 6.3 워크스페이스
- POST /workspaces - 워크스페이스 생성
- GET /workspaces - 내 워크스페이스 목록
- GET /workspaces/:id - 워크스페이스 상세
- PATCH /workspaces/:id - 워크스페이스 수정
- DELETE /workspaces/:id - 워크스페이스 삭제
- GET /workspaces/:id/members - 멤버 목록
- PATCH /workspaces/:id/members/:userId - 멤버 권한 변경
- DELETE /workspaces/:id/members/:userId - 멤버 추방

### 6.4 초대
- POST /workspaces/:id/invitations - 초대 생성
- GET /invitations - 내가 받은 초대 목록
- PATCH /invitations/:id - 초대 수락/거절

### 6.5 Log
- POST /workspaces/:id/logs - Log 생성
- GET /workspaces/:id/logs - Log 목록 (필터/페이지네이션)
- PATCH /workspaces/:id/logs/:logId - Log 수정
- DELETE /workspaces/:id/logs/:logId - Log 삭제

### 6.6 카테고리/수단
- GET /workspaces/:id/categories - 카테고리 목록
- POST /workspaces/:id/categories - 카테고리 생성
- PATCH /workspaces/:id/categories/:categoryId - 카테고리 수정
- DELETE /workspaces/:id/categories/:categoryId - 카테고리 삭제
- GET /workspaces/:id/methods - 수단 목록
- POST /workspaces/:id/methods - 수단 생성
- PATCH /workspaces/:id/methods/:methodId - 수단 수정
- DELETE /workspaces/:id/methods/:methodId - 수단 삭제

### 6.7 정산
- POST /workspaces/:id/adjustments - 정산 생성
- GET /workspaces/:id/adjustments - 정산 목록
- GET /workspaces/:id/adjustments/:adjustmentId - 정산 상세
- PATCH /workspaces/:id/adjustments/:adjustmentId - 정산 수정
- DELETE /workspaces/:id/adjustments/:adjustmentId - 정산 삭제
- POST /workspaces/:id/adjustments/:adjustmentId/complete - 정산 완료 처리

### 6.8 알림 설정
- GET /workspaces/:id/notification-settings - 내 알림 설정 조회
- PATCH /workspaces/:id/notification-settings - 내 알림 설정 수정

### 6.9 통계/대시보드
- GET /workspaces/:id/stats - 대시보드 통계 데이터 (기간 필터)
