import { SideEffect } from "../../../_modules/shared/composer/chain.ts";
import { State } from "../../state/index.ts";
import { AuthTokens, FunctionState } from "../../state/types.ts";
import { AuthVerifyInput } from "../../validators/validator.ts";

export const storeAuth: SideEffect<
  AuthTokens,
  AuthVerifyInput,
  FunctionState<AuthVerifyInput>
> = (auth, ctx) => {
  State.setAuthData(ctx, auth);
};
