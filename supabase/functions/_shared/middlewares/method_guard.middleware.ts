import { HttpException } from "../error/exception.ts";
import { RouteState } from "../state/types.ts";
import { Handler, Middleware } from "./types.ts";

export function withMethodGuard(
  allowedMethods: string[],
  handler: Handler
): Handler {
  const allowed = allowedMethods.map((method) => method.toUpperCase());

  return (request: Request) => {
    if (!allowed.includes(request.method.toUpperCase())) {
      return HttpException.methodNotAllowed(
        "method_not_allowed",
        allowedMethods
      );
    }

    return handler(request);
  };
}

export function methodGuard<T, S extends RouteState<T>>(allowedMethods: string[]): Middleware<T, S> {
  const allowed = allowedMethods.map((method) => method.toUpperCase());

  return (ctx, next) => {
    if (!allowed.includes(ctx.request.method.toUpperCase())) {
      ctx.response = HttpException.methodNotAllowed(
        "method_not_allowed",
        allowedMethods
      );

      return;
    }

    return next();
  };
}
