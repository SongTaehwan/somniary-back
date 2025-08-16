export const KEY_INPUT: unique symbol = Symbol("input");

export type Input<Body> = {
  headers: Record<string, string>;
  query: URLSearchParams;
  body?: Body;
};

export interface RouteState<Body> {
  [KEY_INPUT]?: Input<Body>;
}
