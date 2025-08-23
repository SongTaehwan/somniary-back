import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Shared
import { compose } from "@shared/core/compose.ts";
import { methodGuard } from "@shared/adapters/http/middlewares/method_guard.middleware.ts";
import { HttpResponse } from "@shared/adapters/http/format/response.ts";

// Validators
import { type SignOutBody, type SignOutQuery } from "@local/validators";

// State
import { type FunctionState } from "@local/state";
import { signOutChain } from "@local/usecases";

Deno.serve(
  compose<SignOutBody, SignOutQuery, FunctionState<SignOutBody, SignOutQuery>>(
    [methodGuard(["POST"]), signOutChain.toMiddleware()],
    (_ctx) => {
      return HttpResponse.message(200, { message: "success" });
    }
  )
);
