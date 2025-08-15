import { Context } from "../../_shared/middlewares/types.ts";
import { State as BaseState } from "../../_shared/state/index.ts";
import { FunctionState, KEY_OTP_DATA, OtpData } from "./types.ts";

function setOtpData<T>(ctx: Context<T, FunctionState<T>>, data: OtpData): void {
  ctx.state[KEY_OTP_DATA] = data;
}

function getOtpData<T>(ctx: Context<T, FunctionState<T>>): OtpData {
  const data = ctx.state[KEY_OTP_DATA];

  if (!data) {
    throw new Error("otp_data_not_initialized");
  }

  return data;
}

// TODO: Factory 함수로 변경
export const State = Object.assign(BaseState, {
  setOtpData,
  getOtpData,
});
