import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Shared
import { methodGuard } from "@shared/adapters/http/middlewares/method_guard.middleware.ts";
import { HttpResponse } from "@shared/adapters/http/format/response.ts";
import { compose } from "@shared/core/compose.ts";

// Validators
import { SignUpBody } from "@local/validators";

// State
import { FunctionState } from "@local/state/index.ts";
import { selectAuthData } from "@local/state/selectors/index.ts";

// Chains
import { signUpChain } from "@local/usecases";

// 클라이언트로 부터 device_id, token hash 를 받아 인증 완료 처리 및 토큰 발급한다.
Deno.serve(
  compose<SignUpBody, unknown, FunctionState<SignUpBody>>(
    [methodGuard(["POST"]), signUpChain.toMiddleware()],
    (ctx) => {
      const { access_token, refresh_token } = selectAuthData(ctx);

      return HttpResponse.message(200, {
        access_token,
        refresh_token,
      });
    }
  )
);
