## 아키텍처 개요

### 객체 역할

- **State**: 요청 수명주기 동안 공유되는 컨텍스트 저장소
  - 공통 입력: `/_shared/state/types.ts`, `/_shared/state/index.ts`
    - `RouteState<Body>`에 `headers`, `query`, `body` 저장
    - `State.setInput/getInput`로 접근
  - 도메인 확장: `/auth-verify/state/types.ts`, `/auth-verify/state/index.ts`
    - `FunctionState<T>`에 기능별 슬롯(예: `otp_data`, `auth_data`)
    - `State.setOtpData/getOtpData`, `State.setAuthData/getAuthData`

- **Selector**: `State`에 대한 읽기 전용 접근자(검증·형변환 캡슐화)
  - 공용: `/_shared/selectors/selectors.ts` → `selectInputBody<T>(ctx)`
  - 도메인: `/auth-verify/selectors/selectors.ts` → `selectTokenHash(ctx)`, `selectDeviceIdWithTokens(ctx)`

- **Step**: 체인에서 합성되는 순수(지향) 도메인 로직 유닛
  - 타입: `Step<In, Out, Body, State>` (`/_shared/utils/inject.ts`)
  - 예시:
    - `parseInputStep(validate)`: 입력 파싱·검증 → `Input<T>` 산출
    - `verifyOtp(supabase)`: `string → AuthTokens`
    - `issueJwtWithDeviceId`: `{ device_id; access_token; refresh_token } → AuthTokens`

- **Middleware**: `compose`로 실행되는 요청 처리 유닛(응답 설정 시 단락)
  - 예시: `methodGuard(["POST"])`, `chain(...).toMiddleware()`

- **Compose**: `/_shared/utils/compose.ts`
  - 미들웨어 순차 실행, `ctx.response` 감지 시 즉시 반환
  - 예외를 `HttpException.internalError`로 변환

- **ChainBuilder (Fluent)**: `/_shared/utils/inject.ts`
  - `chain(first).then(step).tap(sideEffect).reselect(selector).toMiddleware()`
  - `then`: 이전 결과(Acc)를 다음 단계 인풋으로 안전 전달
  - `tap`: 값 유지하며 부수효과 실행(예: 상태 저장). 인자 함수는 `Promise<void> | void` 시그니처만 허용되어 변환 불가(타입 안전)
  - `reselect`: 이전 값 무시, 컨텍스트에서 새 값 선택

- **Validator**: `/auth-verify/validators/validator.ts`
  - `zod` 스키마 기반 검증, 반환 타입은 스키마에서 자동 추론

- **Error**: `/_shared/error/exception.ts`, `/_shared/error/constant.ts`
  - 일관된 JSON 에러 응답(`HttpException.badRequest/unauthorized/...`)
  - 컴포저/체인에서 예외를 잡아 단락 처리

### 요청 흐름 예시(`auth-verify`)

```ts
// 1) 메서드 가드
methodGuard(["POST"]) // → 미들웨어

// 2) 입력 검증 및 토큰 해시 추출(체인 1)
chain<AuthVerifyInput, FunctionState<AuthVerifyInput>, Input<AuthVerifyInput>>(
  parseInputStep(validateInput)
)
  .then(selectTokenHash)
  .toMiddleware()

// 3) OTP 검증 → 디바이스 바인딩 → 최종 토큰 발급(체인 2)
chain<AuthVerifyInput, FunctionState<AuthVerifyInput>, string>((ctx) => selectTokenHash(ctx))
  .then(verifyOtp(supabase))                        // string → AuthTokens
  .then((tokens, ctx) => State.setOtpData(ctx, tokens)) // 부수효과 저장
  .reselect(selectDeviceIdWithTokens)               // ctx → { device_id; access; refresh }
  .then(issueJwtWithDeviceId)                       // → AuthTokens(재서명)
  .tap((auth, ctx) => State.setAuthData(ctx, auth)) // 최종 저장
  .toMiddleware()

// 4) 핸들러: `State.getAuthData(ctx)`로 응답 생성
```

### 설계 원칙

- **입력 중앙화**: 파싱·검증은 앞단 스텝/미들웨어 한 곳에서 처리
- **상태 캡슐화**: 쓰기는 헬퍼로 제한, 읽기는 셀렉터로만
- **합성 우선**: 단계별 로직을 작은 `Step`으로 쪼개어 체인으로 합성
- **단락 일관성**: 어디서든 `ctx.response` 설정 시 즉시 반환, 예외는 공통 포맷

### 사이드 이펙트 규칙 및 디렉토리 구조

- **Side Effect 타입 안전**
  - `tap((value, ctx) => Promise<void> | void)` 형태만 허용되어, 값 변환 없이 부수효과만 수행
  - 변환이 필요한 경우는 반드시 `then(step)`으로 구현하여 입력/출력 타입이 연결되도록 유지

- **디렉토리 구성 권장**
  - 변환 스텝: `feature/steps/` (예: `verify_otp.step.ts`, `issue_jwt_with_device_id.ts`)
  - 사이드 이펙트 스텝: `feature/steps/effects/` (예: `save_otp_data.effect.ts`, `log_auth_issued.effect.ts`)
  - 체인에서 역할이 명확하도록 네이밍 가이드: 변환은 `*.step.ts`, 부수효과는 `*.effect.ts`
