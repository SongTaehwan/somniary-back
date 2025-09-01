// Shared
import { SupabaseClient } from "@shared/infra/supabase.ts";
import { Step } from "@shared/core/chain.ts";
import { RouteState } from "@shared/types/state.types.ts";
import { HttpException } from "@shared/adapters/http/format/exception.ts";

export const deleteDeviceSessionStep = <T, Q, State extends RouteState<T, Q>>(
  supabase: SupabaseClient
): Step<
  { device_id: string; device_session_id: string },
  void,
  T,
  Q,
  State
> => {
  return async (ctx, { device_id, device_session_id }) => {
    const { error } = await supabase
      .from("device_sessions")
      .delete()
      .eq("device_id", device_id)
      .eq("session_id", device_session_id);

    if (error) {
      ctx.response = HttpException.internalError(
        "Failed to revoke device session"
      );

      throw error;
    }

    return;
  };
};
