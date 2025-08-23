// Shared
import { Step } from "../../../core/chain.ts";
import { HttpException } from "../format/exception.ts";

// Types
import { Input, RouteState } from "../../../types/state.types.ts";

export function selectBodyStep<
  Body,
  Query,
  State extends RouteState<Body, Query>
>(): Step<Input<Body, Query>, Body, Body, Query, State> {
  return (input, ctx) => {
    const body = input.body;

    if (!body) {
      ctx.response = HttpException.badRequest("Invalid payload");
      throw new Error("Invalid request body");
    }

    return body;
  };
}
