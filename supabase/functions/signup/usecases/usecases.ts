// Shared
import { supabase } from "@shared/infra/supabase.ts";
import { parseInputStep } from "@shared/adapters/http/steps/parse_input.step.ts";
import { chain } from "@shared/core/chain.ts";

// Types
import { Input } from "@shared/types/state.types.ts";

// Steps
import { verifyOtp } from "@local/steps/services/verify_otp.step.ts";
import { resignJwtWithDeviceIdStep } from "@local/steps/services/resign_jwt_with_device_id.step.ts";
import { storeInput } from "@local/steps/effects/store_input.effect.ts";
import { storeAuth } from "@local/steps/effects/store_auth.effect.ts";

// Domain
import { selectTokenHash } from "@local/steps/rules/select_token_hash.step.ts";
import { selectDeviceIdWithTokens } from "@local/steps/rules/select_device_id_with_tokens.step.ts";

// Validators
import { AuthVerifyInput, validateInput } from "@local/validators/validator.ts";
import { FunctionState } from "@local/state/state.types.ts";
import { createJwtDependencies } from "@auth/utils/jwt.ts";

// 클라이언트로 부터 device_id, token hash 를 받아 인증 완료 처리 및 토큰 발급한다.

// 1. 앱에서 POST 요청 시 device_id, token hash 를 받는다.
const requestInputParsingChain = chain<
  AuthVerifyInput,
  unknown,
  FunctionState<AuthVerifyInput>,
  Input<AuthVerifyInput>
>(
  parseInputStep({
    bodyParser: validateInput,
  })
).tap(storeInput);

// 2. 토큰 해시 검증 및 토큰 발급한다.
const authVerifyChain = requestInputParsingChain
  .then(selectTokenHash)
  .then(verifyOtp(supabase));

// 3. device_sessions 레코드 추가
// TODO: 레코드 추가
const deviceSessionChain = authVerifyChain.then(selectDeviceIdWithTokens);

// 4. JWT claim 을 추가한다.
// 5. 엑세스 토큰 & 리프레시 토큰 반환
export const tokenResignChain = deviceSessionChain
  .then(
    resignJwtWithDeviceIdStep(
      createJwtDependencies(Deno.env.get("JWT_SECRET") ?? "")
    )
  )
  .tap(storeAuth);
