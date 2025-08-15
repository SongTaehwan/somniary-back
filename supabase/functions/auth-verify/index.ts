// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, EmailOtpType } from "jsr:@supabase/supabase-js@2";
import { withMethodGuard } from "../_shared/middleware.ts";
import jwt from "npm:jsonwebtoken";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// 클라이언트로 부터 device_id, token hash 를 받아 인증 완료 처리 및 토큰 발급한다.
// 제약 조건
// - Request, Response input, output 은 모두 타입스크립트 타입으로 정의된다.

// 1. 앱에서 POST 요청 시 device_id, token hash 를 받는다.
// 2. 토큰 해시 검증 및 토큰 발급한다.
// 3. JWT claim 을 추가한다.
// 4. device_sessions 레코드 추가
// 5. 엑세스 토큰 & 리프레시 토큰 반환
// 6. 함수 종료

interface JwtClaims {
  iss: string
  aud: string | string[]
  exp: number
  iat: number
  sub: string
  role: string
  aal: 'aal1' | 'aal2'
  session_id: string
  email: string
  phone: string
  is_anonymous: boolean
  jti?: string
  nbf?: number
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
  amr?: Array<{
    method: string
    timestamp: number
  }>
  ref?: string // Only in anon/service role tokens
}

Deno.serve(
  withMethodGuard(["POST"], async (req: Request) => {
    const { device_id } = await req.json();
    // 1. 앱에서 POST 요청 시 device_id, token hash 를 받는다.
    const {
      data: { properties },
    } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: "supabase_test3@yopmail.com",
      options: { redirectTo: "somniary://signup" }, // redirectTo 무시해도 토큰은 생성됩니다
    });

    const tokenHash = properties?.hashed_token;
    const data = await verifyOtp("magiclink", tokenHash!);

    if (!data.session) {
      throw new Error("session not found");
    }

    const {
      session: { access_token, refresh_token },
    } = data;

    // 1) 기존 access_token 검증
    const decoded = jwt.verify(
      access_token,
      Deno.env.get("SUPABASE_JWT_SECRET")!, // 프로젝트 JWT 시크릿
      { algorithms: ['HS256'] }
    ) as Record<string, any>

    
    // 2) 기존 payload에 device_id 추가
    const newPayload = {
      ...decoded,
      device_id
    }
    
    // 3) 새 토큰 발급 (유효기간은 기존과 동일하게 가져갈 수도 있고, 새로 설정 가능)
    const newAccessToken = jwt.sign(
      newPayload,
      Deno.env.get("SUPABASE_JWT_SECRET")!,
      { algorithm: 'HS256' }
    )

    const result = await supabase.auth.getUser(newAccessToken);
    console.log(`FETCHING_RESULT: ${result.error === null}`)

    return new Response(
      // JSON.stringify({
      //   access_token: newAccessToken,
      //   refresh_token: 's5jyfqmkhhl6',
      // }),
      JSON.stringify(result),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  })
);

async function verifyOtp(type: EmailOtpType, tokenHash: string) {
  // 2. 토큰 해시 검증 및 토큰 발급한다.
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    throw error;
  }

  return data;
}
