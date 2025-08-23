import { type Middleware } from "../../../types/middleware.types.ts";
import { type RouteState } from "../../../types/state.types.ts";

import { State } from "../../../state/index.ts";
import { HttpException } from "../format/exception.ts";
import { task } from "../../../utils/task.ts";
import { BodyParser, QueryParser } from "../../../types/parser.type.ts";

export const parseInputMiddleware = <
  Body,
  Query,
  State extends RouteState<Body, Query>
>({
  bodyParser,
  queryParser,
}: {
  bodyParser?: BodyParser<Body>;
  queryParser?: QueryParser<Query>;
}): Middleware<Body, Query, State> => {
  return async (ctx, next) => {
    const url = new URL(ctx.request.url);
    const headers = ctx.request.headers;
    let body: unknown = undefined;

    if (bodyParser) {
      const parsingTask = await task(
        bodyParser(await ctx.request.json()),
        "parseInputMiddleware_parse_body"
      );

      if (parsingTask.failed) {
        ctx.response = HttpException.badRequest("invalid payload");
        throw parsingTask.error;
      }

      body = parsingTask.value;
    }

    let query: Query | undefined = undefined;

    if (queryParser) {
      const parsingTask = await task(
        queryParser(url.searchParams),
        "parseInputMiddleware_parse_query"
      );

      if (parsingTask.failed) {
        ctx.response = HttpException.badRequest("invalid query");
        throw parsingTask.error;
      }

      query = parsingTask.value;
    }

    State.setInput(ctx, {
      headers,
      query,
      body,
    });

    await next();
  };
};
