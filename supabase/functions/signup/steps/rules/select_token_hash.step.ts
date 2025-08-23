// Shared
import { Step } from "@shared/core/chain.ts";
import { Input } from "@shared/types/state.types.ts";

// State
import { FunctionState } from "@local/state/index.ts";
import { SignUpBody } from "@local/validators";

export const selectTokenHash: Step<
  Input<SignUpBody>,
  string,
  SignUpBody,
  unknown,
  FunctionState<SignUpBody>
> = (input, _ctx) => {
  const tokenHash = input.body?.token_hash;

  if (!tokenHash) {
    throw new Error("token_hash_not_found");
  }

  return tokenHash;
};
