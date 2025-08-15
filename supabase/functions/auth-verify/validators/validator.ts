import { z } from "npm:zod";

const schema = z.object({
  device_id: z.string(),
  token_hash: z.string(),
});

export type AuthVerifyInput = z.infer<typeof schema>;

export const validateInput = async (data: unknown): Promise<AuthVerifyInput> => {
  const result = await schema.safeParseAsync(data);

  if (!result.success) {
    throw result.error ?? new Error("invalid_input");
  }

  return result.data;
};
