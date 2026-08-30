import {
  EXECUTIONS_TABLE,
  getSupabaseAdmin,
  PNL_TABLE,
  publicDatabaseError,
  VERIFICATIONS_TABLE,
} from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [verifications, executions, pnlSnapshots] = await Promise.all([
      supabase.from(VERIFICATIONS_TABLE).select("*").order("created_at", { ascending: false }),
      supabase.from(EXECUTIONS_TABLE).select("*").order("updated_at", { ascending: false }),
      supabase.from(PNL_TABLE).select("*").order("captured_at", { ascending: false }),
    ]);

    for (const result of [verifications, executions, pnlSnapshots]) {
      if (result.error) throw result.error;
    }

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
        verifications: verifications.data ?? [],
        executions: executions.data ?? [],
        pnlSnapshots: pnlSnapshots.data ?? [],
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
