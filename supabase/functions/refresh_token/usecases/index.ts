// Shared
import { chain } from "@shared/core/chain.ts";
import { supabase } from "@shared/infra/supabase.ts";
import { storeRequestInputStep } from "@shared/adapters/http/steps/store_request_input.step.ts";
import { AppConfig } from "@shared/utils/config.ts";
import { selectRequestBodyStep } from "@shared/adapters/http/steps/select_request_input.step.ts";

// Auth
import { type AuthState } from "@auth/state/index.ts";
import { jwtDependencies } from "@auth/utils/index.ts";
import { createResignJwtWithClaimsStep } from "@auth/steps/services/create_resign_jwt_with_claims.step.ts";
import { storeAuthDataStep } from "@auth/steps/rules/store_auth_data.step.ts";

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

export const refreshTokenChain = chain<
  RefreshTokenBody,
  RefreshTokenQuery,
  AuthState<RefreshTokenBody, RefreshTokenQuery>,
  Input<RefreshTokenBody, RefreshTokenQuery>
>(validateRequestInputStep, {
  debugMode: AppConfig.isDevelopment,
  debugLabel: "refresh_token_chain",
})
  .tap(storeRequestInputStep, "store_input_step")
  .then(selectRequestBodyStep, "select_body_step")
  // TODO: device_id 검증 단계 필요
  .then(refreshTokenStep(supabase), "refresh_token_step")
  .zipWith(
    selectRequestBodyStep,
    (previousStep, currentStep) => ({
      access_token: previousStep.access_token,
      refresh_token: previousStep.refresh_token,
      device_id: currentStep.device_id,
      device_session_id: crypto.randomUUID(),
    }),
    "prepare_resign_jwt_with_claims_data"
  )
  .lazyThen(
    (_ctx, _input) => createResignJwtWithClaimsStep(jwtDependencies),
    "resign_jwt_with_claims_step"
  )
  .then(storeAuthDataStep, "store_auth_data_step");
