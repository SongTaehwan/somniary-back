import { z } from "npm:zod";
import { BodyParser } from "../../_shared/middlewares/types.ts";

const schema = z.object({
  device_id: z.string(),
  token_hash: z.string(),
});

export type AuthVerifyInput = z.infer<typeof schema>;

export const validateInput: BodyParser<AuthVerifyInput> = async (data) => {
  const result = await schema.safeParseAsync(data);

  if (!result.success) {
    throw result.error ?? new Error("invalid_input");
  }

  return result.data;
};
