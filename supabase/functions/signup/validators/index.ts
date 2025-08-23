import { z } from "npm:zod";

// Shared
import { createValidator } from "@shared/utils/validator.ts";

const schema = z.object({
  device_id: z.string(),
  email: z.email(),
  otp_token: z.string().length(6),
});

export type SignUpBody = z.infer<typeof schema>;
export const validateInput = createValidator(schema);
