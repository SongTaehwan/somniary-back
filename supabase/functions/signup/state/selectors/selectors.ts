// Shared
import { Context } from "@shared/types/context.types.ts";

// State
import { AuthTokens, FunctionState } from "@local/state/state.types.ts";
import { AuthVerifyInput } from "@local/validators/validator.ts";
import { State } from "@local/state/index.ts";

export const selectAuthData = (
  ctx: Context<AuthVerifyInput, unknown, FunctionState<AuthVerifyInput>>
): AuthTokens => {
  const body = State.getAuthData(ctx);

  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
  };
};
