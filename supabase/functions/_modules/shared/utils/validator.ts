import { z } from "npm:zod";

async function validator<T>(data: unknown, schema: z.ZodSchema<T>): Promise<T> {
  const result = await schema.safeParseAsync(data);

  if (!result.success) {
    throw result.error ?? new Error("validation failed");
  }

  return result.data;
}

// factory
export const createValidator = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown) => {
    return validator<T>(data, schema);
  };
};
