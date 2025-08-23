import { Context } from "./context.types.ts";
import { RouteState } from "./state.types.ts";

export type Next = () => void | Promise<void>;

// Middleware 는 Context 를 통해 다음 미들웨어를 호출하거나 response 값을 전달한다.
export type Middleware<T, Q, S extends RouteState<T, Q>> = (
  ctx: Context<T, Q, S>,
  next: Next
) => void | Promise<void>;

export type InnerMiddleware<
  Args,
  Body,
  Query,
  State extends RouteState<Body, Query>
> = (
  args: Args,
  ctx: Context<Body, Query, State>,
  next: Next
) => Promise<void> | void;

export type FinalHandler<T, Q, S extends RouteState<T, Q>> = (
  ctx: Context<T, Q, S>
) => Response | Promise<Response>;

// Handler 는 직접 Response 를 반환하는 타입이다.
export type Handler = (request: Request) => Response | Promise<Response>;
