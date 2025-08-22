export type BodyParser<T> = (data: unknown) => T | Promise<T>;
