import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EXECUTIONS_TABLE,
  getSupabaseAdmin,
  PNL_TABLE,
  publicDatabaseError,
  VERIFICATIONS_TABLE,
} from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store, max-age=0" };

// ---------------------------------------------------------------------------
// Headline stats are aggregated over the most recent decisions, fetched in
// pages instead of a single fixed 1,000-row sample. The paginated scan stops
// at STATS_ROW_CAP only as a safety net and reports statsCapped so consumers
// can tell an exact figure from a bounded one.
// ---------------------------------------------------------------------------
const STATS_ROW_CAP = 5_000;
const STATS_PAGE_SIZE = 1_000;
const STATS_CACHE_TTL_MS = 15_000;

// Route handlers run on the Node runtime by default, but this project can also
// be deployed to Cloudflare Workers (OpenNext). Module-level state is not
// shared between isolates there, so the cache is only used on Node (Docker).
const canUseModuleCache = process.env.NEXT_RUNTIME !== "edge";

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

type StatsAggregate = {
  total: number;
  approved: number;
  rejected: number;
  confidenceTotal: number;
  confidenceCount: number;
  capped: boolean;
};

let statsCache: { expiresAt: number; aggregate: StatsAggregate } | null = null;

async function loadStatsAggregate(supabase: SupabaseClient): Promise<StatsAggregate> {
  if (canUseModuleCache && statsCache && statsCache.expiresAt > Date.now()) {
    return statsCache.aggregate;
  }

  const rows: Array<{ approved: boolean | null; confidence: number | null }> = [];
  let capped = false;

  for (let offset = 0; offset < STATS_ROW_CAP; offset += STATS_PAGE_SIZE) {
    const { data, error } = await supabase
      .from(VERIFICATIONS_TABLE)
      .select("approved, confidence")
      .order("created_at", { ascending: false })
      .range(offset, offset + STATS_PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < STATS_PAGE_SIZE) break;
  }

  if (rows.length >= STATS_ROW_CAP) capped = true;

  let approved = 0;
  let rejected = 0;
  let confidenceTotal = 0;
  let confidenceCount = 0;
  for (const row of rows) {
    // Only explicit true/false verdicts count towards the rate; rows with a
    // null verdict (e.g. "hold" decisions) are not treated as rejections.
    if (row.approved === true) approved += 1;
    else if (row.approved === false) rejected += 1;
    const confidence = Number(row.confidence);
    if (Number.isFinite(confidence)) {
      confidenceTotal += confidence;
      confidenceCount += 1;
    }
  }

  const aggregate: StatsAggregate = {
    total: rows.length,
    approved,
    rejected,
    confidenceTotal,
    confidenceCount,
    capped,
  };

  if (canUseModuleCache) {
    statsCache = { aggregate, expiresAt: Date.now() + STATS_CACHE_TTL_MS };
  }
  return aggregate;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [pnlResult, decisionsResult, statsAggregate, executionsResult, executionCountResult] =
      await Promise.all([
        supabase
          .from(PNL_TABLE)
          .select("id, captured_at, portfolio_value, net_pnl, daily_return_pct, created_at")
          // Newest 500 first...
          .order("captured_at", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from(VERIFICATIONS_TABLE)
          .select("id, created_at, symbol, side, qty, confidence, approved, reason")
          .order("created_at", { ascending: false })
          .limit(8),
        loadStatsAggregate(supabase),
        supabase
          .from(EXECUTIONS_TABLE)
          .select("id, verification_id, broker_order_id, status, submitted_at, filled_at, filled_qty, average_fill_price, fees, failure_reason, updated_at")
          .order("updated_at", { ascending: false })
          .limit(25),
        supabase.from(EXECUTIONS_TABLE).select("id", { count: "exact", head: true }),
      ]);

    for (const result of [pnlResult, decisionsResult, executionsResult, executionCountResult]) {
      if (result.error) throw result.error;
    }

    // ...then reversed to oldest -> newest so the chart draws left to right.
    const pnlSnapshots = (pnlResult.data ?? []).slice().reverse();

    const executions = (executionsResult.data ?? []) as Array<
      { verification_id: number | null } & Record<string, unknown>
    >;

    // Fetch the verification rows for exactly the displayed executions instead
    // of guessing from a fixed sample window.
    const verificationIds = Array.from(
      new Set(
        executions
          .map((execution) => Number(execution.verification_id))
          .filter(Number.isFinite),
      ),
    );
    const linkedResult = verificationIds.length
      ? await supabase
        .from(VERIFICATIONS_TABLE)
        .select("id, created_at, symbol, side, qty, confidence, approved, reason")
        .in("id", verificationIds)
      : { data: [], error: null };
    if (linkedResult.error) throw linkedResult.error;

    const verificationById = new Map(
      ((linkedResult.data ?? []) as VerificationRow[]).map((verification) => [
        verification.id,
        verification,
      ]),
    );
    const executionsWithVerification = executions.map((execution) => ({
      ...execution,
      verification: verificationById.get(Number(execution.verification_id)) ?? null,
    }));

    const rateDenominator = statsAggregate.approved + statsAggregate.rejected;
    const approvalRate = rateDenominator
      ? Math.round((statsAggregate.approved / rateDenominator) * 100)
      : 0;

    return Response.json({
      pnlSnapshots,
      recentDecisions: decisionsResult.data ?? [],
      executions: executionsWithVerification,
      stats: {
        totalVerifications: statsAggregate.total,
        approvalRate,
        averageConfidence: statsAggregate.confidenceCount
          ? Math.round(statsAggregate.confidenceTotal / statsAggregate.confidenceCount)
          : 0,
        executionCount: executionCountResult.count ?? executions.length,
        linkedVerificationCount: verificationById.size,
        statsCapped: statsAggregate.capped,
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
