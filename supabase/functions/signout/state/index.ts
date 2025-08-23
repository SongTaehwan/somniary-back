import { RouteState } from "@shared/types/state.types.ts";

export const KEY_SIGNOUT_DATA: unique symbol = Symbol("signout");

export type SymbolKey = typeof KEY_SIGNOUT_DATA;

// 함수 도메인 상태 타입 정의
export type SignoutState = {
  // define type for function state
};

// 함수 도메인 별로 공유될 상태를 정의한다.
export interface FunctionState<T, Q = unknown> extends RouteState<T, Q> {
  [KEY_SIGNOUT_DATA]?: SignoutState;
}
