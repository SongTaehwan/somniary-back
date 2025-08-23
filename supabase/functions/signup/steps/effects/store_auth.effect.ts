// Shared
import { SideEffect } from "@shared/core/chain.ts";

// State
import { State } from "@local/state/index.ts";
import { AuthTokens, FunctionState } from "@local/state/state.types.ts";

// Validators
import { AuthVerifyInput } from "@local/validators/validator.ts";

export const storeAuth: SideEffect<
  AuthTokens,
  AuthVerifyInput,
  unknown,
  FunctionState<AuthVerifyInput>
> = (auth, ctx) => {
  State.setAuthData(ctx, auth);
};
