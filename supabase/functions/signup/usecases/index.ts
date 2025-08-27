// Shared
import { chain } from "@shared/core/chain.ts";
import { supabase } from "@shared/infra/supabase.ts";
import { AppConfig } from "@shared/utils/config.ts";
import { selectInputBody } from "@shared/state/selectors/index.ts";
import { parseInputStep } from "@shared/adapters/http/steps/parse_input.step.ts";

// Types
import { type Input } from "@shared/types/state.types.ts";

// Steps
import { createVerifyOtpStep } from "../steps/services/create_verify_otp.step.ts";
import { storeInput } from "@local/steps/effects/store_input.effect.ts";

// Auth
import { createResignJwtWithDeviceIdStep } from "@auth/steps/services/create_resign_jwt_with_device_id.step.ts";
import { storeAuthData } from "@auth/steps/rules/store_auth_data.ts";
import { type AuthState } from "@auth/state/index.ts";
import { createJwtDependencies } from "@auth/utils/jwt.ts";

// Validators
import { type SignUpBody, validateInput } from "@local/validators";
import { createDeviceSessionStep } from "../steps/services/create_device_session.step.ts";
import { createGetUserStep } from "../steps/services/create_get_user.step.ts";

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

// 2. 사용자 인증 처리 및 토큰 발급
const verifyOtpToken = parseRequestInput
  .then(selectInputBody, "select_input_body_step")
  .then(createVerifyOtpStep(supabase), "create_verify_otp_step");

// 3. device_id 를 JWT claim 에 추가하고 공유 상태에 저장한다.
const resignJwtWithDeviceId = verifyOtpToken
  // 3.1 JWT 토큰 재서명을 위한 데이터 구성
  .zipWith(
    selectInputBody,
    (tokens, body) => ({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      device_id: body.device_id,
    }),
    "resign_jwt_with_device_id_step_input"
  )
  .lazyThen(
    (_ctx, _input) =>
      createResignJwtWithDeviceIdStep(
        createJwtDependencies(AppConfig.getJwtSecret())
      ),
    "resign_jwt_with_device_id_step"
  )
  // 4. 엑세스 토큰 & 리프레시 토큰 저장 및 반환
  .tap(storeAuthData, "store_auth_data_step");

const insertDeviceSession = resignJwtWithDeviceId
  // 5. 사용자 id 조회 & 반환
  .then(createGetUserStep(supabase), "create_get_user_step")
  .zipWith(
    selectInputBody,
    // 디바이스 세션 테이블 삽입을 위한 데이터 구성
    (user, body) => ({
      user_id: user.id,
      platform: body.platform,
      device_id: body.device_id,
    }),
    "create_device_session_data_step_input"
  )
  // 6. device_sessions 레코드 생성
  .then(createDeviceSessionStep(supabase), "create_device_session_step");

export const signUpChain = insertDeviceSession;
