import { Context } from "../../_shared/middlewares/types.ts";
import { FunctionState } from "../state/types.ts";
import { AuthVerifyInput } from "../validators/validator.ts";
import { selectInputBody } from "../../_shared/selectors/selectors.ts";
import { State } from "../state/index.ts";

export const selectTokenHash = (
  ctx: Context<AuthVerifyInput, FunctionState<AuthVerifyInput>>
): string => {
  const body = selectInputBody(ctx);
  return body.token_hash;
};

export const selectDeviceIdWithTokens = (
  ctx: Context<AuthVerifyInput, FunctionState<AuthVerifyInput>>
): { device_id: string; access_token: string; refresh_token: string } => {
  const body = selectInputBody(ctx);
  const otpData = State.getOtpData(ctx);

  return {
    device_id: body.device_id,
    access_token: otpData.access_token,
    refresh_token: otpData.refresh_token,
  };
};
