// Types
import { type Middleware } from "../types/middleware.types.ts";
import { type Context } from "../types/context.types.ts";
import { type RouteState } from "../types/state.types.ts";

// Adapters
import { HttpException } from "../adapters/http/format/exception.ts";
import { toError } from "../adapters/http/format/normalize.ts";

// State
import { Selector } from "../state/selectors/selectors.types.ts";

// Utils
import { task, TaskResult } from "../utils/task.ts";
import { maskSensitiveData } from "../utils/security.ts";

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

type ChainBuilderOptions = {
  debugMode: boolean;
  debugLabel: string;
};

// Fluent builder for arbitrary-length typed pipelines
export class ChainBuilder<
  Body,
  Query,
  State extends RouteState<Body, Query>,
  Acc
> {
  private debugMode: boolean;
  private debugLabel: string;

  constructor(
    private readonly run: (
      ctx: Context<Body, Query, State>
    ) => Promise<Acc> | Acc,
    options?: ChainBuilderOptions
  ) {
    this.debugLabel = options?.debugLabel ?? "";
    this.debugMode = options?.debugMode ?? false;
  }

  static start<Body, Query, State extends RouteState<Body, Query>, Acc>(
    first: FirstStep<Acc, Body, Query, State>,
    options?: ChainBuilderOptions
  ): ChainBuilder<Body, Query, State, Acc> {
    return new ChainBuilder(first, options);
  }

  then<Next>(
    nextStep: Step<Acc, Next, Body, Query, State>,
    label: string = "Anonymous Step"
  ): ChainBuilder<Body, Query, State, Next> {
    return new ChainBuilder(
      async (ctx) => {
        const previousStep = await task(this.run(ctx), {
          labelForError: label,
          throwError: true,
        });
        this.logTask(previousStep, label);
        return nextStep(ctx, previousStep.value);
      },
      {
        debugMode: this.debugMode,
        debugLabel: this.debugLabel,
      }
    );
  }

  // 지연 평가: Step 생성을 실행 시점까지 지연시켜 런타임 의존성 관리
  lazyThen<Next>(
    stepFactory: (
      ctx: Context<Body, Query, State>,
      input: Acc
    ) => Step<Acc, Next, Body, Query, State>,
    label: string = "Anonymous Lazy Step"
  ): ChainBuilder<Body, Query, State, Next> {
    return new ChainBuilder(
      async (ctx) => {
        const previousStep = await task(this.run(ctx), {
          labelForError: label,
          throwError: true,
        });
        this.logTask(previousStep, label);

        // 실행 시점에 Step 생성 및 실행
        const dynamicStep = stepFactory(ctx, previousStep.value);
        return dynamicStep(ctx, previousStep.value);
      },
      {
        debugMode: this.debugMode,
        debugLabel: this.debugLabel,
      }
    );
  }

  zipWith<Next, R>(
    nextStep: Step<Acc, Next, Body, Query, State>,
    combiner: (previousStep: Acc, nextStepResult: Next) => R | Promise<R>,
    label: string = "Anonymous Zip With Step"
  ): ChainBuilder<Body, Query, State, R> {
    return new ChainBuilder(
      async (ctx) => {
        const previousStep = await task(this.run(ctx), {
          labelForError: label,
          throwError: true,
        });
        this.logTask(previousStep, label);

        const nextStepResult = await task(nextStep(ctx, previousStep.value), {
          labelForError: label,
          throwError: true,
        });

        this.logTask(nextStepResult, label);
        return combiner(previousStep.value, nextStepResult.value);
      },
      {
        debugMode: this.debugMode,
        debugLabel: this.debugLabel,
      }
    );
  }

  // 직전 단계의 결과를 변환합니다.
  map<R>(
    mapFn: (previousStep: Acc) => R | Promise<R>,
    label: string = "Anonymous Map Step"
  ): ChainBuilder<Body, Query, State, R> {
    return new ChainBuilder(
      async (ctx) => {
        const previousStep = await task<Acc>(this.run(ctx), {
          labelForError: label,
          throwError: true,
        });
        this.logTask(previousStep, label);
        const mappedResult = await task(mapFn(previousStep.value), {
          labelForError: label,
          throwError: true,
        });
        this.logTask(mappedResult, label);

        return mappedResult.value;
      },
      {
        debugMode: this.debugMode,
        debugLabel: this.debugLabel,
      }
    );
  }

  // tap: 직전 단계의 반환값을 변경하지 않고 부수효과만 수행합니다.
  // 이후 단계의 입력은 여전히 이전 단계의 반환값(Acc)입니다.
  tap(
    fn: SideEffect<Acc, Body, Query, State>,
    label: string = "Anonymous Tap Step"
  ): ChainBuilder<Body, Query, State, Acc> {
    return new ChainBuilder(
      async (ctx) => {
        const result = await task(this.run(ctx), {
          labelForError: label,
          throwError: true,
        });
        this.logTask(result, label);

        await fn(ctx, result.value);
        return result.value;
      },
      {
        debugMode: this.debugMode,
        debugLabel: this.debugLabel,
      }
    );
  }

  // reselect: 직전 단계의 반환값을 무시하고, 컨텍스트에서 새 값을 선택해 다음 단계의 입력으로 전달합니다.
  // 직전 Out 무시, 컨텍스트에서 새 값 선택해 다음 In
  reselect<Next>(
    selector: Selector<Next, Body, Query, State>,
    label: string = "Anonymous Reselect Step"
  ): ChainBuilder<Body, Query, State, Next> {
    return new ChainBuilder(
      async (ctx) => {
        const result = await task(this.run(ctx), {
          labelForError: label,
          throwError: true,
        });
        this.logTask(result, label);
        return selector(ctx);
      },
      {
        debugMode: this.debugMode,
        debugLabel: this.debugLabel,
      }
    );
  }

  toMiddleware(): Middleware<Body, Query, State> {
    return async (ctx, next) => {
      try {
        console.log("Chain Sequence Started");
        await this.run(ctx);
        console.log("Chain Sequence Finished");
        await next();
      } catch (err) {
        console.warn("chain sequence catched error");
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

  // start debug mode and set label for debug log
  debug(label: string): ChainBuilder<Body, Query, State, Acc> {
    return new ChainBuilder(this.run, {
      debugMode: true,
      debugLabel: label,
    });
  }

  // log task result if debug mode is enabled
  private logTask<T>(taskResult: TaskResult<T>, label: string): void {
    if (!this.debugMode) {
      return;
    }

    if (taskResult.success) {
      // 민감한 데이터를 마스킹하여 로깅
      const maskedValue = this.maskLogData(taskResult.value);
      console.log(
        `[${this.debugLabel}_${label}] task success\n`,
        JSON.stringify(maskedValue, null, 4)
      );
    } else {
      console.log(
        `[${this.debugLabel}_${label}] task failed\n`,
        JSON.stringify(taskResult.error, null, 4)
      );
    }
  }

  // 로깅 시 민감한 데이터 마스킹
  private maskLogData<T>(data: T): T {
    if (typeof data !== "object" || data === null) {
      return data;
    }

    // 객체나 배열인 경우 민감 정보 마스킹
    if (Array.isArray(data)) {
      return data.map((item) => this.maskLogData(item)) as T;
    }

    return maskSensitiveData(data as Record<string, unknown>) as T;
  }
}

export function chain<Body, Query, State extends RouteState<Body, Query>, Acc>(
  first: FirstStep<Acc, Body, Query, State>,
  options?: ChainBuilderOptions
): ChainBuilder<Body, Query, State, Acc> {
  return ChainBuilder.start(first, options);
}
