import { createClient } from "jsr:@supabase/supabase-js";
import { Database } from "../../../../../database.types.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export function createSupabaseClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const supabase = createSupabaseClient();
export const supabaseAuthClient = createSupabaseClient();

export type SupabaseClient = typeof supabase;
