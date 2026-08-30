import { createClient } from "@supabase/supabase-js";

export const VERIFICATIONS_TABLE = "Trade Verification node";
export const EXECUTIONS_TABLE = "trade_executions";
export const PNL_TABLE = "pnl_snapshots";

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_STAGING_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("The Supabase server connection is not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function publicDatabaseError(error: unknown) {
  if (error instanceof Error && error.message.includes("not configured")) {
    return { status: 503, message: error.message };
  }

  return {
    status: 502,
    message: error instanceof Error ? error.message : "The database request failed.",
  };
}
