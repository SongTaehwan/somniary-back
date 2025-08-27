import { User } from "@supabase/supabase-js";

// Shared
import { Step } from "@shared/core/chain.ts";
import { HttpException } from "@shared/adapters/http/format/exception.ts";
import { SupabaseClient } from "@shared/infra/supabase.ts";

// Auth
import { AuthState } from "@auth/state/index.ts";

export function createGetUserStep<Body, Query>(
  supabase: SupabaseClient
): Step<{ access_token: string }, User, Body, Query, AuthState<Body, Query>> {
  return async (ctx, { access_token }) => {
    const { data, error: userError } = await supabase.auth.getUser(
      access_token
    );

    if (userError) {
      ctx.response = HttpException.badRequest(userError.message);
      throw new Error(userError.message);
    }

    const user = data.user;

    if (!user) {
      ctx.response = HttpException.notFound("user not found");
      throw new Error("user not found");
    }

    return user;
  };
}
