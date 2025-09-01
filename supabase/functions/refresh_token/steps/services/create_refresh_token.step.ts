import { Step } from "@shared/core/chain.ts";
import { SupabaseClient } from "@shared/infra/supabase.ts";
import { HttpException } from "@shared/adapters/http/format/exception.ts";

// Auth
import { RouteState } from "@shared/types/state.types.ts";

export const createRefreshTokenStep = <
  Body,
  Query,
  State extends RouteState<Body, Query>
>(
  supabase: SupabaseClient
): Step<
  { refresh_token: string },
  { access_token: string; refresh_token: string },
  Body,
  Query,
  State
> => {
  return async (ctx, { refresh_token }) => {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      ctx.response = HttpException.badRequest(error.message);
      throw error;
    }

    if (!data.session) {
      ctx.response = HttpException.internalError("Failed to refresh token");
      throw new Error("Failed to refresh token");
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  };
};
