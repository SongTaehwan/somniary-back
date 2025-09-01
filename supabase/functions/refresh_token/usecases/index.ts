// Shared
import { chain } from "@shared/core/chain.ts";
import { supabase, supabaseAuthClient } from "@shared/infra/supabase.ts";
import { storeRequestInputStep } from "@shared/adapters/http/steps/store_request_input.step.ts";
import { AppConfig } from "@shared/utils/config.ts";
import { selectRequestBodyStep } from "@shared/adapters/http/steps/select_request_input.step.ts";

// Auth
import { type AuthState } from "@auth/state/index.ts";
import { createJwtDependencies } from "@auth/utils/jwt.ts";
import { createResignJwtWithClaimsStep } from "@auth/steps/services/create_resign_jwt_with_claims.step.ts";
import { storeAuthDataStep } from "@auth/steps/rules/store_auth_data.step.ts";
import { retrieveAuthDataStep } from "@auth/steps/rules/retrieve_auth_data.step.ts";

// Types
import { type Input } from "@shared/types/state.types.ts";

// Validators
import {
  type RefreshTokenBody,
  type RefreshTokenQuery,
  validateRequestInputStep,
} from "@local/validators";

// State
import { createRefreshTokenStep } from "@local/steps/services/create_refresh_token.step.ts";
import { createUpdateDeviceSessionStep } from "@local/steps/services/create_update_device_session.step.ts";

const requestChain = chain<
  RefreshTokenBody,
  RefreshTokenQuery,
  AuthState<RefreshTokenBody, RefreshTokenQuery>,
  Input<RefreshTokenBody, RefreshTokenQuery>
>(validateRequestInputStep, {
  debugMode: AppConfig.isDevelopment,
  debugLabel: "refresh_token_chain",
}).tap(storeRequestInputStep, "store_input_step");

const processRefreshToken = requestChain
  .cast((input) => input.body)
  .map((input) => ({ refresh_token: input.refresh_token }))
  .then(createRefreshTokenStep(supabaseAuthClient), "refresh_token_step")
  .tap(storeAuthDataStep, "store_auth_data_step");

const processUpdateDeviceSession = processRefreshToken
  .reselect(selectRequestBodyStep, "select_body_step")
  .map((body) => {
    const timestamp = new Date().toISOString();
    return {
      device_id: body.device_id,
      session_id: crypto.randomUUID(),
      last_sign_in_at: timestamp,
      updated_at: timestamp,
    };
  })
  .tap(createUpdateDeviceSessionStep(supabase), "update_device_session_step");

const processResignJwtWithClaims = processUpdateDeviceSession
  .zipWith(
    retrieveAuthDataStep,
    (previousStep, currentStep) => ({
      access_token: currentStep.access_token,
      refresh_token: currentStep.refresh_token,
      device_id: previousStep.device_id,
      device_session_id: previousStep.session_id,
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
  .then(storeAuthDataStep, "store_auth_data_step");

export const refreshTokenChain = processResignJwtWithClaims;
