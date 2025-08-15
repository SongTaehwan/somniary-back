import { RouteState } from "../../_shared/state/types.ts";

export const KEY_OTP_DATA: unique symbol = Symbol("otpData");

export type OtpSession = {
  access_token: string;
  refresh_token: string;
};

export type OtpData = {
  session: OtpSession;
};

export interface FunctionState<T> extends RouteState<T> {
  [KEY_OTP_DATA]?: OtpData;
}
