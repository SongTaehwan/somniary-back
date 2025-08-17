import { JwtPayload } from "npm:jsonwebtoken";

// Shared
import { task } from "@shared/utils/task.ts";
import { HttpException } from "@shared/http/error/exception.ts";
import { type JwtDependencies } from "@shared/security/jwt/jwt.ts";
import { Step } from "@shared/core/chain.ts";

// State
import { FunctionState, AuthTokens } from "../../state/state.types.ts";

// Validator
import { AuthVerifyInput } from "../../validators/validator.ts";

interface JwtClaims extends JwtPayload {
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  sub: string;
  role: string;
  aal: "aal1" | "aal2";
  session_id: string;
  email: string;
  phone: string;
  is_anonymous: boolean;
  jti?: string;
  nbf?: number;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  amr?: Array<{
    method: string;
    timestamp: number;
  }>;
  ref?: string; // Only in anon/service role tokens
}

export const resignJwtWithDeviceIdStep = (
  dependency: JwtDependencies<JwtClaims>
): Step<
  { device_id: string; access_token: string; refresh_token: string },
  AuthTokens,
  AuthVerifyInput,
  FunctionState<AuthVerifyInput>
> => {
  return async ({ device_id, access_token, refresh_token }, ctx) => {
    // 1) 기존 access_token 검증
    const verifyTask = await task(
      dependency.verify(access_token),
      "resignJwtWithDeviceIdStep_verify"
    );

    if (verifyTask.failed) {
      // 클라이언트 응답
      ctx.response = HttpException.badRequest("Invalid token");
      // 내부 로깅 및 추적
      throw verifyTask.error;
    }

    const claims = verifyTask.value;

    // 2) 새 토큰 발급 (유효기간은 기존과 동일하게 가져갈 수도 있고, 새로 설정 가능)
    const signTask = await task(
      dependency.sign({ ...claims, device_id }),
      "resignJwtWithDeviceIdStep_sign"
    );

    if (signTask.failed) {
      // 클라이언트 응답
      ctx.response = HttpException.internalError("Cannot sign token");
      // 내부 로깅 및 추적
      throw signTask.error;
    }

    return {
      access_token: signTask.value,
      refresh_token,
    };
  };
};
