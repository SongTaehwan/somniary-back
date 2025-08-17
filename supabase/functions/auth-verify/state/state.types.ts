import { RouteState } from "@shared/types/state.types.ts";

export const KEY_AUTH_DATA: unique symbol = Symbol("auth_data");

export type SymbolKey = typeof KEY_AUTH_DATA;

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

// 함수 도메인 별로 공유될 상태를 정의한다.
export interface FunctionState<T> extends RouteState<T> {
  [KEY_AUTH_DATA]?: AuthTokens;
}
