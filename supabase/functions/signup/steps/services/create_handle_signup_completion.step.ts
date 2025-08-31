// Shared
import { HttpException } from "@shared/adapters/http/format/exception.ts";
import { task } from "@shared/utils/task.ts";
import { toError } from "@shared/adapters/http/format/normalize.ts";
import { SupabaseClient } from "@shared/infra/supabase.ts";

// Types
import { type RouteState } from "@shared/types/state.types.ts";
import { type Step } from "@shared/core/chain.ts";

// Local
import { type SignUpStatusResult } from "./create_check_signup_status.step.ts";

export interface SignUpCompletionResult {
  deviceSession: {
    id: string;
    device_id: string;
    platform: string;
    session_id: string;
  };
  isExistingSession: boolean;
}

/* 다음의 시나리오를 구현
 * 1. 현재 디바이스로 재가입 (현재 디바이스 가입 이력 있음)
 * 2. 새로운 디바이스로 재가입 (다른 디바이스 가입 이력 있음)
 * 3. 현재 디바이스로 신규 가입 (모든 디바이스 가입 이력 없음)
 *
 * INFO: 차후 SMS, 이메일 인증 로직 추가 시 이 단계에서 처리 필요
 */
export const createHandleSignUpCompletionStep = <
  Body,
  Query,
  State extends RouteState<Body, Query>
>(
  dependency: SupabaseClient
): Step<
  {
    user_id: string;
    device_id: string;
    platform: "web" | "ios" | "android";
    signUpStatus: SignUpStatusResult;
  },
  SignUpCompletionResult,
  Body,
  Query,
  State
> => {
  return async (
    ctx,
    { user_id, device_id, platform, signUpStatus: signupStatus }
  ) => {
    try {
      // 1. 이미 현재 디바이스로 가입 완료된 경우
      if (signupStatus.isCompleted) {
        const updateTaskResult = await task(
          updateExistingDeviceSession(
            dependency,
            signupStatus.deviceSession.id
          ),
          {
            labelForError: "updateExistingDeviceSession",
            throwError: true,
          }
        );

        return {
          deviceSession: updateTaskResult.value,
          isExistingSession: true,
        };
      }

      // 2. 새로운 디바이스 세션 생성 - 다른 디바이스로 가입 및 신규 가입
      if (signupStatus.completionType === "other_device") {
        console.log(
          `[SIGNUP_COMPLETION] User has ${signupStatus.deviceSessions.length} other device(s) and trying to sign up with current device.`
        );
      } else {
        console.log(
          `[SIGNUP_COMPLETION] User has not signed up with current device and trying to sign up with current device.`
        );
      }

      const creationTaskResult = await task(
        createNewDeviceSession(dependency, user_id, device_id, platform),
        {
          labelForError: "createNewDeviceSession",
          throwError: true,
        }
      );

      return {
        deviceSession: creationTaskResult.value,
        isExistingSession: false,
      };
    } catch (err) {
      const error = toError(err);
      ctx.response = HttpException.internalError(
        "failed to handle signup completion"
      );

      throw Object.assign(error, {
        cause: "createHandleSignUpCompletionStep",
      });
    }
  };
};

const updateExistingDeviceSession = async (
  dependency: SupabaseClient,
  deviceSessionId: string
) => {
  const timestamp = new Date().toISOString();

  const { data: deviceSession, error } = await dependency
    .from("device_sessions")
    .update({
      last_seen: timestamp,
      updated_at: timestamp,
    })
    .eq("id", deviceSessionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return deviceSession;
};

const createNewDeviceSession = async (
  dependency: SupabaseClient,
  user_id: string,
  device_id: string,
  platform: "ios" | "android" | "web"
) => {
  const { data: deviceSession, error } = await dependency
    .from("device_sessions")
    .insert({
      device_id,
      user_id,
      platform,
      session_id: crypto.randomUUID(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return deviceSession;
};
