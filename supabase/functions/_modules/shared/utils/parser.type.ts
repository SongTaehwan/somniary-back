// 바디 파싱 함수 타입
export type BodyParser<T> = (raw: unknown) => T | Promise<T>;