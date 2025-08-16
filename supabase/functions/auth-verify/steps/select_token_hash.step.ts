import { Step } from "../../_shared/utils/inject.ts";
import { AuthVerifyInput } from "../validators/validator.ts";
import { FunctionState } from "../state/types.ts";
import { Input } from "../../_shared/state/types.ts";
import { HttpException } from "../../_shared/error/exception.ts";

export const selectTokenHash: Step<
  Input<AuthVerifyInput>,
  string,
  AuthVerifyInput,
  FunctionState<AuthVerifyInput>
> = (input, ctx) => {
  const tokenHash = input.body?.token_hash;
  
  if (!tokenHash) {
    ctx.response = HttpException.badRequest("token_hash_not_found");
    throw new Error("token_hash_not_found");
  }

  return tokenHash;
};
