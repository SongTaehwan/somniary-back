import { Context } from "../../types/context.types.ts";
import { RouteState } from "../../types/state.types.ts";

export type Selector<R, T, Q, S extends RouteState<T, Q>> = (
  ctx: Context<T, Q, S>
) => Promise<R> | R;
