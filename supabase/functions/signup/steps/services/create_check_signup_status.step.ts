import { SupabaseClient } from "@shared/infra/supabase.ts";
import { RouteState } from "@shared/types/state.types.ts";
import { Step } from "@shared/core/chain.ts";
import { toError } from "@shared/adapters/http/format/normalize.ts";

type DeviceSession = {
  id: string;
  created_at: string;
  platform: "ios" | "android" | "web";
  last_sign_in_at: string;
  device_id: string;
};

export type AlreadySignedUpWithCurrentDevice = {
  isCompleted: true;
  completionType: "same_device";
  deviceSession: DeviceSession;
};

export type AlreadySignedUpWithOtherDevice = {
  isCompleted: false;
  completionType: "other_device";
  deviceSessions: DeviceSession[];
};

export type NewSignUp = {
  isCompleted: false;
  completionType: "new";
};

export type SignUpStatusResult =
  | AlreadySignedUpWithCurrentDevice
  | AlreadySignedUpWithOtherDevice
  | NewSignUp;

export function createCheckSignUpStatusStep<
  Body,
  Query,
  State extends RouteState<Body, Query>
>(
  dependency: SupabaseClient
): Step<{ user_id: string; device_id: string }, NewSignUp, Body, Query, State>;

export function createCheckSignUpStatusStep<
  Body,
  Query,
  State extends RouteState<Body, Query>
>(
  dependency: SupabaseClient
): Step<
  { user_id: string; device_id: string },
  AlreadySignedUpWithCurrentDevice,
  Body,
  Query,
  State
>;

export function createCheckSignUpStatusStep<
  Body,
  Query,
  State extends RouteState<Body, Query>
>(
  dependency: SupabaseClient
): Step<
  { user_id: string; device_id: string },
  AlreadySignedUpWithOtherDevice,
  Body,
  Query,
  State
>;

// 중복 작업 방지용 최적화 로직으로 가입 상태 확인 실패 시에도 가입 프로세스는 계속 진행
// 사용자 관점에서 중복 세션 확인은 관심사가 아니므로 해당 작업이 실패했다고해서 가입 프로세스 중단되지 않음
// Graceful Degradation 패턴 참고
export function createCheckSignUpStatusStep<
  Body,
  Query,
  State extends RouteState<Body, Query>
>(
  dependency: SupabaseClient
): Step<
  { user_id: string; device_id: string },
  SignUpStatusResult,
  Body,
  Query,
  State
> {
  // 1. 이미 가입함
  // 2. 다른 디바이스로 가입함
  // 3. 신규 가입
  return async (_ctx, { user_id, device_id }) => {
    try {
      // 1. 모든 디바이스의 기존 세션 조회 (5개 이하)
      const { data: deviceSessions, error: deviceSessionsError } =
        await dependency
          .from("device_sessions")
          .select("id, created_at, platform, last_sign_in_at, device_id")
          .eq("user_id", user_id)
          .order("created_at", { ascending: false });

      // 1.1 디바이스 세션이 없는 경우 신규 가입으로 간주
      // 1.2 디바이스 세션 조회 실패하더라도 가입 프로세스는 계속 진행
      if (
        deviceSessionsError ||
        (deviceSessions && deviceSessions.length === 0)
      ) {
        return {
          isCompleted: false,
          completionType: "new",
        };
      }

      // 2. 현재 디바이스로 가입한 기존 사용자
      const currentDeviceSession = deviceSessions.find(
        (session) => session.device_id === device_id
      );

      if (deviceSessions.length > 0 && currentDeviceSession) {
        return {
          isCompleted: true,
          completionType: "same_device",
          deviceSession: currentDeviceSession,
        };
      }

      // 3. 다른 디바이스로 가입한 기존 사용자
      return {
        isCompleted: false,
        completionType: "other_device",
        deviceSessions,
      };
    } catch (err) {
      const error = toError(err);

      // 가입 상태 확인 실패 시에도 가입 프로세스는 계속 진행
      console.error(`[CHECK_SIGNUP_STATUS_CRITICAL_ERROR] ${error.message}`);

      return {
        isCompleted: false,
        completionType: "new",
      };
    }
  };
}
