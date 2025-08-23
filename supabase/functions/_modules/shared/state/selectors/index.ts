import { Context } from "../../types/context.types.ts";
import { State, type RouteState } from "../index.ts";

export const selectInputBody = <T, Q, S extends RouteState<T, Q>>(
  ctx: Context<T, Q, S>
): T => {
  const input = State.getInput<T, Q, S>(ctx);

  if (!input.body) {
    throw new Error("body_not_found");
  }

  return input.body;
};
