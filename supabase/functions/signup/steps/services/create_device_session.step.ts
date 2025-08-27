import { Step } from "@shared/core/chain.ts";
import { type AuthState } from "@auth/state/index.ts";
import { type SignUpBody } from "@local/validators";
import { HttpException } from "@shared/adapters/http/format/exception.ts";
import { SupabaseClient } from "@shared/infra/supabase.ts";

export function createDeviceSessionStep(supabase: SupabaseClient): Step<
  {
    device_id: string;
    user_id: string;
    platform: "web" | "ios" | "android";
  },
  {
    device_id: string;
    user_id: string;
    platform: "web" | "ios" | "android";
  },
  SignUpBody,
  unknown,
  AuthState<SignUpBody>
> {
  return async (ctx, { device_id, user_id, platform }) => {
    const { data: deviceSession, error } = await supabase
      .from("device_sessions")
      .insert({
        device_id,
        user_id,
        platform,
      })
      .select()
      .single();

    if (error) {
      ctx.response = HttpException.internalError(error.message);
      throw new Error(error.message);
    }

    if (!deviceSession) {
      ctx.response = HttpException.internalError(
        "can not create device session"
      );
      throw new Error("can not create device session");
    }

    return deviceSession;
  };
}
