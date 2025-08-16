import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { supabase } from "../_shared/client.ts";
import { methodGuard } from "../_shared/middlewares/method_guard.middleware.ts";
import { parseInputStep } from "../_shared/steps/parse_input.step.ts";
import { CONTENT_TYPES } from "../_shared/error/constant.ts";
import { compose } from "../_shared/utils/compose.ts";
import { chain } from "../_shared/utils/inject.ts";

import { AuthVerifyInput, validateInput } from "./validators/validator.ts";
import { verifyOtp } from "./steps/verify_otp.step.ts";
import { FunctionState } from "./state/types.ts";

import { resignJwtWithDeviceId } from "./steps/resign_jwt_with_device_id.step.ts";
import { State } from "./state/index.ts";
import { Input } from "../_shared/state/types.ts";
import { selectTokenHash } from "./steps/select_token_hash.step.ts";
import { storeInput } from "./steps/effects/store_input.effect.ts";
import { selectDeviceIdWithTokens } from "./steps/select_device_id_with_tokens.step.ts";
import { storeAuth } from "./steps/effects/store_auth.effect.ts";

// 클라이언트로 부터 device_id, token hash 를 받아 인증 완료 처리 및 토큰 발급한다.

// 1. 앱에서 POST 요청 시 device_id, token hash 를 받는다.
const requestInputParsingChain = chain<
  AuthVerifyInput,
  FunctionState<AuthVerifyInput>,
  Input<AuthVerifyInput>
>(parseInputStep(validateInput)).tap(storeInput);

// 2. 토큰 해시 검증 및 토큰 발급한다.
const authVerifyChain = requestInputParsingChain
  .then(selectTokenHash)
  .then(verifyOtp(supabase))

// 3. device_sessions 레코드 추가
// TODO: 레코드 추가
const deviceSessionChain = authVerifyChain
  .then(selectDeviceIdWithTokens)

// 4. JWT claim 을 추가한다.
// 5. 엑세스 토큰 & 리프레시 토큰 반환
const tokenResignChain = deviceSessionChain
  .then(resignJwtWithDeviceId)
  .tap(storeAuth);

Deno.serve(
  compose<AuthVerifyInput, FunctionState<AuthVerifyInput>>(
    [
      methodGuard(["POST"]),
      tokenResignChain.toMiddleware(),
    ],
    (ctx) => {
      const authData = State.getAuthData(ctx);

      return new Response(
        JSON.stringify({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
        }),
        {
          headers: { "Content-Type": CONTENT_TYPES.JSON },
        }
      );
    }
  )
);
