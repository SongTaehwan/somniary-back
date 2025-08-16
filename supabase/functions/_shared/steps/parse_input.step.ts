import { Input, RouteState } from "../state/types.ts";
import { HttpException } from "../error/exception.ts";
import { FirstStep } from "../utils/inject.ts";
import { BodyParser } from "../middlewares/types.ts";

// Step 형태로 구현
export const parseInputStep = <T, S extends RouteState<T>>(parser?: BodyParser<T>): FirstStep<Input<T>, T, S> => {
    return async (ctx): Promise<Input<T>> => {
      // 쿼리스트링
      const url = new URL(ctx.request.url);
      // 헤더
      const headers = Object.fromEntries(ctx.request.headers.entries());
  
      // 바디
      let body: T | undefined = undefined;
  
      if (parser) {
        try {
          const raw = await ctx.request.json();
          body = await parser(raw);
        } catch (error) {
          ctx.response = HttpException.badRequest(
            error instanceof Error ? error.message : "bad_request"
          );
  
          throw error;
        }
      }
  
      return  {
        headers,
        query: url.searchParams,
        body
      }
    };
  };
  