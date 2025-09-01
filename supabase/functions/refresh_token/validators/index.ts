import { z } from "npm:zod";

// Shared
import { createValidator } from "@shared/utils/validator.ts";
import { parseInputStep } from "@shared/steps/parser";

// HTTP 요청 body 검증 함수 정의
const bodySchema = z.object({
  refresh_token: z.string().nonempty().min(12),
  device_id: z.uuid(),
});

export type RefreshTokenBody = z.infer<typeof bodySchema>;
export type RefreshTokenQuery = unknown;

export const validateRequestInputStep = parseInputStep({
  bodyParser: createValidator(bodySchema),
});
