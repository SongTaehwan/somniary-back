// Shared
import { SideEffect } from "@shared/core/chain.ts";

// State
import { State } from "@local/state/selectors/index.ts";
import { AuthTokens, FunctionState } from "@local/state/index.ts";

// Validators
import { SignUpBody } from "@local/validators";

export const storeAuth: SideEffect<
  AuthTokens,
  SignUpBody,
  unknown,
  FunctionState<SignUpBody>
> = (auth, ctx) => {
  State.setAuthData(ctx, auth);
};
