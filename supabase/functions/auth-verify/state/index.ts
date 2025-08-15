import { Context } from "../../_shared/middlewares/types.ts";
import { State as BaseState } from "../../_shared/state/index.ts";
import {
  FunctionState,
  KEY_OTP_DATA,
  KEY_AUTH_DATA,
  AuthTokens,
  SymbolKey,
} from "./types.ts";

function setData<D>(name: SymbolKey) {
  return <T>(ctx: Context<T, FunctionState<T>>, data: D) => {
    ctx.state[name] = data as never;
  };
}

function getData<D>(name: SymbolKey) {
  return <T>(ctx: Context<T, FunctionState<T>>): D => {
    const data = ctx.state[name];

    if (!data) {
      throw new Error("data_not_initialized");
    }

    return data as D;
  };
}

// TODO: Factory 함수로 변경
export const State = Object.assign(BaseState, {
  setOtpData: setData<AuthTokens>(KEY_OTP_DATA),
  getOtpData: getData<AuthTokens>(KEY_OTP_DATA),
  setAuthData: setData<AuthTokens>(KEY_AUTH_DATA),
  getAuthData: getData<AuthTokens>(KEY_AUTH_DATA),
});
