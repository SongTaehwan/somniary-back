import { z } from "npm:zod";

// Shared
import { createValidator } from "@shared/utils/validator.ts";
import { parseInputStep } from "@shared/steps/parser";

// HTTP 요청 body 검증 함수 정의
const bodySchema = z.object({
  refresh_token: z.string().nonempty(),
  device_id: z.string().nonempty(),
});

export type RefreshTokenBody = z.infer<typeof bodySchema>;
export type RefreshTokenQuery = unknown;

export const validateRequestInputStep = parseInputStep({
  bodyParser: createValidator(bodySchema),
});
