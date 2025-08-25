import { type SideEffect } from "../../../shared/core/chain.ts";

// State
import { type AuthState } from "../../state/index.ts";
import { type AuthTokens } from "../../state/index.ts";
import { State } from "../../state/selectors/index.ts";

export function storeAuthData<Body, Query>(): SideEffect<
  AuthTokens,
  Body,
  Query,
  AuthState<Body, Query>
> {
  return (ctx, auth) => {
    State.setAuthData(ctx, auth);
  };
}
