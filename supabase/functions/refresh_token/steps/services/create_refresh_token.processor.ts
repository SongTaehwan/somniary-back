// Shared
import { type RouteState } from "@shared/types/state.types.ts";
import { type Selector } from "@shared/core/chain.ts";
import { SupabaseClient } from "@shared/infra/supabase.ts";
import { selectRequestBodyStep } from "@shared/adapters/http/steps/select_request_input.step.ts";

// Validators
import { type RefreshTokenBody } from "@local/validators";
import { createRefreshTokenStep } from "@local/steps/services/create_refresh_token.step.ts";
import { createUpdateDeviceSessionStep } from "./create_update_device_session.step.ts";

export function createRefreshTokenProcessor<
  Query,
  State extends RouteState<RefreshTokenBody, Query>
>(
  supabase: SupabaseClient,
  supabaseAuthClient: SupabaseClient
): Selector<
  {
    access_token: string;
    refresh_token: string;
    device_id: string;
    device_session_id: string;
  },
  RefreshTokenBody,
  Query,
  State
> {
  return async (ctx) => {
    const body = selectRequestBodyStep<RefreshTokenBody, Query, State>(ctx);

    console.log(
      `[REFRESH_TOKEN_PROCESSOR] Starting refresh token process for device: ${body.device_id}`
    );

    // 토큰 리프레시
    const refreshTokenStep = createRefreshTokenStep<
      RefreshTokenBody,
      Query,
      State
    >(supabaseAuthClient);

    const { access_token, refresh_token } = await refreshTokenStep(ctx, {
      refresh_token: body.refresh_token,
    });

    console.log(
      `[REFRESH_TOKEN_PROCESSOR] Refresh token process complete for device: ${body.device_id}`
    );

    // 디바이스 세션 업데이트
    const updateDeviceSessionStep = createUpdateDeviceSessionStep<
      RefreshTokenBody,
      Query,
      State
    >(supabase);

    const timestamp = new Date().toISOString();
    const deviceSession = await updateDeviceSessionStep(ctx, {
      device_id: body.device_id,
      session_id: crypto.randomUUID(),
      last_sign_in_at: timestamp,
      updated_at: timestamp,
    });

    console.log(
      `[REFRESH_TOKEN_PROCESSOR] Device session updated for device: ${body.device_id}, session_id: ${deviceSession.session_id}`
    );

    return {
      access_token,
      refresh_token,
      device_id: body.device_id,
      device_session_id: deviceSession.session_id,
    };
  };
}
