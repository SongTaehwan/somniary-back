import { Context } from "../middlewares/types.ts";
import { RouteState } from "../state/types.ts";

export type Selector<R, T, S extends RouteState<T>> = (
  ctx: Context<T, S>
) => Promise<R> | R;
