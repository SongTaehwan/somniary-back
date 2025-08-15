import { Middleware } from "../middlewares/types.ts";
import { HttpException } from "../error/exception.ts";
import { RouteState } from "../state/types.ts";
import { Selector } from "../selectors/types.ts";
import { Context } from "../middlewares/types.ts";

// Variadic pipeline step: first(ctx) → step(prev, ctx) → ...
export type Step<In, Out, Body, State extends RouteState<Body>> = (
  input: In,
  ctx: Context<Body, State>
) => Promise<Out> | Out;

// 인풋을 받지 않는 첫 단계
export type FirstStep<Out, Body, State extends RouteState<Body>> = (
  ctx: Context<Body, State>
) => Promise<Out> | Out;

// Fluent builder for arbitrary-length typed pipelines
export class ChainBuilder<Body, State extends RouteState<Body>, Acc> {
  constructor(private readonly run: (ctx: Context<Body, State>) => Promise<Acc> | Acc) {}

  static start<Body, State extends RouteState<Body>, A>(
    first: FirstStep<A, Body, State>
  ): ChainBuilder<Body, State, A> {
    return new ChainBuilder((ctx) => first(ctx));
  }

  then<Next>(step: Step<Acc, Next, Body, State>): ChainBuilder<Body, State, Next> {
    return new ChainBuilder(async (ctx) => {
      const prev = await this.run(ctx);
      return step(prev, ctx);
    });
  }

  tap(
    fn: (value: Acc, ctx: Context<Body, State>) => Promise<void> | void
  ): ChainBuilder<Body, State, Acc> {
    return new ChainBuilder(async (ctx) => {
      const value = await this.run(ctx);
      await fn(value, ctx);
      return value;
    });
  }

  reselect<Next>(sel: Selector<Next, Body, State>): ChainBuilder<Body, State, Next> {
    return new ChainBuilder(async (ctx) => {
      await this.run(ctx);
      return sel(ctx);
    });
  }

  toMiddleware(): Middleware<Body, State> {
    return async (ctx, next) => {
      try {
        await this.run(ctx);
        await next();
      } catch (error) {
        if (!ctx.response) {
          ctx.response = HttpException.badRequest(
            error instanceof Error ? error.message : "invalid_input"
          );
        }
      }
    };
  }
}

export function chain<Body, State extends RouteState<Body>, A>(
  first: FirstStep<A, Body, State>
): ChainBuilder<Body, State, A> {
  return ChainBuilder.start(first);
}
