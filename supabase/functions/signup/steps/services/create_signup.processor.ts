import { RouteState } from "@shared/state/index.ts";
import { Step } from "@shared/core/chain.ts";
import { SupabaseClient } from "@shared/infra/supabase.ts";
import { selectRequestBodyStep } from "@shared/adapters/http/steps/select_request_input.step.ts";
import { createCheckSignUpStatusStep } from "./create_check_signup_status.step.ts";
import { User } from "@supabase/supabase-js";
import { SignUpBody } from "@local/validators";
import {
  createHandleSignUpCompletionStep,
  SignUpCompletionResult,
} from "./create_handle_signup_completion.step.ts";
import { toError } from "@shared/adapters/http/format/normalize.ts";

export function createSignupProcessor<
  Query,
  State extends RouteState<SignUpBody, Query>
>(
  supabase: SupabaseClient
): Step<User, SignUpCompletionResult, SignUpBody, Query, State> {
  return async (ctx, user) => {
    try {
      const body = selectRequestBodyStep<SignUpBody, Query, State>(ctx);

      console.log(
        `[SIGNUP_PROCESSOR] Starting signup process for user: ${user.id}, device: ${body.device_id}`
      );

      // 1. 가입 상태 확인 - 디바이스 세션 존재 유무로 가입 상태 확인(가입 상태에 따라 가입 프로세스 진행)
      // - 같은 디바이스 재가입, 다른 디바이스 가입, 신규 가입 처리
      // - 중복 작업 방지용 최적화 로직으로 가입 상태 확인 실패 시에도 가입 프로세스는 계속 진행
      const checkSignUpStatusStep = createCheckSignUpStatusStep(supabase);
      const signUpStatus = await checkSignUpStatusStep(ctx, {
        user_id: user.id,
        device_id: body.device_id,
      });

      console.log(
        `[SIGNUP_PROCESSOR] Signup status check complete: ${signUpStatus.completionType}`
      );

      // 2. 완료 처리 - 도메인 로직
      const handleSignUpCompletionStep =
        createHandleSignUpCompletionStep(supabase);
      const completionResult = await handleSignUpCompletionStep(ctx, {
        user_id: user.id,
        device_id: body.device_id,
        signUpStatus,
        platform: body.platform,
      });

      console.log(`[SIGNUP_PROCESSOR] Signup completion successful`);

      return completionResult;
    } catch (err) {
      const error = toError(err);
      console.error(`[SIGNUP_PROCESSOR] Error: ${error.message}`);
      throw error;
    }
  };
}
