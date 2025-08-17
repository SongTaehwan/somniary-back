import { Context } from "../../types/context.types.ts";
import { State, type RouteState } from "../index.ts";

export const selectInputBody = <T, S extends RouteState<T>>(
  ctx: Context<T, S>
): T => {
  const input = State.getInput<T, S>(ctx);

  if (!input.body) {
    throw new Error("body_not_found");
  }

  return input.body;
};
