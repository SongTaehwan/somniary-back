import { HttpException } from "../format/exception.ts";
import { FirstStep } from "../../../core/chain.ts";
import { RouteState } from "../../../types/state.types.ts";

export type Token = {
  token: string;
  type: string;
};

export const extractJwtFromRequest = <
  Body = unknown,
  Query = unknown,
  State extends RouteState<Body, Query> = RouteState<Body, Query>
>(): FirstStep<Token, Body, Query, State> => {
  return (ctx): Token => {
    const headers = ctx.request.headers;
    const property = headers.get("Authorization");

    if (!property) {
      throw HttpException.unauthorized("required authorization header");
    }

    const [type, token] = property.split(" ");

    return {
      token,
      type,
    };
  };
};
