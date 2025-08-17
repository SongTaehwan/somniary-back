import { Middleware } from "./types.ts";
import { BodyParser } from "../utils/parser.type.ts";
import { State } from "../state/index.ts";
import { HttpException } from "../error/exception.ts";
import { RouteState } from "../state/types.ts";
import { task } from "../utils/task.ts";

// middleware 형태로 구현
export const parseInputMiddleware = <T, S extends RouteState<T>>(
  parser?: BodyParser<T>
): Middleware<T, S> => {
  return async (ctx, next) => {
    // 쿼리스트링
    const url = new URL(ctx.request.url);
    // 헤더
    const headers = Object.fromEntries(ctx.request.headers.entries());

    // 바디
    let body: unknown = undefined;

    if (parser) {
      const parsingTask = await task(
        ctx.request.json(),
        "parseInputMiddleware_parse"
      );

      if (parsingTask.failed) {
        ctx.response = HttpException.badRequest("bad_request");
        throw parsingTask.error;
      }

      body = parsingTask.value;
    }

    State.setInput(ctx, {
      headers,
      query: url.searchParams,
      body,
    });

    await next();
  };
};
