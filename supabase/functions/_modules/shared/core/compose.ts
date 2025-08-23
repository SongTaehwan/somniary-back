import { HttpException } from "../adapters/http/format/exception.ts";
import { toError } from "../adapters/http/format/normalize.ts";
import {
  FinalHandler,
  Handler,
  Middleware,
  Next,
} from "../types/middleware.types.ts";
import { type RouteState } from "../types/state.types.ts";
import { type Context } from "../types/context.types.ts";

// 미들웨어를 모두 호출 후 마지막 핸들러를 호출
export function compose<T, Q, S extends RouteState<T, Q>>(
  middlewares: Middleware<T, Q, S>[],
  handler: FinalHandler<T, Q, S>
): Handler {
  return async (request: Request) => {
    const ctx: Context<T, Q, S> = { request, state: {} as S };

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
      } catch (err) {
        const error = toError(err);

        if (!ctx.response) {
          ctx.response = HttpException.internalError(error.message);
        }

        console.error(
          `[compose_dispatch_error]\n`,
          `Causion: ${error.cause ?? "unknown"}\n`,
          `${error.stack}`
        );
      }
    };

    await dispatch(0);

    if (ctx.response) {
      return ctx.response;
    }

    try {
      return await handler(ctx);
    } catch (err) {
      const error = toError(err);

      console.error(
        `[compose_handler_error]\n`,
        `Causion: ${error.cause ?? "unknown"}\n`,
        `${error.stack}`
      );

      return HttpException.internalError(
        error instanceof Error ? error.message : undefined
      );
    }
  };
}
