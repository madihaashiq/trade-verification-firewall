"use client";

import {
  ArrowLeft, BrainCircuit, CheckCircle2, ChevronDown, Clock3, Gauge,
  Layers3, Search, ShieldCheck, XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  normalizeTrade,
  type ContractGroup,
  type Pagination,
  type TradeVerification,
} from "../../use-trade-verifications";

const emptyPagination: Pagination = { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 };

function BrandMark() {
  return <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>;
}

export default function ContractDetail({ symbol }: { symbol: string }) {
  const [page, setPage] = useState(1);
  const [actions, setActions] = useState<TradeVerification[]>([]);
  const [summary, setSummary] = useState<ContractGroup | null>(null);
  const [pagination, setPagination] = useState<Pagination>(emptyPagination);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const underlying = symbol.match(/^[A-Z]+/)?.[0] ?? symbol;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadActions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ contract: symbol, page: String(page), pageSize: "10" });
        const response = await fetch(`/api/trade-verifications?${params}`, { cache: "no-store", signal: controller.signal });
        const result = (await response.json()) as {
          data?: TradeVerification[];
          summary?: ContractGroup | null;
          pagination?: Pagination;
          error?: string;
          detail?: string;
        };

        if (!active) return;
        if (!response.ok) throw new Error(result.detail ?? result.error ?? "The contract history could not be loaded.");
        setActions((result.data ?? []).map(normalizeTrade));
        setSummary(result.summary ?? null);
        setPagination(result.pagination ?? emptyPagination);
        setErrorMessage(null);
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setErrorMessage(error instanceof Error ? error.message : "The contract history could not be reached.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadActions();
    return () => {
      active = false;
      controller.abort();
    };
  }, [page, symbol]);

  return (
    <main className="contract-page">
      <header className="contract-topbar">
        <Link className="contract-brand" href="/">
          <BrandMark />
          <span><strong>Arcline</strong><small>Verification firewall</small></span>
        </Link>
        <span className="secure-connection"><ShieldCheck size={15} /> Supabase connected</span>
      </header>

      <section className="contract-content">
        <Link className="back-link" href="/#verification"><ArrowLeft size={15} /> Back to grouped contracts</Link>
        <div className="contract-hero">
          <div className="contract-identity">
            <span className="contract-monogram">{underlying.slice(0, 2)}</span>
            <div><p>Trade verification history</p><h1>{underlying}</h1><code>{symbol}</code></div>
          </div>
          <div className="contract-status"><i /> Live database record</div>
        </div>

        <section className="contract-stat-grid" aria-label="Contract summary">
          <article><span><Layers3 size={17} /></span><div><small>Total actions</small><strong>{summary?.actionCount ?? pagination.totalItems}</strong></div></article>
          <article><span className="green"><CheckCircle2 size={17} /></span><div><small>Approved</small><strong>{summary?.approvedCount ?? "—"}</strong></div></article>
          <article><span className="rose"><XCircle size={17} /></span><div><small>Rejected</small><strong>{summary?.rejectedCount ?? "—"}</strong></div></article>
          <article><span className="violet"><Gauge size={17} /></span><div><small>Average confidence</small><strong>{summary ? `${summary.averageConfidence}%` : "—"}</strong></div></article>
        </section>

        <section className="action-history panel">
          <div className="action-history-header">
            <div><h2>Action history</h2><p>Select an action to inspect its confidence and full AI rationale.</p></div>
            <span><Clock3 size={14} /> Newest first</span>
          </div>

          {errorMessage && <div className="contract-error"><XCircle size={15} /> {errorMessage}</div>}
          <div className="action-columns"><span>Action</span><span>Direction</span><span>Quantity</span><span>Decision</span><span>Logged</span><span aria-hidden="true" /></div>
          <div className={`action-list ${loading && actions.length ? "is-loading" : ""}`} aria-busy={loading}>
            {loading ? <div className="contract-empty"><span className="loading-orb" /> Loading contract actions…</div> : actions.length ? actions.map((action) => {
              const tone = action.approved ? "approved" : "rejected";
              return (
                <details className={`action-row ${tone}`} key={action.id}>
                  <summary>
                    <span className="action-id"><i>{action.side.slice(0, 1).toUpperCase()}</i><span><strong>Verification #{action.id}</strong><small>AI policy check</small></span></span>
                    <span className={`side-badge ${action.side.toLowerCase()}`}>{action.side}</span>
                    <strong>{action.qty}</strong>
                    <span className={`decision-badge ${tone}`}>{action.approved ? <CheckCircle2 size={13} /> : <XCircle size={13} />}{action.approved ? "Approved" : "Rejected"}</span>
                    <time>{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(action.created_at))}</time>
                    <ChevronDown size={16} />
                  </summary>
                  <div className="action-detail-grid">
                    <div className="action-confidence">
                      <small>Confidence score</small><strong>{action.confidence}%</strong>
                      <span><i style={{ width: `${action.confidence}%` }} /></span>
                    </div>
                    <div className="action-rationale"><span className={`reason-mark ${tone}`}><BrainCircuit size={17} /></span><div><small>AI decision rationale</small><p>{action.reason}</p></div></div>
                    <dl><div><dt>Contract</dt><dd>{action.symbol}</dd></div><div><dt>Side</dt><dd>{action.side}</dd></div><div><dt>Quantity</dt><dd>{action.qty}</dd></div><div><dt>Execution</dt><dd>{action.executions.length ? `${action.executions.length} linked` : "Not submitted"}</dd></div></dl>
                    {action.executions.length > 0 && <div className="linked-executions">
                      {action.executions.map((execution) => <div key={execution.id}>
                        <span><small>Execution #{execution.id}</small><strong>{execution.status ?? "Unknown status"}</strong></span>
                        <span><small>Broker order</small><strong>{execution.broker_order_id ?? "Not assigned"}</strong></span>
                        <span><small>Filled</small><strong>{execution.filled_qty ?? 0}{execution.average_fill_price == null ? "" : ` @ $${Number(execution.average_fill_price).toFixed(2)}`}</strong></span>
                        <span><small>Fees</small><strong>{execution.fees == null ? "—" : `$${Number(execution.fees).toFixed(2)}`}</strong></span>
                        {execution.failure_reason && <p>{execution.failure_reason}</p>}
                      </div>)}
                    </div>}
                  </div>
                </details>
              );
            }) : <div className="contract-empty"><Search size={18} /> No actions were found for this contract.</div>}
            {loading && actions.length > 0 && <div className="table-loader contract-table-loader" role="status"><span className="loading-orb" /> Loading actions…</div>}
          </div>

          <div className="table-pagination contract-pagination">
            <span>Showing {actions.length ? (pagination.page - 1) * pagination.pageSize + 1 : 0}–{Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} actions</span>
            <div><button disabled={pagination.page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><b>Page {pagination.page} of {pagination.totalPages}</b><button disabled={pagination.page >= pagination.totalPages || loading} onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}>Next</button></div>
          </div>
        </section>
      </section>
    </main>
  );
}
