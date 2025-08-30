import { HttpException } from "../../adapters/http/format/exception.ts";
import { Context } from "../../types/context.types.ts";
import { State, type RouteState } from "../index.ts";

export const selectRequestBodyStep = <T, Q, S extends RouteState<T, Q>>(
  ctx: Context<T, Q, S>
): T => {
  const input = State.getInput<T, Q, S>(ctx);

  if (!input.body) {
    ctx.response = HttpException.badRequest("Invalid payload");
    throw new Error("Invalid request body", { cause: "body_not_found" });
  }

  return input.body;
};
