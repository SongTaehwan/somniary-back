// Shared
import { Step } from "@shared/core/chain.ts";
import { Input } from "@shared/types/state.types.ts";

// State
import { FunctionState } from "../../state/state.types.ts";
import { AuthVerifyInput } from "../../validators/validator.ts";

export const selectTokenHash: Step<
  Input<AuthVerifyInput>,
  string,
  AuthVerifyInput,
  FunctionState<AuthVerifyInput>
> = (input, _ctx) => {
  const tokenHash = input.body?.token_hash;

  if (!tokenHash) {
    throw new Error("token_hash_not_found");
  }

  return tokenHash;
};
