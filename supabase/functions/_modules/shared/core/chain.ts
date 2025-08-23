import { Middleware } from "../types/middleware.types.ts";
import { HttpException } from "../adapters/http/error/exception.ts";
import { Context } from "../types/context.types.ts";
import { toError } from "../adapters/http/error/normalize.ts";
import { RouteState } from "../types/state.types.ts";
import { Selector } from "../state/selectors/selectors.types.ts";

// Variadic pipeline step: first(ctx) → step(prev, ctx) → ...
export type Step<
  In,
  Out,
  Body,
  Query,
  State extends RouteState<Body, Query>
> = (input: In, ctx: Context<Body, Query, State>) => Promise<Out> | Out;

// 인풋을 받지 않는 첫 단계
export type FirstStep<
  Out,
  Body,
  Query,
  State extends RouteState<Body, Query>
> = (ctx: Context<Body, Query, State>) => Promise<Out> | Out;

// 부수효과 타입
export type SideEffect<
  Acc,
  Body,
  Query,
  State extends RouteState<Body, Query>
> = (value: Acc, ctx: Context<Body, Query, State>) => Promise<void> | void;

// Fluent builder for arbitrary-length typed pipelines
export class ChainBuilder<
  Body,
  Query,
  State extends RouteState<Body, Query>,
  Acc
> {
  constructor(
    private readonly run: (
      ctx: Context<Body, Query, State>
    ) => Promise<Acc> | Acc
  ) {}

  static start<Body, Query, State extends RouteState<Body, Query>, Acc>(
    first: FirstStep<Acc, Body, Query, State>
  ): ChainBuilder<Body, Query, State, Acc> {
    return new ChainBuilder(first);
  }

  // then: 직전 단계의 반환값(Acc)을 다음 단계의 입력으로 전달합니다.
  // 예) 1단계 Out → 2단계 In, 2단계 Out → 3단계 In ... 으로 연쇄됩니다.
  then<Next>(
    nextStep: Step<Acc, Next, Body, Query, State>
  ): ChainBuilder<Body, Query, State, Next> {
    return new ChainBuilder(async (ctx) => {
      const previousStep = await this.run(ctx);
      return nextStep(previousStep, ctx);
    });
  }

  // tap: 직전 단계의 반환값을 변경하지 않고 부수효과만 수행합니다.
  // 이후 단계의 입력은 여전히 이전 단계의 반환값(Acc)입니다.
  tap(
    fn: SideEffect<Acc, Body, Query, State>
  ): ChainBuilder<Body, Query, State, Acc> {
    return new ChainBuilder(async (ctx) => {
      const value = await this.run(ctx);
      await fn(value, ctx);
      return value;
    });
  }

  // reselect: 직전 단계의 반환값을 무시하고, 컨텍스트에서 새 값을 선택해 다음 단계의 입력으로 전달합니다.
  // 직전 Out 무시, 컨텍스트에서 새 값 선택해 다음 In
  reselect<Next>(
    selector: Selector<Next, Body, Query, State>
  ): ChainBuilder<Body, Query, State, Next> {
    return new ChainBuilder(async (ctx) => {
      await this.run(ctx);
      return selector(ctx);
    });
  }

  toMiddleware(): Middleware<Body, Query, State> {
    return async (ctx, next) => {
      try {
        await this.run(ctx);
        await next();
      } catch (err) {
        const error = toError(err);

        if (!ctx.response) {
          ctx.response = HttpException.internalError(error.message);
        }

        console.error(
          `[chain_to_middleware_error]\n`,
          `Causion: ${error.cause ?? "unknown"}\n`,
          `${error.stack}`
        );
      }
    };
  }
}

export function chain<Body, Query, State extends RouteState<Body, Query>, Acc>(
  first: FirstStep<Acc, Body, Query, State>
): ChainBuilder<Body, Query, State, Acc> {
  return ChainBuilder.start(first);
}
