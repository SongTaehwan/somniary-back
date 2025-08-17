import { Context } from "../../middlewares/types.ts";
import { State } from "../index.ts";
import { type RouteState } from "../types.ts";

export const selectInputBody = <T, S extends RouteState<T>>(
  ctx: Context<T, S>
): T => {
  const input = State.getInput<T, S>(ctx);

  if (!input.body) {
    throw new Error("body_not_found");
  }

  return input.body;
};
