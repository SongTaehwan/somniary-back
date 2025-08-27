import jwt, { type JwtPayload } from "npm:jsonwebtoken";

// Shared
import { type JwtDependencies } from "../security/jwt.ts";
import { maskToken } from "../../shared/utils/security.ts";

// 팩토리
// 토큰 발급 및 검증 의존성 주입
// secret, algorithm 은 어뎁터에서 고정되어 있음
export function createJwtDependencies<T extends JwtPayload>(
  secret: string
): JwtDependencies<T> {
  return {
    verify: (token: string): T => {
      try {
        const result = jwt.verify(token, secret, {
          algorithms: ["HS256"],
        });

        if (typeof result === "string") {
          throw new Error("Invalid token format");
        }

        return result as T;
      } catch (error) {
        // 토큰 검증 실패 시 토큰 정보를 로그에 노출하지 않음
        console.error(`JWT verification failed for token: ${maskToken(token)}`);
        throw new Error(`Token verification failed`, {
          cause: "token_verification_failed",
        });
      }
    },
    // 완성된 Claim 객체를 받아 토큰을 발급한다.
    sign: (payload: object): string => {
      try {
        const token = jwt.sign(payload, secret, {
          algorithm: "HS256",
        });

        // 토큰 발급 성공 로그 (마스킹된 토큰 출력)
        console.log(`JWT signed successfully: ${maskToken(token)}`);
        return token;
      } catch (error) {
        console.error(
          `JWT signing failed:\n ${JSON.stringify(error, null, 4)}`
        );
        throw new Error("Token signing failed", {
          cause: "token_signing_failed",
        });
      }
    },
  };
}
