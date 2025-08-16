import jwt from "npm:jsonwebtoken";

import { Step } from "../../_modules/shared/composer/chain.ts";
import { AuthVerifyInput } from "../validators/validator.ts";
import { FunctionState, AuthTokens } from "../state/types.ts";

interface JwtClaims {
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

export const resignJwtWithDeviceId: Step<
  { device_id: string; access_token: string; refresh_token: string },
  AuthTokens,
  AuthVerifyInput,
  FunctionState<AuthVerifyInput>
> = ({ device_id, access_token, refresh_token }, _ctx) => {
  const JWT_SECRET = Deno.env.get("JWT_SECRET") ?? "";

  // 1) 기존 access_token 검증
  const claims = jwt.verify(access_token, JWT_SECRET, {
    algorithms: ["HS256"],
  }) as JwtClaims;

  // 2) 새 토큰 발급 (유효기간은 기존과 동일하게 가져갈 수도 있고, 새로 설정 가능)
  const newAccessToken = jwt.sign(
    {
      ...claims,
      device_id: device_id,
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
    }
  );

  return {
    access_token: newAccessToken,
    refresh_token: refresh_token,
  };
};
