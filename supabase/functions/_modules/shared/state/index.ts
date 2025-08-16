import { Context } from "../middlewares/types.ts";
import { Input, KEY_INPUT, RouteState } from "./types.ts";

function setInput<T, S extends RouteState<T>>(
  ctx: Context<T, S>,
  input: Input<T>
): void {
  ctx.state[KEY_INPUT] = input;
}

function getInput<T, S extends RouteState<T>>(ctx: Context<T, S>): Input<T> {
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
