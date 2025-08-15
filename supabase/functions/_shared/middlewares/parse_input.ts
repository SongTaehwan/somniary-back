// If zod is not available in this environment, replace with `null` and skip body validation
import { Middleware } from "./types.ts";
import { RouteState } from "../state/types.ts";
import { State } from "../state/index.ts";
import { HttpException } from "../error/exception.ts";

type Parser<T> = (raw: unknown) => T | Promise<T>;

export const parseInput = <T, S extends RouteState<T>>(parser?: Parser<T>): Middleware<T, S> => {
  return async (ctx, next) => {
    // 쿼리스트링
    const url = new URL(ctx.request.url);
    // 헤더
    const headers = Object.fromEntries(ctx.request.headers.entries());

    // 바디
    let body: unknown = undefined;

    if (parser) {
      try {
        const raw = await ctx.request.json();
        body = await parser(raw);
      } catch (error) {
        ctx.response = HttpException.badRequest(
          error instanceof Error ? error.message : "bad_request"
        );

        return;
      }
    }

    State.setInput(ctx, {
      headers,
      query: url.searchParams,
      body,
    });

    await next();
  };
};
