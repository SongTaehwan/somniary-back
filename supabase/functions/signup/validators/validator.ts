import { z } from "npm:zod";

// Shared
import { createValidator } from "@shared/utils/validator.ts";

const schema = z.object({
  device_id: z.string(),
  token_hash: z.string(),
});

export type AuthVerifyInput = z.infer<typeof schema>;
export const validateInput = createValidator(schema);
