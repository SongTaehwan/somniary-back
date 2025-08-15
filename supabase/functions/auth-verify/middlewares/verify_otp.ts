import { SupabaseClient } from "jsr:@supabase/supabase-js@2";

import { HttpException } from "../../_shared/error/exception.ts";

import { AuthVerifyInput } from "../validators/validator.ts";
import { AuthTokens, FunctionState } from "../state/types.ts";
import { Step } from "../../_shared/utils/inject.ts";

// 브릿지: body에서 token_hash만 주입해 OTP 검증 수행 후 state에 세션 저장
export const verifyOtp = (
  supabase: SupabaseClient
): Step<string, AuthTokens, AuthVerifyInput, FunctionState<AuthVerifyInput>> => {
  return async (tokenHash, ctx) => {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });

    if (error) {
      // 클라이언트 응답 + 프로세스 중단
      ctx.response = HttpException.badRequest(error.message);
      throw new Error(error.message);
    }

    if (!data.session) {
      // 클라이언트 응답 + 프로세스 중단
      ctx.response = HttpException.unauthorized("session_not_found");
      throw new Error("session_not_found");
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    }
  };
};
