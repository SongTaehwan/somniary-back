import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Shared
import { compose } from "@shared/core/compose.ts";
import { methodGuard } from "@shared/adapters/http/middlewares/method_guard.middleware.ts";
import { HttpResponse } from "@shared/adapters/http/format/response.ts";

// Validators
import {
  type RefreshTokenBody,
  type RefreshTokenQuery,
} from "@local/validators";

// State
import { type AuthState } from "@auth/state/index.ts";
import { refreshTokenChain } from "@local/usecases";
import { State } from "@auth/state/selectors/index.ts";

Deno.serve(
  compose<
    RefreshTokenBody,
    RefreshTokenQuery,
    AuthState<RefreshTokenBody, RefreshTokenQuery>
  >([methodGuard(["POST"]), refreshTokenChain.toMiddleware()], (ctx) => {
    const auth = State.getAuthData(ctx);
    return HttpResponse.message(200, auth);
  })
);
