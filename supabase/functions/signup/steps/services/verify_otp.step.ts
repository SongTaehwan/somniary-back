import { SupabaseClient } from "jsr:@supabase/supabase-js";

// Shared
import { Step } from "@shared/core/chain.ts";
import { HttpException } from "@shared/adapters/http/error/exception.ts";

// State
import { AuthTokens, FunctionState } from "@local/state/index.ts";

// Validator
import { SignUpBody } from "@local/validators";

// OTP 검증 후 토큰 데이터 반환
export const verifyOtp = (
  supabase: SupabaseClient
): Step<
  { otpToken: string; email: string },
  AuthTokens,
  SignUpBody,
  unknown,
  FunctionState<SignUpBody>
> => {
  return async ({ otpToken, email }, ctx) => {
    const { data, error } = await supabase.auth.verifyOtp({
      token: otpToken,
      email,
      type: "magiclink",
    });

    if (error) {
      // 클라이언트 응답 + 프로세스 중단
      ctx.response = HttpException.badRequest(error.message);
      throw new Error(error.message);
    }

    if (!data.session) {
      // 클라이언트 응답 + 프로세스 중단
      ctx.response = HttpException.internalError("session_not_found");
      throw new Error("session_not_found");
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  };
};
