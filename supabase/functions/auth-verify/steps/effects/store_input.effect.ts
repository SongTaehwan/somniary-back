import { Input } from "../../../_shared/state/types.ts";
import { SideEffect } from "../../../_shared/composer/chain.ts";
import { AuthVerifyInput } from "../../validators/validator.ts";
import { FunctionState } from "../../state/types.ts";
import { State } from "../../state/index.ts";

export const storeInput: SideEffect<
  Input<AuthVerifyInput>,
  AuthVerifyInput,
  FunctionState<AuthVerifyInput>
> = (input, ctx) => {
  State.setInput(ctx, input);
};
