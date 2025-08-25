// Shared
import { type Step } from "@shared/core/chain.ts";
import { type Input } from "@shared/types/state.types.ts";

// State
import { type AuthState } from "@auth/state/index.ts";
import { type SignUpBody } from "@local/validators";

export const selectTokenHash: Step<
  Input<SignUpBody>,
  { otpToken: string; email: string },
  SignUpBody,
  unknown,
  AuthState<SignUpBody>
> = (_ctx, input) => {
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
