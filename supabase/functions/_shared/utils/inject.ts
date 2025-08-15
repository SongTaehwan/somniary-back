import { Middleware, InnerMiddleware } from "../middlewares/types.ts";
import { HttpException } from "../error/exception.ts";
import { RouteState } from "../state/types.ts";
import { Selector } from "../selectors/types.ts";

// 미들웨어 브릿지: 입력 데이터 추출 후 다음 미들웨어 호출
export function inject<A, S extends RouteState<A>>(
  select: Selector<A, S>,
  inner: InnerMiddleware<A, S>
): Middleware<A, S> {
  return async (ctx, next) => {
    try {
      const args = await select(ctx);
      await inner(args, ctx, next);
    } catch (error) {
      if (!ctx.response) {
        ctx.response = HttpException.badRequest(
          error instanceof Error ? error.message : "invalid_input"
        );
      }
    }
  };
}
