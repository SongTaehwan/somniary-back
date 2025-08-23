// Shared
import { task } from "../../../shared/utils/task.ts";
import { type Step } from "../../../shared/core/chain.ts";
import { HttpException } from "../../../shared/adapters/http/format/exception.ts";

// Security
import { type JwtDependencies } from "../../security/jwt.ts";

// State
import { type AuthTokens } from "../../state/index.ts";

// Types
import { type RouteState } from "../../../shared/types/state.types.ts";
import { type JwtClaims } from "../../types/index.ts";

export const resignJwtWithDeviceIdStep = <
  Body,
  Query,
  State extends RouteState<Body, Query>
>(
  dependency: JwtDependencies<JwtClaims>
): Step<
  { device_id: string; access_token: string; refresh_token: string },
  AuthTokens,
  Body,
  Query,
  State
> => {
  return async ({ device_id, access_token, refresh_token }, ctx) => {
    // 1) 기존 access_token 검증
    const verifyTask = await task(
      dependency.verify(access_token),
      "resignJwtWithDeviceIdStep_verify"
    );

    if (verifyTask.failed) {
      // 클라이언트 응답
      ctx.response = HttpException.badRequest("Invalid token");
      // 내부 로깅 및 추적
      throw verifyTask.error;
    }

    const claims = verifyTask.value;

    // 2) 새 토큰 발급 (유효기간은 기존과 동일하게 가져갈 수도 있고, 새로 설정 가능)
    const signTask = await task(
      dependency.sign({ ...claims, device_id }),
      "resignJwtWithDeviceIdStep_sign"
    );

    if (signTask.failed) {
      // 클라이언트 응답
      ctx.response = HttpException.internalError("Cannot sign token");
      // 내부 로깅 및 추적
      throw signTask.error;
    }

    return {
      access_token: signTask.value,
      refresh_token,
    };
  };
};
