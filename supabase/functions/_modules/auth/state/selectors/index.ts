// Shared
import { type Context } from "../../../shared/types/context.types.ts";
import { State as BaseState } from "../../../shared/state/index.ts";

// State
import {
  type AuthState,
  type AuthTokens,
  KEY_AUTH_DATA,
  SymbolKey,
} from "../index.ts";

function setData<D>(name: SymbolKey) {
  return <T, Q>(ctx: Context<T, Q, AuthState<T, Q>>, data: D) => {
    ctx.state[name] = data as never;
  };
}

function getData<D>(name: SymbolKey) {
  return <T, Q>(ctx: Context<T, Q, AuthState<T, Q>>): D => {
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

export const selectAuthData = <
  Body,
  Query,
  State extends AuthState<Body, Query>
>(
  ctx: Context<Body, Query, State>
): AuthTokens => {
  const body = State.getAuthData(ctx);

  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
  };
};
