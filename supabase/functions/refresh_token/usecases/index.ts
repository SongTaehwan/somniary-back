// Shared
import { chain } from "@shared/core/chain.ts";
import { supabase } from "@shared/infra/supabase.ts";

// Auth
import { type AuthState } from "@auth/state/index.ts";
import { createJwtDependencies } from "@auth/utils/jwt.ts";
import { createResignJwtWithDeviceIdStep } from "@auth/steps/services/create_resign_jwt_with_device_id.step.ts";
import { storeAuthData } from "@auth/steps/rules/store_auth_data.ts";

// Types
import { type Input } from "@shared/types/state.types.ts";

// Validators
import {
  type RefreshTokenBody,
  type RefreshTokenQuery,
  validateStep,
} from "@local/validators";

// State
import { refreshTokenStep } from "@local/steps/services/refresh_token.step.ts";
import { selectBodyStep } from "@shared/adapters/http/steps/select_body.step.ts";
import { AppConfig } from "@shared/utils/config.ts";

export const refreshTokenChain = chain<
  RefreshTokenBody,
  RefreshTokenQuery,
  AuthState<RefreshTokenBody, RefreshTokenQuery>,
  Input<RefreshTokenBody, RefreshTokenQuery>
>(validateStep, {
  debugMode: AppConfig.isDevelopment,
  debugLabel: "refresh_token_chain",
})
  .then(selectBodyStep(), "select_body_step")
  // TODO: device_id 검증 단계 필요
  .then(refreshTokenStep(supabase), "refresh_token_step")
  .lazyThen(
    (_ctx, _input) =>
      createResignJwtWithDeviceIdStep(
        createJwtDependencies(AppConfig.getJwtSecret())
      ),
    "resign_jwt_with_device_id_step"
  )
  .then(storeAuthData(), "store_auth_data_step");
