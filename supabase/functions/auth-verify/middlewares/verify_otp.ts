import { SupabaseClient } from "jsr:@supabase/supabase-js@2";

import { HttpException } from "../../_shared/error/exception.ts";
import {
  InnerMiddleware,
  Next,
} from "../../_shared/middlewares/types.ts";
import { FunctionState } from "../state/types.ts";
import { State } from "../state/index.ts";
import { AuthVerifyInput } from "../validators/validator.ts";

// 브릿지: body에서 token_hash만 주입해 OTP 검증 수행 후 state에 세션 저장
export const verifyOtp = (
  supabase: SupabaseClient
): InnerMiddleware<AuthVerifyInput, FunctionState<AuthVerifyInput>> => {
  return async (
    { token_hash },
    ctx,
    next: Next
  ) => {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: "magiclink",
    });

    if (error) {
      ctx.response = HttpException.badRequest(error.message);
      return;
    }

    if (!data.session) {
      ctx.response = HttpException.unauthorized("session_not_found");
      return;
    }

    State.setOtpData(ctx as never, {
      session: {
        access_token: data.session.access_token!,
        refresh_token: data.session.refresh_token!,
      },
    });

    next();
  };
};
