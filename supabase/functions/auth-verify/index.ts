import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import jwt from "npm:jsonwebtoken";

import { methodGuard } from "../_shared/middlewares/method.guard.ts";
import { parseInput } from "../_shared/middlewares/parse_input.ts";
import { selectInputBody } from "../_shared/selectors/selectors.ts";
import { compose } from "../_shared/utils/compose.ts";
import { inject } from "../_shared/utils/inject.ts";

import { AuthVerifyInput, validateInput } from "./validators/validator.ts";
import { verifyOtp } from "./middlewares/verify_otp.ts";
import { FunctionState } from "./state/types.ts";
import { State } from "./state/index.ts";

const JWT_SECRET = Deno.env.get("JWT_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 클라이언트로 부터 device_id, token hash 를 받아 인증 완료 처리 및 토큰 발급한다.
// 1. 앱에서 POST 요청 시 device_id, token hash 를 받는다.
// 2. 토큰 해시 검증 및 토큰 발급한다.
// 3. JWT claim 을 추가한다.
// 4. device_sessions 레코드 추가
// 5. 엑세스 토큰 & 리프레시 토큰 반환
// 6. 함수 종료

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

Deno.serve(
  compose<AuthVerifyInput, FunctionState<AuthVerifyInput>>(
    [
      methodGuard(["POST"]),
      parseInput(validateInput),
      inject(selectInputBody, verifyOtp(supabase)),
    ],
    (ctx) => {
      const { access_token, refresh_token } = State.getOtpData(ctx).session;

      // 1) 기존 access_token 검증
      const decoded = jwt.verify(
        access_token,
        JWT_SECRET, // 프로젝트 JWT 시크릿
        { algorithms: ["HS256"] }
      ) as JwtClaims;

      // 2) 기존 payload에 device_id 추가
      const newPayload = { ...decoded };

      // 3) 새 토큰 발급 (유효기간은 기존과 동일하게 가져갈 수도 있고, 새로 설정 가능)
      const newAccessToken = jwt.sign(newPayload, JWT_SECRET, {
        algorithm: "HS256",
      });

      return new Response(
        JSON.stringify({
          access_token: newAccessToken,
          refresh_token: refresh_token,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  )
);
