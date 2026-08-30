import {
  EXECUTIONS_TABLE,
  getSupabaseAdmin,
  PNL_TABLE,
  publicDatabaseError,
  VERIFICATIONS_TABLE,
} from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store, max-age=0" };

type VerificationRow = {
  id: number;
  created_at: string;
  symbol: string | null;
  side: string | null;
  qty: number | null;
  confidence: number | null;
  approved: boolean | null;
  reason: string | null;
};

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [pnlResult, decisionsResult, verificationStatsResult, executionsResult] = await Promise.all([
      supabase
        .from(PNL_TABLE)
        .select("id, captured_at, portfolio_value, net_pnl, daily_return_pct, created_at")
        .order("captured_at", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(500),
      supabase
        .from(VERIFICATIONS_TABLE)
        .select("id, created_at, symbol, side, qty, confidence, approved, reason")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from(VERIFICATIONS_TABLE)
        .select("id, created_at, symbol, side, qty, confidence, approved, reason")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from(EXECUTIONS_TABLE)
        .select("id, verification_id, broker_order_id, status, submitted_at, filled_at, filled_qty, average_fill_price, fees, failure_reason, updated_at")
        .order("updated_at", { ascending: false })
        .limit(25),
    ]);

    for (const result of [pnlResult, decisionsResult, verificationStatsResult, executionsResult]) {
      if (result.error) throw result.error;
    }

    const verifications = (verificationStatsResult.data ?? []) as VerificationRow[];
    const approved = verifications.filter((item) => item.approved === true).length;
    const confidenceValues = verifications
      .map((item) => Number(item.confidence))
      .filter(Number.isFinite);
    const linkedIds = new Set(
      (executionsResult.data ?? [])
        .map((execution) => Number(execution.verification_id))
        .filter(Number.isFinite),
    );

    const verificationById = new Map(
      verifications.map((verification) => [verification.id, verification]),
    );
    const executions = (executionsResult.data ?? []).map((execution) => ({
      ...execution,
      verification: verificationById.get(Number(execution.verification_id)) ?? null,
    }));

    return Response.json({
      pnlSnapshots: pnlResult.data ?? [],
      recentDecisions: decisionsResult.data ?? [],
      executions,
      stats: {
        totalVerifications: verifications.length,
        approvalRate: verifications.length ? Math.round((approved / verifications.length) * 100) : 0,
        averageConfidence: confidenceValues.length
          ? Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length)
          : 0,
        executionCount: executions.length,
        linkedVerificationCount: linkedIds.size,
      },
      generatedAt: new Date().toISOString(),
    }, { headers });
  } catch (error) {
    const problem = publicDatabaseError(error);
    return Response.json(
      { error: "Dashboard data could not be loaded.", detail: problem.message },
      { status: problem.status, headers },
    );
  }
}
