export const KEY_INPUT: unique symbol = Symbol("input");

export type Input<Body, Query = unknown> = {
  headers: Headers;
  query?: Query;
  body?: Body;
};

export interface RouteState<Body = unknown, Query = unknown> {
  [KEY_INPUT]?: Input<Body, Query>;
}
