import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, EmailOtpType } from "jsr:@supabase/supabase-js@2";
import { compose } from "../_shared/middlewares/compose.ts";
import { methodGuard } from "../_shared/middlewares/method.guard.ts";
import { Middleware } from "../_shared/middlewares/type.ts";
import jwt from "npm:jsonwebtoken";
import { HttpException } from "../_shared/error/exception.ts";

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

// 미들웨어: 요청 본문 파싱 및 OTP 검증 → 컨텍스트 전달
const verifyOtp: Middleware = async (ctx, next) => {
  const { token_hash } = await ctx.request.json();

  // 2. 토큰 해시 검증 및 토큰 발급한다.
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token_hash,
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

  ctx.state.otpData = data;
  await next();
};

Deno.serve(
  compose([
    methodGuard(["POST"]),
    verifyOtp,
  ], (ctx) => {
    const device_id = ctx.state.device_id as string;
    const data = ctx.state.otpData as {
      session: { access_token: string; refresh_token: string };
    };

    const {
      session: { access_token, refresh_token },
    } = data;

    // 1) 기존 access_token 검증
    const decoded = jwt.verify(
      access_token,
      JWT_SECRET, // 프로젝트 JWT 시크릿
      { algorithms: ["HS256"] }
    ) as JwtClaims;

    // 2) 기존 payload에 device_id 추가
    const newPayload = {
      ...decoded,
      device_id,
    };

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
  })
);
