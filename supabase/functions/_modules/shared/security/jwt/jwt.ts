import { JwtPayload } from "npm:jsonwebtoken";

export interface JwtDependencies<T extends JwtPayload> {
  verify: (token: string) => Promise<T> | T;
  sign: (payload: Record<string, unknown>) => Promise<string> | string;
}
