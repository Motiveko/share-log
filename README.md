# Turborepo Starter

## TODO

### Common

- [x] TODO LIST 추가

<br>

### API

- [x] request type validation / parse 공통화
  - 특정 타입의 body/query를 강제하고, 어길경우 400응답을 자동으로 내려주도록. controller에서는 보장된 타입만 받아야한다.
- [x] 통합 테스트 환경 구성
  - dto validation 코드 같은것도 우선 테스트코드를 통해 동작을 검증한다.
  - 이를 위해서 적절한 integration 테스트 코드 작성 모범패턴을 구축한다.
  - TODO : 테스트 db가 있는데 mock data setup 및 delete 까지 구축
- logger 개선

  - [x] winston 모듈 추가
  - [x] transporter를 선택 가능하게 변경( options 형태로, file/http/stream 추가필요, )

- [x] lint 미동작하는거 확인 및 반영
- [ ] 공통 모듈 분리
  - api도 웹도 모두 msa로 쪼개질 수있음
  - api에서 공통으로 쓸 decorator나 middlewares 같은거는 모듈분리가 필요하다. ( 이건 추후 )
- [ ] 인증 개선
  - [ ] 인증여부 검증 미들웨어
  - [ ] user info api
  - 세션 redis 적용

### web

- [x] oauth 세팅
- [x] 기본 라우팅 세팅
  - [x] layout, page 분리
  - [x] not found
  - [x] 인증 route
- [x] 상태관리 추가 (`zustand`)
- [x] zustand slice 패턴( 상태 scaling )
- [x] react-toastify 추가
  - 구현 참고해서 할 수 있으면 직접하는것도 좋아보임
- [x] tailwindcss 추가
- [x] dark / light 테마
- [x] api client 추가

- [ ] github ci/cd 테스트 자동

  - unit test
  - ui test(component / integration / e2e)
  - 테스트에 필요한 데이터를 db화 하는 방안([참고자료](https://bit.ly/4jeyMRX))

- [ ] design pattern 기반 재사용 컴포넌트
  - [ ] props collection + props getter
    - dnd 기능
  - [ ] [hoc + hoc compose](https://chatgpt.com/c/67d43fb3-64ac-800c-833c-6de59c24dd17)
    - Authorization
    - conditional rendering(loading, error)
    - analytics / logging
    - Styling/Theming
    - error boundary
    - dnd 등..
  - [ ] Compound Component
    - 이게 내가 알던거랑 좀 다르다. Context를 쓰는 컴포넌트를 말하는듯.
  - [ ] [State Reducer](https://chatgpt.com/c/67d4441e-ac48-800c-bc59-51d07c73e51e)
    - Autocomplete / Select / Dropdown
    - Step Form
    - Modal, Tooltip

### notification

- [ ] discord notification

### ui

- [x] tsup 기반으로 변경 및 ui 컴포넌트 추가
- [ ] ui 컴포넌트 npm publish 구상

  - `package.json`에 exports에 각 컴포넌트들이 들어가야하고, cjs/esm 나눠서 처리가되어야함
  - 근데 dev환경에서는 hmr을 위해서 exports의 기본이 `src/index.ts` 가 되게 했는데 이걸 import/require, types/development 이런걸로 분리하기시작하면 사용하는쪽에서 모듈 인식을 못하기 시작함.(index.ts로 참조를 못함) 이 문제는 해결 필요함

- [ ] 레이어 컴포넌트 구현
  - useLayer hooks기반으로..
  - 난 훅을 간단하게 생각했는데 gpt는 아닌듯하니 생각을 참고해보자(https://chatgpt.com/c/6899fade-7608-8322-89c5-f7fb30681d35)
- [ ] canvas 기반의 이미지 에디터 컴포넌트

### common

- [ ] 시멘틱 릴리즈 기능 추가

  - commit prefix 자동 추가 기능 찾아보기( [commitizen](https://github.com/commitizen/cz-cli) 같은거..)
  - [semantic-release](https://github.com/semantic-release/semantic-release) 적용하기
  - [changesets](https://github.com/changesets/changesets)도 찾아보고

- [ ] CI 구성

  - 패키지도 필요한건 릴리즈 가능하게
  - turborepo 쓰면 dependency-aware CI 같은것도 가능하다고 하고, 암튼 패키지별 github action을 따로 구성하는걸 목표로한다.(gpt 찾아보자)

- [ ] 모노레포 패키지 ts로 import 하도록 변경
  - package.json에 export로 추가해주면 됨
