import { Context } from "../../_shared/middlewares/types.ts";
import { FunctionState } from "../state/types.ts";
import { AuthVerifyInput } from "../validators/validator.ts";
import { selectInputBody } from "../../_shared/selectors/selectors.ts";

export const selectTokenHash = (
  ctx: Context<AuthVerifyInput, FunctionState<AuthVerifyInput>>
): string => {
  const body = selectInputBody(ctx);
  return body.token_hash;
};

export const selectDeviceId = (
  ctx: Context<AuthVerifyInput, FunctionState<AuthVerifyInput>>
): string => {
  const body = selectInputBody(ctx);
  return body.device_id;
};
