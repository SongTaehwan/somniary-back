import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Shared
import { methodGuard } from "@shared/adapters/http/middlewares/method_guard.middleware.ts";
import { HttpResponse } from "@shared/adapters/http/format/response.ts";
import { compose } from "@shared/core/compose.ts";

// Validators
import { type SignUpBody } from "@local/validators";

// Auth
import { retrieveAuthDataStep } from "@auth/steps/rules/retrieve_auth_data.step.ts";

// Chains
import { signUpChain } from "@local/usecases";
import { type AuthState } from "@auth/state/index.ts";

// 클라이언트로 부터 device_id, token hash 를 받아 인증 완료 처리 및 토큰 발급한다.
Deno.serve(
  compose<SignUpBody, unknown, AuthState<SignUpBody>>(
    [methodGuard(["POST"]), signUpChain.toMiddleware()],
    (ctx) => {
      const { access_token, refresh_token } = retrieveAuthDataStep(ctx);

      return HttpResponse.message(200, {
        access_token,
        refresh_token,
      });
    }
  )
);
