import { z } from "npm:zod";

// Shared
import { createValidator } from "@shared/utils/validator.ts";

const schema = z.object({
  device_id: z.string().nonempty(),
  email: z.string().email(),
  otp_token: z.string().length(6),
  platform: z.enum(["web", "ios", "android"]),
});

export type SignUpBody = z.infer<typeof schema>;
export const validateInput = createValidator(schema);
