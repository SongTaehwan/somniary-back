// Shared
import { SideEffect } from "@shared/core/chain.ts";
import { type Input } from "@shared/types/state.types.ts";

// Auth
import { State } from "@auth/state/selectors/index.ts";
import { type AuthState } from "@auth/state/index.ts";

// Validators
import { type SignUpBody } from "@local/validators";

export const storeInput: SideEffect<
  Input<SignUpBody>,
  SignUpBody,
  unknown,
  AuthState<SignUpBody>
> = (input, ctx) => {
  State.setInput(ctx, input);
};
