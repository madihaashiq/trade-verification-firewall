import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EXECUTIONS_TABLE,
  getSupabaseAdmin,
  PNL_TABLE,
  publicDatabaseError,
  VERIFICATIONS_TABLE,
} from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

// Each table is fetched in pages and capped so one request cannot pull the
// entire database into memory. `truncated` flags are included in the response
// so consumers know when a cap was hit.
const MAX_ROWS_PER_TABLE = 10_000;
const PAGE_SIZE = 1_000;

// Export is opt-in. Until an EXPORT_ACCESS_KEY is configured the endpoint
// stays disabled, so a public dashboard cannot be used to dump the database.
function isExportEnabled() {
  return (
    typeof process.env.EXPORT_ACCESS_KEY === "string" &&
    process.env.EXPORT_ACCESS_KEY.length > 0
  );
}

function keyMatches(incoming: string | null) {
  const expected = process.env.EXPORT_ACCESS_KEY ?? "";
  if (!incoming || !expected) return false;
  const a = Buffer.from(incoming);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function fetchAllRows(
  supabase: SupabaseClient,
  table: string,
  orderColumn: string,
): Promise<{ rows: unknown[]; truncated: boolean }> {
  const rows: unknown[] = [];
  let truncated = false;

  for (let offset = 0; offset < MAX_ROWS_PER_TABLE; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderColumn, { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  if (rows.length >= MAX_ROWS_PER_TABLE) truncated = true;
  return { rows, truncated };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const key = request.headers.get("x-export-key") ?? requestUrl.searchParams.get("key");

  if (!isExportEnabled()) {
    return Response.json(
      {
        error: "The export endpoint is disabled.",
        detail: "Set EXPORT_ACCESS_KEY in the server environment to enable exports.",
      },
      { status: 403 },
    );
  }

  if (!keyMatches(key)) {
    return Response.json(
      {
        error: "The export endpoint requires a valid access key.",
        detail: "Pass the key as the x-export-key header or the ?key= query parameter.",
      },
      { status: 401 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const [verifications, executions, pnlSnapshots] = await Promise.all([
      fetchAllRows(supabase, VERIFICATIONS_TABLE, "created_at"),
      fetchAllRows(supabase, EXECUTIONS_TABLE, "updated_at"),
      fetchAllRows(supabase, PNL_TABLE, "captured_at"),
    ]);

    const exportedAt = new Date();
    const body = JSON.stringify({
      exportedAt: exportedAt.toISOString(),
      schema: {
        verifications: VERIFICATIONS_TABLE,
        executions: EXECUTIONS_TABLE,
        pnlSnapshots: PNL_TABLE,
        executionLink: "trade_executions.verification_id -> Trade Verification node.id",
      },
      data: {
        verifications: verifications.rows,
        executions: executions.rows,
        pnlSnapshots: pnlSnapshots.rows,
      },
      truncated: {
        verifications: verifications.truncated,
        executions: executions.truncated,
        pnlSnapshots: pnlSnapshots.truncated,
      },
    }, null, 2);

    return new Response(body, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="arcline-export-${exportedAt.toISOString().slice(0, 10)}.json"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    const problem = publicDatabaseError(error);
    return Response.json(
      { error: "The database export could not be prepared.", detail: problem.message },
      { status: problem.status },
    );
  }
}
