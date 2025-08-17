// Shared
import { Step } from "@shared/core/chain.ts";
import { selectInputBody } from "@shared/state/selectors/index.ts";

// State
import { AuthTokens, FunctionState } from "../../state/state.types.ts";
import { AuthVerifyInput } from "../../validators/validator.ts";

export const selectDeviceIdWithTokens: Step<
  AuthTokens,
  { device_id: string; access_token: string; refresh_token: string },
  AuthVerifyInput,
  FunctionState<AuthVerifyInput>
> = ({ access_token, refresh_token }, ctx) => {
  const body = selectInputBody(ctx);

  return {
    access_token,
    refresh_token,
    device_id: body.device_id,
  };
};
