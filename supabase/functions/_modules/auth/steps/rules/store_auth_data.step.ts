import { type Context } from "../../../shared/types/context.types.ts";
import { type RouteState } from "../../../shared/types/state.types.ts";

// State
import { type AuthTokens } from "../../state/index.ts";
import { State } from "../../state/selectors/index.ts";

export function storeAuthDataStep<
  Acc extends AuthTokens,
  Body,
  Query,
  State extends RouteState<Body, Query> = RouteState<Body, Query>
>(ctx: Context<Body, Query, State>, value: Acc): void {
  State.setAuthData(ctx, value);
}
