import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const TABLE = "Trade Verification node";
const GROUPING_WINDOW = 500;
const GROUP_CACHE_TTL = 15_000;
const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Type": "application/json",
};

type GroupingRow = {
  id: number | null;
  created_at: string | null;
  symbol: string | null;
  confidence: number | null;
  approved: boolean | null;
};

type ContractGroup = {
  symbol: string;
  actionCount: number;
  approvedCount: number;
  rejectedCount: number;
  averageConfidence: number;
  latestAt: string;
  latestApproved: boolean;
};

let groupCache: { expiresAt: number; groups: ContractGroup[] } | null = null;

function getPagination(searchParams: URLSearchParams, defaultPageSize: number) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(25, Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? String(defaultPageSize), 10) || defaultPageSize));
  const from = (page - 1) * pageSize;
  return { page, pageSize, from, to: from + pageSize - 1 };
}

function normalizeSymbol(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function loadContractGroups(supabase: SupabaseClient) {
  if (groupCache && groupCache.expiresAt > Date.now()) return groupCache.groups;

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, created_at, symbol, confidence, approved")
    .not("symbol", "is", null)
    .order("created_at", { ascending: false })
    .range(0, GROUPING_WINDOW - 1);

  if (error) throw error;

  const grouped = new Map<string, ContractGroup & { confidenceTotal: number }>();
  for (const row of (data ?? []) as GroupingRow[]) {
    const symbol = normalizeSymbol(row.symbol);
    if (!symbol) continue;
    const confidence = Math.min(100, Math.max(0, Number(row.confidence) || 0));
    const existing = grouped.get(symbol);

    if (!existing) {
      grouped.set(symbol, {
        symbol,
        actionCount: 1,
        approvedCount: row.approved === true ? 1 : 0,
        rejectedCount: row.approved === true ? 0 : 1,
        averageConfidence: confidence,
        confidenceTotal: confidence,
        latestAt: row.created_at ?? new Date(0).toISOString(),
        latestApproved: row.approved === true,
      });
      continue;
    }

    existing.actionCount += 1;
    existing.approvedCount += row.approved === true ? 1 : 0;
    existing.rejectedCount += row.approved === true ? 0 : 1;
    existing.confidenceTotal += confidence;
    existing.averageConfidence = Math.round(existing.confidenceTotal / existing.actionCount);
  }

  const groups = Array.from(grouped.values()).map((group) => ({
    symbol: group.symbol,
    actionCount: group.actionCount,
    approvedCount: group.approvedCount,
    rejectedCount: group.rejectedCount,
    averageConfidence: group.averageConfidence,
    latestAt: group.latestAt,
    latestApproved: group.latestApproved,
  }));
  groupCache = { groups, expiresAt: Date.now() + GROUP_CACHE_TTL };
  return groups;
}

async function contractListResponse(supabase: SupabaseClient, requestUrl: URL) {
  const { page, pageSize, from } = getPagination(requestUrl.searchParams, 8);
  const search = requestUrl.searchParams.get("search")?.trim().toLowerCase() ?? "";
  const allGroups = await loadContractGroups(supabase);
  const filteredGroups = search
    ? allGroups.filter((group) => group.symbol.toLowerCase().includes(search))
    : allGroups;
  const data = filteredGroups.slice(from, from + pageSize);
  const totalActions = filteredGroups.reduce((sum, group) => sum + group.actionCount, 0);
  const approvedActions = filteredGroups.reduce((sum, group) => sum + group.approvedCount, 0);
  const weightedConfidence = filteredGroups.reduce((sum, group) => sum + group.averageConfidence * group.actionCount, 0);

  return Response.json({
    data,
    pagination: {
      page,
      pageSize,
      totalItems: filteredGroups.length,
      totalPages: Math.max(1, Math.ceil(filteredGroups.length / pageSize)),
    },
    stats: {
      totalContracts: filteredGroups.length,
      totalActions,
      approvalRate: totalActions ? Math.round((approvedActions / totalActions) * 100) : 0,
      averageConfidence: totalActions ? Math.round(weightedConfidence / totalActions) : 0,
    },
    sourceWindow: GROUPING_WINDOW,
  }, { headers: responseHeaders });
}

async function contractDetailResponse(supabase: SupabaseClient, requestUrl: URL, contract: string) {
  const { page, pageSize, from, to } = getPagination(requestUrl.searchParams, 10);
  const { data, error, count } = await supabase
    .from(TABLE)
    .select("id, created_at, symbol, side, qty, confidence, approved, reason", { count: "exact" })
    .eq("symbol", contract)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const groups = await loadContractGroups(supabase);
  const summary = groups.find((group) => group.symbol === contract) ?? null;
  const totalItems = count ?? 0;

  return Response.json({
    data: data ?? [],
    summary,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
  }, { headers: responseHeaders });
}

export async function GET(request: Request) {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_STAGING_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return Response.json(
      { error: "Staging data connection is not configured." },
      { status: 503, headers: responseHeaders },
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const requestUrl = new URL(request.url);
  const contract = requestUrl.searchParams.get("contract")?.trim();

  try {
    return contract
      ? await contractDetailResponse(supabase, requestUrl, contract)
      : await contractListResponse(supabase, requestUrl);
  } catch (error) {
    return Response.json(
      {
        error: "Supabase could not return trade verification data.",
        detail: error instanceof Error ? error.message : "Unknown Supabase error.",
      },
      { status: 502, headers: responseHeaders },
    );
  }
}
