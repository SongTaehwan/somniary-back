// Shared
import { type Step } from "@shared/core/chain.ts";
import { selectInputBody } from "@shared/state/selectors/index.ts";

// State
import { type AuthState } from "@auth/state/index.ts";
import { type AuthTokens } from "@auth/state/index.ts";
import { type SignUpBody } from "@local/validators";

type Output = {
  device_id: string;
  access_token: string;
  refresh_token: string;
};

export const selectDeviceIdWithTokens: Step<
  AuthTokens,
  Output,
  SignUpBody,
  unknown,
  AuthState<SignUpBody>
> = (ctx, { access_token, refresh_token }) => {
  const body = selectInputBody(ctx);

  return {
    access_token,
    refresh_token,
    device_id: body.device_id,
  };
};
