import { type JwtPayload } from "npm:jsonwebtoken";

export interface JwtClaims extends JwtPayload {
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  sub: string;
  role: string;
  aal: "aal1" | "aal2";
  session_id: string;
  email: string;
  phone: string;
  is_anonymous: boolean;
  jti?: string;
  nbf?: number;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  amr?: Array<{
    method: string;
    timestamp: number;
  }>;
  ref?: string; // Only in anon/service role tokens
}
