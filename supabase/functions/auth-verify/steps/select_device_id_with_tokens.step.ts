import { Step } from "../../_modules/shared/composer/chain.ts";
import { AuthVerifyInput } from "../validators/validator.ts";
import { AuthTokens, FunctionState } from "../state/types.ts";
import { selectInputBody } from "../../_modules/shared/selectors/selectors.ts";

export const selectDeviceIdWithTokens: Step<
    AuthTokens,
  { device_id: string; access_token: string; refresh_token: string },
  AuthVerifyInput,
  FunctionState<AuthVerifyInput>
> = ({access_token, refresh_token}, ctx) => {
  const body = selectInputBody(ctx);

  return {
    access_token,
    refresh_token,
    device_id: body.device_id,
  };
};
