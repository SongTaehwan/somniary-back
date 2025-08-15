import { Context } from "../../_shared/middlewares/types.ts";
import { FunctionState, OtpSession } from "../state/types.ts";
import { State } from "../state/index.ts";
import { AuthVerifyInput } from "../validators/validator.ts";

export const selectOtpSession = (
  ctx: Context<AuthVerifyInput, FunctionState<AuthVerifyInput>>
): OtpSession => {
  const otp = State.getOtpData(ctx);
  return otp.session;
};
