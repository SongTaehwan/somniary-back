import { RouteState } from "../state/types.ts";

// Lightweight middleware composition with shared context
export interface Context<T, S extends RouteState<T>> {
  request: Request;
  state: S;
  response?: Response;
}

export type Next = () => void | Promise<void>;
// Middleware 는 Context 를 통해 다음 미들웨어를 호출하거나 response 값을 전달한다.
export type Middleware<T, S extends RouteState<T>> = (
  ctx: Context<T, S>,
  next: Next
) => void | Promise<void>;

export type InnerMiddleware<Args, Body, State extends RouteState<Body>> = (
  args: Args,
  ctx: Context<Body, State>,
  next: Next
) => Promise<void> | void;

export type FinalHandler<T, S extends RouteState<T>> = (
  ctx: Context<T, S>
) => Response | Promise<Response>;

// Handler 는 직접 Response 를 반환하는 타입이다.
export type Handler = (request: Request) => Response | Promise<Response>;
