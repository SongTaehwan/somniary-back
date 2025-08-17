// Shared
import { Context } from "@shared/types/context.types.ts";

// State
import { AuthTokens, FunctionState } from "../state.types.ts";
import { AuthVerifyInput } from "../../validators/validator.ts";
import { State } from "../index.ts";

export const selectAuthData = (
  ctx: Context<AuthVerifyInput, FunctionState<AuthVerifyInput>>
): AuthTokens => {
  const body = State.getAuthData(ctx);

  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
  };
};
