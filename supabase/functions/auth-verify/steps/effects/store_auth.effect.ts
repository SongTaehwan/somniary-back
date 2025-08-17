// Shared
import { SideEffect } from "@shared/core/chain.ts";

// State
import { State } from "../../state/index.ts";
import { AuthTokens, FunctionState } from "../../state/state.types.ts";

// Validators
import { AuthVerifyInput } from "../../validators/validator.ts";

export const storeAuth: SideEffect<
  AuthTokens,
  AuthVerifyInput,
  FunctionState<AuthVerifyInput>
> = (auth, ctx) => {
  State.setAuthData(ctx, auth);
};
