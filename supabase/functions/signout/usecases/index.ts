// Shared
import { chain } from "@shared/core/chain.ts";
import { supabase } from "@shared/infra/supabase.ts";
import { AppConfig } from "@shared/utils/config.ts";

// Auth
import { jwtDependencies } from "@auth/utils/index.ts";
import { createVerifyAccessTokenStep } from "@auth/steps/services/create_verify_access_token.step.ts";

// Types
import {
  extractJwtFromRequest,
  type Token,
} from "@shared/adapters/http/steps/extract_jwt_from_request.step.ts";

// Validators
import { type SignOutQuery, type SignOutBody } from "@local/validators";

// State
import { type FunctionState } from "@local/state";
import { expireTokenStep } from "@local/steps/services/expire_token.step.ts";
import { deleteDeviceSessionStep } from "@local/steps/services/revoke_device_session.step.ts";

export const signOutChain = chain<
  SignOutBody,
  SignOutQuery,
  FunctionState<SignOutQuery, SignOutQuery>,
  Token
>(extractJwtFromRequest(), {
  debugMode: AppConfig.isDevelopment,
  debugLabel: "signout_chain",
})
  .tap(expireTokenStep(supabase), "expire_token_step")
  .lazyThen(
    (_ctx, _input) => createVerifyAccessTokenStep(jwtDependencies),
    "create_verify_access_token_step"
  )
  .map((claim) => ({
    device_id: claim.device_id,
    device_session_id: claim.device_session_id,
  }))
  // TODO: 추후 레코드 삭제가 아닌 status, timestamp 업데이트로 변경
  .then(deleteDeviceSessionStep(supabase), "revoke_device_session_step");
