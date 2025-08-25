import { SupabaseClient } from "jsr:@supabase/supabase-js";

import { Token } from "@shared/adapters/http/steps/extract_jwt_from_request.step.ts";
import { Step } from "@shared/core/chain.ts";
import { FunctionState } from "@local/state";
import { HttpException } from "@shared/adapters/http/format/exception.ts";

export const expireTokenStep = (
  supabase: SupabaseClient
): Step<Token, void, unknown, unknown, FunctionState<unknown>> => {
  return async (ctx, { token }) => {
    const result = await supabase.auth.admin.signOut(token, "local");

    if (result.error) {
      ctx.response = HttpException.internalError("Failed to expire token");
      throw result.error;
    }

    return;
  };
};
