import { Input } from "../../../_modules/shared/state/types.ts";
import { SideEffect } from "../../../_modules/shared/composer/chain.ts";
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
