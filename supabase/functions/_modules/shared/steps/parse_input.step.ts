import { Input, RouteState } from "../state/types.ts";
import { HttpException } from "../error/exception.ts";
import { FirstStep } from "../composer/chain.ts";
import { BodyParser } from "../utils/parser.type.ts";
import { task } from "../utils/task.ts";

// Step 형태로 구현
export const parseInputStep = <T, S extends RouteState<T>>(
  parser?: BodyParser<T>
): FirstStep<Input<T>, T, S> => {
  return async (ctx): Promise<Input<T>> => {
    // 쿼리스트링
    const url = new URL(ctx.request.url);
    // 헤더
    const headers = Object.fromEntries(ctx.request.headers.entries());

    // 바디
    let body: T | undefined = undefined;

    if (parser) {
      const parsingTask = await task<T>(
        ctx.request.json(),
        "parseInputStep_parse"
      );

      if (parsingTask.failed) {
        // 클라이언트 응답
        ctx.response = HttpException.badRequest(parsingTask.error.message);
        // 내부 로깅 및 추적
        throw parsingTask.error;
      }

      body = parsingTask.value;
    }

    return {
      headers,
      query: url.searchParams,
      body,
    };
  };
};
