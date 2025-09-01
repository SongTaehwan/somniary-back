import { SupabaseClient } from "@shared/infra/supabase.ts";
import { Step } from "@shared/core/chain.ts";
import { RouteState } from "@shared/types/state.types.ts";
import { HttpException } from "@shared/adapters/http/format/exception.ts";

export const createUpdateDeviceSessionStep = <
  Body,
  Query,
  State extends RouteState<Body, Query>
>(
  supabase: SupabaseClient
): Step<
  {
    device_id: string;
    session_id: string;
    last_sign_in_at: string;
    updated_at: string;
  },
  { id: string; user_id: string; device_id: string; session_id: string },
  Body,
  Query,
  State
> => {
  return async (
    ctx,
    { device_id, session_id, last_sign_in_at, updated_at }
  ) => {
    const { data, error } = await supabase
      .from("device_sessions")
      .update({
        session_id,
        last_sign_in_at,
        updated_at,
      })
      .eq("device_id", device_id)
      .select("id, user_id, device_id, session_id")
      .single();

    if (error) {
      ctx.response = HttpException.internalError(
        "Failed to update device session"
      );

      throw error;
    }

    return data;
  };
};
