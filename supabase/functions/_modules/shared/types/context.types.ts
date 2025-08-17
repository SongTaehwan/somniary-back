import { RouteState } from "./state.types.ts";

// Lightweight middleware composition with shared context
export interface Context<T, S extends RouteState<T>> {
  request: Request;
  state: S;
  response?: Response;
}
