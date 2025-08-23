export type BodyParser<T> = (data: unknown) => T | Promise<T>;
export type QueryParser<Q> = (query: URLSearchParams) => Q | Promise<Q>;
