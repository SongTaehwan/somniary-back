import { State } from "../../../state/index.ts";
import { Context } from "../../../types/context.types.ts";
import { Input, RouteState } from "../../../types/state.types.ts";

export const storeRequestInputStep = <T, Q, S extends RouteState<T, Q>>(
  ctx: Context<T, Q, S>,
  input: Input<T, Q>
) => {
  State.setInput(ctx, input);
};
