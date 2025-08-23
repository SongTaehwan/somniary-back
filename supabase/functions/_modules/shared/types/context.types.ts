import { RouteState } from "./state.types.ts";

// Lightweight middleware composition with shared context
export interface Context<T, Q, S extends RouteState<T, Q>> {
  request: Request;
  state: S;
  response?: Response;
}
