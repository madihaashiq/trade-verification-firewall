"use client";

import { useEffect, useState } from "react";

export type TradeVerification = {
  id: number;
  created_at: string;
  symbol: string;
  side: string;
  qty: number;
  confidence: number;
  approved: boolean;
  reason: string;
};

export type ContractGroup = {
  symbol: string;
  actionCount: number;
  approvedCount: number;
  rejectedCount: number;
  averageConfidence: number;
  latestAt: string;
  latestApproved: boolean;
};

export type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ConnectionState = "connecting" | "live" | "error";

const emptyPagination: Pagination = { page: 1, pageSize: 8, totalItems: 0, totalPages: 1 };
const emptyStats = { totalContracts: 0, totalActions: 0, approvalRate: 0, averageConfidence: 0 };

export function normalizeTrade(input: unknown): TradeVerification {
  const trade = (input && typeof input === "object" ? input : {}) as Partial<Record<keyof TradeVerification, unknown>>;
  const createdAt = typeof trade.created_at === "string" && !Number.isNaN(Date.parse(trade.created_at))
    ? trade.created_at
    : new Date(0).toISOString();
  const confidence = Number(trade.confidence);

  return {
    id: Number.isFinite(Number(trade.id)) ? Number(trade.id) : 0,
    created_at: createdAt,
    symbol: typeof trade.symbol === "string" && trade.symbol.trim() ? trade.symbol : "Unknown contract",
    side: typeof trade.side === "string" && trade.side.trim() ? trade.side : "unknown",
    qty: Number.isFinite(Number(trade.qty)) ? Number(trade.qty) : 0,
    confidence: Number.isFinite(confidence) ? Math.min(100, Math.max(0, confidence)) : 0,
    approved: trade.approved === true,
    reason: typeof trade.reason === "string" && trade.reason.trim()
      ? trade.reason
      : "No decision rationale was provided for this verification.",
  };
}

function normalizeGroup(input: unknown): ContractGroup {
  const group = (input && typeof input === "object" ? input : {}) as Partial<Record<keyof ContractGroup, unknown>>;
  return {
    symbol: typeof group.symbol === "string" && group.symbol.trim() ? group.symbol : "Unknown contract",
    actionCount: Math.max(0, Number(group.actionCount) || 0),
    approvedCount: Math.max(0, Number(group.approvedCount) || 0),
    rejectedCount: Math.max(0, Number(group.rejectedCount) || 0),
    averageConfidence: Math.min(100, Math.max(0, Number(group.averageConfidence) || 0)),
    latestAt: typeof group.latestAt === "string" && !Number.isNaN(Date.parse(group.latestAt)) ? group.latestAt : new Date(0).toISOString(),
    latestApproved: group.latestApproved === true,
  };
}

export function useContractGroups(page: number, searchQuery: string, pageSize = 8) {
  const [groups, setGroups] = useState<ContractGroup[]>([]);
  const [pagination, setPagination] = useState<Pagination>(emptyPagination);
  const [stats, setStats] = useState(emptyStats);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadGroups = async () => {
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        const response = await fetch(`/api/trade-verifications?${params}`, { cache: "no-store", signal: controller.signal });
        const result = (await response.json()) as {
          data?: ContractGroup[];
          pagination?: Pagination;
          stats?: typeof emptyStats;
          error?: string;
          detail?: string;
        };

        if (!active) return;
        if (!response.ok) {
          setConnection("error");
          setErrorMessage(result.detail ?? result.error ?? "The staging feed could not be loaded.");
          return;
        }

        setGroups((result.data ?? []).map(normalizeGroup));
        setPagination(result.pagination ?? emptyPagination);
        setStats(result.stats ?? emptyStats);
        setConnection("live");
        setErrorMessage(null);
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setConnection("error");
        setErrorMessage("The staging feed could not be reached.");
      }
    };

    const searchDelay = window.setTimeout(() => void loadGroups(), 250);
    const pollingInterval = window.setInterval(() => void loadGroups(), 15_000);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(searchDelay);
      window.clearInterval(pollingInterval);
    };
  }, [page, pageSize, searchQuery]);

  return { groups, pagination, connection, errorMessage, stats };
}
