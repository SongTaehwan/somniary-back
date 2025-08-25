import { Step } from "@shared/core/chain.ts";
import { SupabaseClient } from "@shared/infra/supabase.ts";
import { HttpException } from "@shared/adapters/http/format/exception.ts";

// Validators
import {
  type RefreshTokenBody,
  type RefreshTokenQuery,
} from "@local/validators";

// Auth
import { AuthState } from "@auth/state/index.ts";

export const refreshTokenStep = (
  supabase: SupabaseClient
): Step<
  RefreshTokenBody,
  { access_token: string; refresh_token: string; device_id: string },
  RefreshTokenQuery,
  unknown,
  AuthState<RefreshTokenBody, RefreshTokenQuery>
> => {
  return async (ctx, input) => {
    const { refresh_token, device_id } = input;

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
      device_id,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  };
};
