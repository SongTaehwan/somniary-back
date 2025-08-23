// Shared
import { Context } from "@shared/types/context.types.ts";
import { State as BaseState } from "@shared/state/index.ts";

// State
import {
  FunctionState,
  KEY_AUTH_DATA,
  AuthTokens,
  SymbolKey,
} from "@local/state/state.types.ts";

function setData<D>(name: SymbolKey) {
  return <T, Q>(ctx: Context<T, Q, FunctionState<T, Q>>, data: D) => {
    ctx.state[name] = data as never;
  };
}

function getData<D>(name: SymbolKey) {
  return <T, Q>(ctx: Context<T, Q, FunctionState<T, Q>>): D => {
    const data = ctx.state[name];

    if (!data) {
      throw new Error("data_not_initialized");
    }

    return data as D;
  };
}

// TODO: Factory 함수로 변경
export const State = Object.assign(BaseState, {
  setAuthData: setData<AuthTokens>(KEY_AUTH_DATA),
  getAuthData: getData<AuthTokens>(KEY_AUTH_DATA),
});
