import { JwtPayload } from "npm:jsonwebtoken";

// Shared
import { HttpException } from "../../_modules/shared/error/exception.ts";
import { JwtDependencies } from "../../_modules/shared/ports/jwt.ts";
import { Step } from "../../_modules/shared/composer/chain.ts";

// State
import { FunctionState, AuthTokens } from "../state/types.ts";

// Validator
import { AuthVerifyInput } from "../validators/validator.ts";

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
  dependencies: JwtDependencies<JwtClaims>
): Step<
  { device_id: string; access_token: string; refresh_token: string },
  AuthTokens,
  AuthVerifyInput,
  FunctionState<AuthVerifyInput>
> => {
  const { verify, sign } = dependencies;

  return async ({ device_id, access_token, refresh_token }, ctx) => {
    // 1) 기존 access_token 검증
    let claims: JwtClaims;

    try {
      claims = await verify(access_token);
    } catch (error) {
      console.error(
        `[resignJwtWithDeviceIdStep_verify_error]: ${JSON.stringify(
          error,
          Object.getOwnPropertyNames(error)
        )}`
      );

      if (error instanceof Error) {
        ctx.response = HttpException.badRequest("Invalid token");
        throw Object.assign(error, { cause: "resignJwtWithDeviceIdStep" });
      }

      throw error;
    }

    // 2) 새 토큰 발급 (유효기간은 기존과 동일하게 가져갈 수도 있고, 새로 설정 가능)
    try {
      const newAccessToken = await sign({ ...claims, device_id });

      return {
        access_token: newAccessToken,
        refresh_token,
      };
    } catch (error) {
      console.error(
        `[resignJwtWithDeviceIdStep_sign_error]: ${JSON.stringify(
          error,
          Object.getOwnPropertyNames(error)
        )}`
      );

      if (error instanceof Error) {
        ctx.response = HttpException.internalError("Cannot sign token");
      }

      throw error;
    }
  };
};
