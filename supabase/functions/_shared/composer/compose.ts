import { HttpException } from "../error/exception.ts";
import {
  Context,
  FinalHandler,
  Handler,
  Middleware,
  Next,
} from "../middlewares/types.ts";
import { RouteState } from "../state/types.ts";

// 미들웨어를 모두 호출 후 마지막 핸들러를 호출
export function compose<T, S extends RouteState<T>>(
  middlewares: Middleware<T, S>[],
  handler: FinalHandler<T, S>
): Handler {
  return async (request: Request) => {
    const ctx: Context<T, S> = { request, state: {} as S };

    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (ctx.response) {
        return;
      }

      if (i <= index) {
        throw new Error("next() called multiple times");
      }

      index = i;

      const fn = i === middlewares.length ? null : middlewares[i];

      if (!fn) {
        return;
      }

      const next: Next = async () => {
        if (ctx.response) {
          return;
        }

        await dispatch(i + 1);
      };

      try {
        await fn(ctx, next);
      } catch (error) {
        if (!ctx.response) {
          ctx.response = HttpException.internalError(
            error instanceof Error ? error.message : undefined
          );
        }

        console.error(
          `[compose_dispatch_error]: ${JSON.stringify(
            error,
            Object.getOwnPropertyNames(error)
          )}`
        );
      }
    };

    await dispatch(0);

    if (ctx.response) {
      return ctx.response;
    }

    try {
      return await handler(ctx);
    } catch (error) {
      console.error(
        `[compose_handler_error]: ${JSON.stringify(
          error,
          Object.getOwnPropertyNames(error)
        )}`
      );

      return HttpException.internalError(
        error instanceof Error ? error.message : undefined
      );
    }
  };
}
