import { Context } from "../types/context.types.ts";
import { Input, KEY_INPUT, RouteState } from "../types/state.types.ts";

export type { Input, RouteState };

function setInput<T, Q, S extends RouteState<T, Q>>(
  ctx: Context<T, Q, S>,
  input: Input<T, Q>
): void {
  ctx.state[KEY_INPUT] = input;
}

function getInput<T, Q, S extends RouteState<T, Q>>(
  ctx: Context<T, Q, S>
): Input<T, Q> {
  const input = ctx.state[KEY_INPUT];

  if (!input) {
    throw new Error("input_not_initialized");
  }

  return input;
}

// 헬퍼
export const State = {
  setInput,
  getInput,
};
