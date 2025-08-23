import { Input, RouteState } from "../../../types/state.types.ts";
import { HttpException } from "../error/exception.ts";
import { FirstStep } from "../../../core/chain.ts";

import { task } from "../../../utils/task.ts";
import { BodyParser, QueryParser } from "../../../types/parser.type.ts";

export const parseInputStep = <
  Body,
  Query,
  State extends RouteState<Body, Query>
>({
  bodyParser,
  queryParser,
}: {
  bodyParser?: BodyParser<Body>;
  queryParser?: QueryParser<Query>;
}): FirstStep<Input<Body, Query>, Body, Query, State> => {
  return async (ctx): Promise<Input<Body, Query>> => {
    const headers = ctx.request.headers;
    let body: Body | undefined = undefined;

    if (bodyParser) {
      const parsingTask = await task<Body>(
        bodyParser(ctx.request.json()),
        "parseInputStep_parse_body"
      );

      if (parsingTask.failed) {
        // 클라이언트 응답
        ctx.response = HttpException.badRequest("invalid payload");
        // 내부 로깅 및 추적
        throw parsingTask.error;
      }

      body = parsingTask.value;
    }

    let query: Query | undefined = undefined;

    if (queryParser) {
      const url = new URL(ctx.request.url);

      const parsingTask = await task<Query>(
        queryParser(url.searchParams),
        "parseInputStep_parse_query"
      );

      if (parsingTask.failed) {
        ctx.response = HttpException.badRequest("invalid query");
        throw parsingTask.error;
      }

      query = parsingTask.value;
    }

    return {
      headers,
      query,
      body,
    };
  };
};
