// Shared
import { type Step } from "@shared/core/chain.ts";
import { HttpException } from "@shared/adapters/http/format/exception.ts";
import { SupabaseClient } from "@shared/infra/supabase.ts";
import { maskSensitiveData } from "@shared/utils/security.ts";

// State
import { type AuthState } from "@auth/state/index.ts";
import { type AuthTokens } from "@auth/state/index.ts";

// Validator
import { type SignUpBody } from "@local/validators";

const SAFE_ERROR_MESSAGES = {
  INVALID_OTP: "인증 코드가 올바르지 않습니다",
  EXPIRED_OTP: "인증 코드가 만료되었습니다",
  SESSION_ERROR: "인증 처리 중 오류가 발생했습니다",
  UNEXPECTED_ERROR: "예상치 못한 오류가 발생했습니다",
};

// OTP 검증 후 토큰 데이터 반환
export const createVerifyOtpStep = (
  supabase: SupabaseClient
): Step<
  { otp_token: string; email: string },
  AuthTokens,
  SignUpBody,
  unknown,
  AuthState<SignUpBody>
> => {
  return async (ctx, { otp_token: token, email }) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token,
        email,
        type: "email",
      });

      if (error) {
        const clientMessage = error.message?.includes("expired")
          ? SAFE_ERROR_MESSAGES.EXPIRED_OTP
          : SAFE_ERROR_MESSAGES.INVALID_OTP;

        ctx.response = HttpException.badRequest(clientMessage);
        throw new Error(
          `otp verification failed with error: ${error.message}`,
          {
            cause: "otp_verification_failed",
          }
        );
      }

      if (!data.session) {
        ctx.response = HttpException.internalError(
          SAFE_ERROR_MESSAGES.SESSION_ERROR
        );

        throw new Error("session not found", { cause: "session_not_found" });
      }

      console.log(
        `[OTP_VERIFICATION_SUCCESS]\n`,
        maskSensitiveData({
          email: email.replace(/(.{2}).*@/, "$1***@"),
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
      );

      return {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };
    } catch (error) {
      if (!ctx.response) {
        ctx.response = HttpException.internalError(
          SAFE_ERROR_MESSAGES.UNEXPECTED_ERROR
        );
      }

      throw error;
    }
  };
};
