import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Shared
import { methodGuard } from "../_modules/shared/middlewares/method_guard.middleware.ts";
import { CONTENT_TYPES } from "../_modules/shared/error/constant.ts";
import { compose } from "../_modules/shared/composer/compose.ts";

// Validators
import { AuthVerifyInput } from "./validators/validator.ts";

// State
import { FunctionState } from "./state/types.ts";
import { State } from "./state/index.ts";

// Chains
import { tokenResignChain } from "./chains/chains.ts";

// 클라이언트로 부터 device_id, token hash 를 받아 인증 완료 처리 및 토큰 발급한다.
Deno.serve(
  compose<AuthVerifyInput, FunctionState<AuthVerifyInput>>(
    [methodGuard(["POST"]), tokenResignChain.toMiddleware()],
    (ctx) => {
      const { access_token, refresh_token } = State.getAuthData(ctx);

      return new Response(
        JSON.stringify({
          access_token,
          refresh_token,
        }),
        {
          headers: { "Content-Type": CONTENT_TYPES.JSON },
        }
      );
    }
  )
);
