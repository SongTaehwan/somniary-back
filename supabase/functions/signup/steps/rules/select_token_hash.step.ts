// Shared
import { Step } from "@shared/core/chain.ts";
import { Input } from "@shared/types/state.types.ts";

// State
import { FunctionState } from "@local/state/index.ts";
import { SignUpBody } from "@local/validators";

export const selectTokenHash: Step<
  Input<SignUpBody>,
  { otpToken: string; email: string },
  SignUpBody,
  unknown,
  FunctionState<SignUpBody>
> = (input, _ctx) => {
  const otpToken = input.body?.otp_token;
  const email = input.body?.email;

  if (!otpToken || !email) {
    throw new Error("required_fields_not_found");
  }

  return {
    otpToken,
    email,
  };
};
