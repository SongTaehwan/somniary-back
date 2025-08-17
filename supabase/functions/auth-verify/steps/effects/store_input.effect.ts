// Shared
import { SideEffect } from "@shared/core/chain.ts";
import { Input } from "@shared/types/state.types.ts";

// State
import { State } from "../../state/index.ts";
import { FunctionState } from "../../state/state.types.ts";

// Validators
import { AuthVerifyInput } from "../../validators/validator.ts";

export const storeInput: SideEffect<
  Input<AuthVerifyInput>,
  AuthVerifyInput,
  FunctionState<AuthVerifyInput>
> = (input, ctx) => {
  State.setInput(ctx, input);
};
