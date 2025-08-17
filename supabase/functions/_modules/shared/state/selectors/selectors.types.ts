import { Context } from "../../types/context.types.ts";
import { RouteState } from "../../types/state.types.ts";

export type Selector<R, T, S extends RouteState<T>> = (
  ctx: Context<T, S>
) => Promise<R> | R;
