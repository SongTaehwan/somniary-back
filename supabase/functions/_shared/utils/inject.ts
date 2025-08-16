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

  static start<Body, State extends RouteState<Body>, Acc>(
    first: FirstStep<Acc, Body, State>
  ): ChainBuilder<Body, State, Acc> {
    return new ChainBuilder(first);
  }

  // 다음 단계 추가하고 직전 단계의 아웃풋을 다음 단계의 인풋으로 전달한다.
  then<Next>(nextStep: Step<Acc, Next, Body, State>): ChainBuilder<Body, State, Next> {
    return new ChainBuilder(async (ctx) => {
      const previousStep = await this.run(ctx);
      return nextStep(previousStep, ctx);
    });
  }

  // 다음 단계를 추가하지만, 아웃풋을 그 다음 단계로 전달하지 않는다.
  // 예) 1,2,3 단계가 있을 때,
  // 1. 1단계의 아웃풋을 2단계의 인풋으로 전달한다.
  // 2. 2단계의 아웃풋을 무시한다.
  // 3. 3단계의 인풋으로 1단계의 아웃풋을 전달한다.
  tap(
    fn: (value: Acc, ctx: Context<Body, State>) => Promise<void> | void
  ): ChainBuilder<Body, State, Acc> {
    return new ChainBuilder(async (ctx) => {
      const value = await this.run(ctx);
      await fn(value, ctx);
      return value;
    });
  }

  // 다음 단계를 추가하지만, 인풋을 인자로 받지 않는다.
  reselect<Next>(selector: Selector<Next, Body, State>): ChainBuilder<Body, State, Next> {
    return new ChainBuilder(async (ctx) => {
      await this.run(ctx);
      return selector(ctx);
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

        console.error(
          `[chain_to_middleware_error]: ${JSON.stringify(
            error,
            Object.getOwnPropertyNames(error)
          )}`
        );
      }
    };
  }
}

export function chain<Body, State extends RouteState<Body>, A>(
  first: FirstStep<A, Body, State>
): ChainBuilder<Body, State, A> {
  return ChainBuilder.start(first);
}
