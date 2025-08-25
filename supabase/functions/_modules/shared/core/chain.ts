import { Middleware } from "../types/middleware.types.ts";
import { HttpException } from "../adapters/http/format/exception.ts";
import { Context } from "../types/context.types.ts";
import { toError } from "../adapters/http/format/normalize.ts";
import { RouteState } from "../types/state.types.ts";
import { Selector } from "../state/selectors/selectors.types.ts";

// Variadic pipeline step: first(ctx) → step(prev, ctx) → ...
export type Step<
  In,
  Out,
  Body = unknown,
  Query = unknown,
  State extends RouteState<Body, Query> = RouteState<Body, Query>
> = (ctx: Context<Body, Query, State>, input: In) => Promise<Out> | Out;

// 인풋을 받지 않는 첫 단계
export type FirstStep<
  Out,
  Body = unknown,
  Query = unknown,
  State extends RouteState<Body, Query> = RouteState<Body, Query>
> = (ctx: Context<Body, Query, State>) => Promise<Out> | Out;

// 부수효과 타입
export type SideEffect<
  Acc,
  Body = unknown,
  Query = unknown,
  State extends RouteState<Body, Query> = RouteState<Body, Query>
> = (ctx: Context<Body, Query, State>, value: Acc) => Promise<void> | void;

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

  then<Next>(
    nextStep: Step<Acc, Next, Body, Query, State>
  ): ChainBuilder<Body, Query, State, Next> {
    return new ChainBuilder(async (ctx) => {
      const previousStep = await this.run(ctx);
      return nextStep(ctx, previousStep);
    });
  }

  // 직전 단계와 다음 단계의 결과를 사용자가 직접 병합합니다.
  merge<Next, R>(
    nextStep: Step<Acc, Next, Body, Query, State>,
    mergeFn: (previousStep: Acc, nextStepResult: Next) => R | Promise<R>
  ): ChainBuilder<Body, Query, State, R> {
    return new ChainBuilder(async (ctx) => {
      const previousStep = await this.run(ctx);
      const nextStepResult = await nextStep(ctx, previousStep);
      return mergeFn(previousStep, nextStepResult);
    });
  }

  // 직전 단계와 다음 단계의 결과를 그대로 병합합니다.
  mergeWith<Next>(
    nextStep: Step<Acc, Next, Body, Query, State>
  ): ChainBuilder<Body, Query, State, Acc & Next> {
    return new ChainBuilder(async (ctx) => {
      const previousStep = await this.run(ctx);
      const nextStepResult = await nextStep(ctx, previousStep);
      return {
        ...previousStep,
        ...nextStepResult,
      };
    });
  }

  // 직전 단계의 결과를 변환합니다.
  map<R>(
    mapFn: (previousStep: Acc) => R | Promise<R>
  ): ChainBuilder<Body, Query, State, R> {
    return new ChainBuilder(async (ctx) => {
      const previousStep = await this.run(ctx);
      return mapFn(previousStep);
    });
  }

  // tap: 직전 단계의 반환값을 변경하지 않고 부수효과만 수행합니다.
  // 이후 단계의 입력은 여전히 이전 단계의 반환값(Acc)입니다.
  tap(
    fn: SideEffect<Acc, Body, Query, State>
  ): ChainBuilder<Body, Query, State, Acc> {
    return new ChainBuilder(async (ctx) => {
      const value = await this.run(ctx);
      await fn(ctx, value);
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
