import { HttpException } from "../../../shared/adapters/http/format/exception.ts";
import { task } from "../../../shared/utils/task.ts";
import { JwtDependencies } from "../../security/jwt.ts";

// types
import { type Step } from "../../../shared/core/chain.ts";
import { type RouteState } from "../../../shared/types/state.types.ts";
import { type JwtClaimsWithDeviceId } from "../../types/index.ts";

export const createVerifyAccessTokenStep = <
  Body,
  Query,
  State extends RouteState<Body, Query>
>(
  dependency: JwtDependencies<JwtClaimsWithDeviceId>
): Step<{ token: string }, JwtClaimsWithDeviceId, Body, Query, State> => {
  return async (ctx, { token }) => {
    // 1) 기존 access_token 검증
    const verifyTask = await task(dependency.verify(token), {
      labelForError: "verifyAccessTokenStep_verify",
    });

    if (verifyTask.failed) {
      // 클라이언트 응답
      ctx.response = HttpException.badRequest("Invalid token");
      // 내부 로깅 및 추적
      throw verifyTask.error;
    }

    return verifyTask.value;
  };
};
