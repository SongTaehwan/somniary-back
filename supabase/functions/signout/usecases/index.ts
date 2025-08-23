// Shared
import { chain } from "@shared/core/chain.ts";
import { supabase } from "@shared/infra/supabase.ts";

// Types
import {
  extractJwtFromRequest,
  type Token,
} from "@shared/adapters/http/steps/extract_jwt_from_request.step.ts";

// Validators
import { type SignOutQuery, type SignOutBody } from "@local/validators";

// State
import { type FunctionState } from "@local/state";
import { expireTokenStep } from "../steps/services/expire_token.step.ts";

export const signOutChain = chain<
  SignOutBody,
  SignOutQuery,
  FunctionState<SignOutQuery, SignOutQuery>,
  Token
>(extractJwtFromRequest()).then(expireTokenStep(supabase));
