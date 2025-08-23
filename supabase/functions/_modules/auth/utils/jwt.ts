import jwt, { type JwtPayload } from "npm:jsonwebtoken";

// Shared
import { type JwtDependencies } from "../security/jwt.ts";

// 팩토리
// 토큰 발급 및 검증 의존성 주입
// secret, algorithm 은 어뎁터에서 고정되어 있음
export function createJwtDependencies<T extends JwtPayload>(
  secret: string
): JwtDependencies<T> {
  return {
    verify: (token: string): T => {
      const result = jwt.verify(token, secret, {
        algorithms: ["HS256"],
      });

      if (typeof result === "string") {
        throw new Error("Invalid token");
      }

      return result as T;
    },
    // 완성된 Claim 객체를 받아 토큰을 발급한다.
    sign: (payload: object) =>
      jwt.sign(payload, secret, {
        algorithm: "HS256",
      }),
  };
}
