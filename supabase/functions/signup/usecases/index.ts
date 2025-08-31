// Shared
import { chain } from "@shared/core/chain.ts";
import { supabase } from "@shared/infra/supabase.ts";
import { AppConfig } from "@shared/utils/config.ts";
import { selectRequestBodyStep } from "@shared/adapters/http/steps/select_request_input.step.ts";
import { parseInputStep } from "@shared/adapters/http/steps/parse_input.step.ts";

// Types
import { type Input } from "@shared/types/state.types.ts";
import { type AuthState } from "@auth/state/index.ts";

// Steps
import { createVerifyOtpStep } from "@local/steps/services/create_verify_otp.step.ts";
import { storeInput } from "@local/steps/effects/store_input.effect.ts";
import { createGetUserStep } from "@local/steps/services/create_get_user.step.ts";

// Auth
import { createResignJwtWithClaimsStep } from "@auth/steps/services/create_resign_jwt_with_claims.step.ts";
import { storeAuthDataStep } from "@auth/steps/rules/store_auth_data.step.ts";
import { retrieveAuthDataStep } from "@auth/steps/rules/retrieve_auth_data.step.ts";
import { createJwtDependencies } from "@auth/utils/jwt.ts";

// Validators
import { type SignUpBody, validateInput } from "@local/validators";
import { createSignupProcessor } from "../steps/services/create_signup.processor.ts";

// TODO: 단계별 실패 시 롤백 전략 추가
// TODO: - 체인 전체, 부분 실패 시 에러 처리
// TODO: DIP 원칙 적용(supabase client)
// TODO: 테스트 코드 작성
// TODO: 원자성 보장
// TODO: 동시성 문제 해결(동시 체크)
// - 데이터베이스 레벨에서의 idempotency 적용하여 동시 요청 문제 처리 + 클라이언트 차원의 중복 요청 처리

// 클라이언트로 부터 device_id, otp_token 등을 받아 인증 완료 처리 및 토큰 발급한다.
// 1. 앱에서 POST 요청 시 body 를 파싱하고 공유 상태에 저장한다.
const parseRequestInput = chain<
  SignUpBody,
  unknown,
  AuthState<SignUpBody>,
  Input<SignUpBody>
>(
  parseInputStep({
    bodyParser: validateInput,
  }),
  {
    debugMode: AppConfig.isDevelopment,
    debugLabel: "signup_chain",
  }
)
  // 공유 상태에 body 정보 저장
  .tap(storeInput, "store_input_step");
// TODO: 멱등키를 적용해 중복 요청 방지

// 2. 사용자 인증 처리 및 토큰 발급
const verifyOtpToken = parseRequestInput
  .then(selectRequestBodyStep, "select_input_body_step")
  // INFO: 멱등키를 적용하면 1회성 토큰의 중복 요청 방지됨
  // - 이후 작업의 실패로 토큰 재사용 불가 시 클라이언트단에서 토큰 재발급 시도하도록 유도
  .then(createVerifyOtpStep(supabase), "create_verify_otp_step")
  .tap(storeAuthDataStep, "store_auth_data_step");

// 3. 회원 가입 처리
const processSignUp = verifyOtpToken
  .then(createGetUserStep(supabase), "create_get_user_step")
  .then(createSignupProcessor(supabase), "create_signup_processor");

// 4. JWT 토큰 재서명 - device_id, session_id 추가
const processTokenSigning = processSignUp
  // 4.1 JWT 토큰 재서명을 위한 데이터 구성
  .zipWith(
    retrieveAuthDataStep,
    (previousStep, currentStep) => {
      return {
        device_session_id: previousStep.deviceSession.session_id,
        device_id: previousStep.deviceSession.device_id,
        access_token: currentStep.access_token,
        refresh_token: currentStep.refresh_token,
      };
    },
    "prepare_token_signing_data"
  )
  .lazyThen(
    (_ctx, _input) =>
      createResignJwtWithClaimsStep(
        createJwtDependencies(AppConfig.getJwtSecret())
      ),
    "process_token_signing"
  )
  // 4.2 엑세스 토큰 & 리프레시 토큰 저장 및 반환
  .tap(storeAuthDataStep, "store_auth_data_step");

export const signUpChain = processTokenSigning;
