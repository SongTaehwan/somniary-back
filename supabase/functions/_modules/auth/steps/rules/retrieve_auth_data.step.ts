import { Context } from "../../../shared/types/context.types.ts";
import { AuthState, AuthTokens } from "../../state/index.ts";
import { State } from "../../state/selectors/index.ts";

export const retrieveAuthDataStep = <
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
