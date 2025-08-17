// Shared
import { SideEffect } from "@shared/core/chain.ts";
import { Input } from "@shared/types/state.types.ts";

// State
import { State } from "@local/state/index.ts";
import { FunctionState } from "@local/state/state.types.ts";

// Validators
import { AuthVerifyInput } from "@local/validators/validator.ts";

export const storeInput: SideEffect<
  Input<AuthVerifyInput>,
  AuthVerifyInput,
  FunctionState<AuthVerifyInput>
> = (input, ctx) => {
  State.setInput(ctx, input);
};
