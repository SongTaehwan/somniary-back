// Shared
import { chain } from "@shared/core/chain.ts";
import { supabase } from "@shared/infra/supabase.ts";

// Auth
import { type AuthState } from "@auth/state/index.ts";
import { createJwtDependencies } from "@auth/utils/jwt.ts";
import { createResignJwtWithClaimsStep } from "@auth/steps/services/create_resign_jwt_with_claims.step.ts";
import { storeAuthData } from "@auth/steps/rules/store_auth_data.ts";

// Types
import { type Input } from "@shared/types/state.types.ts";

// Validators
import {
  type RefreshTokenBody,
  type RefreshTokenQuery,
  validateRequestInputStep,
} from "@local/validators";

// State
import { refreshTokenStep } from "@local/steps/services/refresh_token.step.ts";
import { AppConfig } from "@shared/utils/config.ts";
import { selectRequestBodyStep } from "@shared/state/selectors/index.ts";

export const refreshTokenChain = chain<
  RefreshTokenBody,
  RefreshTokenQuery,
  AuthState<RefreshTokenBody, RefreshTokenQuery>,
  Input<RefreshTokenBody, RefreshTokenQuery>
>(validateRequestInputStep, {
  debugMode: AppConfig.isDevelopment,
  debugLabel: "refresh_token_chain",
})
  .then(selectRequestBodyStep, "select_body_step")
  // TODO: device_id 검증 단계 필요
  .then(refreshTokenStep(supabase), "refresh_token_step")
  .zipWith(
    selectRequestBodyStep,
    (previousStep, currentStep) => ({
      access_token: previousStep.access_token,
      refresh_token: previousStep.refresh_token,
      device_id: currentStep.device_id,
      session_id: crypto.randomUUID(),
    }),
    "prepare_resign_jwt_with_claims_data"
  )
  .lazyThen(
    (_ctx, _input) =>
      createResignJwtWithClaimsStep(
        createJwtDependencies(AppConfig.getJwtSecret())
      ),
    "resign_jwt_with_claims_step"
  )
  .then(storeAuthData, "store_auth_data_step");
