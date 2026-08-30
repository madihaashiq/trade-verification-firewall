"use client";

import { useEffect, useState } from "react";

export type PnlSnapshot = {
  id: number;
  captured_at: string;
  portfolio_value: number | null;
  net_pnl: number | null;
  daily_return_pct: number | null;
  created_at: string;
};

export type RecentDecision = {
  id: number;
  created_at: string;
  symbol: string | null;
  side: string | null;
  qty: number | null;
  confidence: number | null;
  approved: boolean | null;
  reason: string | null;
};

export type TradeExecution = {
  id: number;
  verification_id: number | null;
  broker_order_id: string | null;
  status: string | null;
  submitted_at: string | null;
  filled_at: string | null;
  filled_qty: number | null;
  average_fill_price: number | null;
  fees: number | null;
  failure_reason: string | null;
  updated_at: string | null;
  verification: RecentDecision | null;
};

type DashboardStats = {
  totalVerifications: number;
  approvalRate: number;
  averageConfidence: number;
  executionCount: number;
  linkedVerificationCount: number;
};

type DashboardData = {
  pnlSnapshots: PnlSnapshot[];
  recentDecisions: RecentDecision[];
  executions: TradeExecution[];
  stats: DashboardStats;
  generatedAt: string | null;
};

const emptyData: DashboardData = {
  pnlSnapshots: [],
  recentDecisions: [],
  executions: [],
  stats: { totalVerifications: 0, approvalRate: 0, averageConfidence: 0, executionCount: 0, linkedVerificationCount: 0 },
  generatedAt: null,
};

export function useDashboard() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [connection, setConnection] = useState<"connecting" | "live" | "error">("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store", signal: controller.signal });
        const result = await response.json() as Partial<DashboardData> & { error?: string; detail?: string };
        if (!active) return;
        if (!response.ok) throw new Error(result.detail ?? result.error ?? "Dashboard data could not be loaded.");
        setData({
          pnlSnapshots: result.pnlSnapshots ?? [],
          recentDecisions: result.recentDecisions ?? [],
          executions: result.executions ?? [],
          stats: result.stats ?? emptyData.stats,
          generatedAt: result.generatedAt ?? null,
        });
        setConnection("live");
        setErrorMessage(null);
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setConnection("error");
        setErrorMessage(error instanceof Error ? error.message : "Dashboard data could not be reached.");
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), 15_000);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  return { ...data, connection, errorMessage };
}
