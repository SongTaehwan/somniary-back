// Shared
import { SideEffect } from "@shared/core/chain.ts";
import { Input } from "@shared/types/state.types.ts";

// State
import { State } from "@local/state/selectors/index.ts";
import { FunctionState } from "@local/state/index.ts";

// Validators
import { SignUpBody } from "@local/validators";

export const storeInput: SideEffect<
  Input<SignUpBody>,
  SignUpBody,
  unknown,
  FunctionState<SignUpBody>
> = (input, ctx) => {
  State.setInput(ctx, input);
};
