import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { supabase } from "../_shared/client.ts";
import { methodGuard } from "../_shared/middlewares/method.guard.ts";
import { parseInput } from "../_shared/middlewares/parse_input.ts";
import { CONTENT_TYPES } from "../_shared/error/constant.ts";
import { compose } from "../_shared/utils/compose.ts";
import { chain } from "../_shared/utils/inject.ts";

import { AuthVerifyInput, validateInput } from "./validators/validator.ts";
import { verifyOtp } from "./middlewares/verify_otp.ts";
import { FunctionState } from "./state/types.ts";
import { selectDeviceIdWithTokens, selectTokenHash } from "./selectors/selectors.ts";
import { issueJwtWithDeviceId } from "./middlewares/issue_jwt_with_device_id.ts";
import { State } from "./state/index.ts";

// 클라이언트로 부터 device_id, token hash 를 받아 인증 완료 처리 및 토큰 발급한다.
// 1. 앱에서 POST 요청 시 device_id, token hash 를 받는다.
// 2. 토큰 해시 검증 및 토큰 발급한다.
// 3. JWT claim 을 추가한다.
// 4. device_sessions 레코드 추가
// 5. 엑세스 토큰 & 리프레시 토큰 반환
// 6. 함수 종료

Deno.serve(
  compose<AuthVerifyInput, FunctionState<AuthVerifyInput>>(
    [
      methodGuard(["POST"]),
      parseInput(validateInput),
      chain<AuthVerifyInput, FunctionState<AuthVerifyInput>, string>((ctx) => selectTokenHash(ctx))
        .then(verifyOtp(supabase))
        .then((tokens, ctx) => State.setOtpData(ctx, tokens))
        .reselect(selectDeviceIdWithTokens)
        .then(issueJwtWithDeviceId)
        .tap((auth, ctx) => State.setAuthData(ctx, auth))
        .toMiddleware(),
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
