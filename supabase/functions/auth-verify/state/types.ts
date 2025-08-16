import { RouteState } from "../../_modules/shared/state/types.ts";

export const KEY_AUTH_DATA: unique symbol = Symbol("auth_data");

export type SymbolKey = typeof KEY_AUTH_DATA;

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

export interface FunctionState<T> extends RouteState<T> {
  [KEY_AUTH_DATA]?: AuthTokens;
}
