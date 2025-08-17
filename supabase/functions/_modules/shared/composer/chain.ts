import { Middleware } from "../middlewares/types.ts";
import { HttpException } from "../error/exception.ts";
import { RouteState } from "../state/types.ts";
import { Selector } from "../selectors/types.ts";
import { Context } from "../middlewares/types.ts";
import { toError } from "../error/normalize.ts";

// Variadic pipeline step: first(ctx) → step(prev, ctx) → ...
export type Step<In, Out, Body, State extends RouteState<Body>> = (
  input: In,
  ctx: Context<Body, State>
) => Promise<Out> | Out;

// 인풋을 받지 않는 첫 단계
export type FirstStep<Out, Body, State extends RouteState<Body>> = (
  ctx: Context<Body, State>
) => Promise<Out> | Out;

// 부수효과 타입
export type SideEffect<Acc, Body, State extends RouteState<Body>> = (
  value: Acc,
  ctx: Context<Body, State>
) => Promise<void> | void;

// Fluent builder for arbitrary-length typed pipelines
export class ChainBuilder<Body, State extends RouteState<Body>, Acc> {
  constructor(
    private readonly run: (ctx: Context<Body, State>) => Promise<Acc> | Acc
  ) {}

  static start<Body, State extends RouteState<Body>, Acc>(
    first: FirstStep<Acc, Body, State>
  ): ChainBuilder<Body, State, Acc> {
    return new ChainBuilder(first);
  }

  // then: 직전 단계의 반환값(Acc)을 다음 단계의 입력으로 전달합니다.
  // 예) 1단계 Out → 2단계 In, 2단계 Out → 3단계 In ... 으로 연쇄됩니다.
  then<Next>(
    nextStep: Step<Acc, Next, Body, State>
  ): ChainBuilder<Body, State, Next> {
    return new ChainBuilder(async (ctx) => {
      const previousStep = await this.run(ctx);
      return nextStep(previousStep, ctx);
    });
  }

  // tap: 직전 단계의 반환값을 변경하지 않고 부수효과만 수행합니다.
  // 이후 단계의 입력은 여전히 이전 단계의 반환값(Acc)입니다.
  tap(fn: SideEffect<Acc, Body, State>): ChainBuilder<Body, State, Acc> {
    return new ChainBuilder(async (ctx) => {
      const value = await this.run(ctx);
      await fn(value, ctx);
      return value;
    });
  }

  // reselect: 직전 단계의 반환값을 무시하고, 컨텍스트에서 새 값을 선택해 다음 단계의 입력으로 전달합니다.
  // 직전 Out 무시, 컨텍스트에서 새 값 선택해 다음 In
  reselect<Next>(
    selector: Selector<Next, Body, State>
  ): ChainBuilder<Body, State, Next> {
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

export function chain<Body, State extends RouteState<Body>, A>(
  first: FirstStep<A, Body, State>
): ChainBuilder<Body, State, A> {
  return ChainBuilder.start(first);
}
