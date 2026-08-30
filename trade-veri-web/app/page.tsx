"use client";

import {
  Activity, ArrowUpRight, BarChart3, CheckCircle2, Clock3, Database,
  Download, Gauge, LayoutDashboard, LoaderCircle, Menu, ReceiptText, Search,
  ShieldCheck, TrendingUp, WalletCards, X, XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useDashboard, type PnlSnapshot } from "./use-dashboard";
import { useContractGroups } from "./use-trade-verifications";

const periods = ["1W", "1M", "3M", "1Y", "All"] as const;

function BrandMark() {
  return <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>;
}

function formatMoney(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(Number(value));
}

function formatDate(value: string | null | undefined, includeTime = true) {
  if (!value || Number.isNaN(Date.parse(value))) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", includeTime
    ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function filterSnapshots(snapshots: PnlSnapshot[], period: typeof periods[number]) {
  if (period === "All" || snapshots.length === 0) return snapshots;
  const days = { "1W": 7, "1M": 30, "3M": 90, "1Y": 365 }[period];
  const latest = Math.max(...snapshots.map((item) => Date.parse(item.captured_at)));
  return snapshots.filter((item) => Date.parse(item.captured_at) >= latest - days * 86_400_000);
}

function chartGeometry(snapshots: PnlSnapshot[]) {
  const values = snapshots.map((item) => Number(item.portfolio_value)).filter(Number.isFinite);
  if (!values.length) return null;
  const low = Math.min(...values);
  const high = Math.max(...values);
  const padding = Math.max((high - low) * 0.15, Math.max(Math.abs(high), 1) * 0.002);
  const min = low - padding;
  const max = high + padding;
  const points = values.map((value, index) => ({
    x: values.length === 1 ? 380 : (index / (values.length - 1)) * 760,
    y: 200 - ((value - min) / (max - min || 1)) * 180,
  }));
  const line = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  return {
    min, max, line,
    area: `${line} L${points.at(-1)?.x ?? 760} 220 L${points[0]?.x ?? 0} 220 Z`,
    last: points.at(-1)!,
  };
}

export default function Home() {
  const [period, setPeriod] = useState<typeof periods[number]>("3M");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contractPage, setContractPage] = useState(1);
  const [navigatingContract, setNavigatingContract] = useState(false);
  const dashboard = useDashboard();
  const contracts = useContractGroups(contractPage, searchQuery);
  const visibleSnapshots = useMemo(() => filterSnapshots(dashboard.pnlSnapshots, period), [dashboard.pnlSnapshots, period]);
  const chart = useMemo(() => chartGeometry(visibleSnapshots), [visibleSnapshots]);
  const latestSnapshot = dashboard.pnlSnapshots.at(-1) ?? null;
  const connection = dashboard.connection === "error" || contracts.connection === "error"
    ? "error"
    : dashboard.connection === "live" && contracts.connection === "live" ? "live" : "connecting";

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <BrandMark />
          <div><strong>Arcline</strong><span>Verification firewall</span></div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>
        <nav aria-label="Primary navigation">
          <p className="nav-label">Operations</p>
          <a className="nav-item active" href="#overview"><LayoutDashboard size={19} /><span>Overview</span></a>
          <a className="nav-item" href="#performance"><BarChart3 size={19} /><span>P&amp;L history</span></a>
          <a className="nav-item" href="#verification"><ShieldCheck size={19} /><span>Verifications</span><span className="nav-count">{contracts.stats.totalActions}</span></a>
          <a className="nav-item" href="#executions"><ReceiptText size={19} /><span>Executions</span><span className="nav-count">{dashboard.stats.executionCount}</span></a>
        </nav>
        <div className="agent-card data-card">
          <div className="agent-card-top"><span className="agent-orb"><Database size={17} /></span><span className="status-dot" />{connection === "live" ? "Live" : connection === "error" ? "Issue" : "Connecting"}</div>
          <strong>Supabase data source</strong>
          <p>{dashboard.stats.totalVerifications} decisions and {dashboard.pnlSnapshots.length} P&amp;L snapshots loaded.</p>
          <div className="agent-meta"><span>Last API refresh</span><b>{dashboard.generatedAt ? formatDate(dashboard.generatedAt) : "—"}</b></div>
        </div>
      </aside>

      {menuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

      <section className="workspace" id="overview">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="searchbox"><Search size={18} /><input aria-label="Search contracts" placeholder="Search contract symbols…" value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setContractPage(1); }} /></div>
          <div className="topbar-actions">
            <span className={`connection-badge top-connection ${connection}`}><i />{connection === "live" ? "Database connected" : connection === "error" ? "Connection issue" : "Connecting"}</span>
            <a className="report-button export-button" href="/api/export"><Download size={17} /> Export database</a>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="page-heading">
            <div><p className="eyebrow"><ShieldCheck size={14} /> Live decision operations</p><h1>Trade verification firewall</h1><p>Every figure below is sourced from the connected Supabase project.</p></div>
          </div>

          {(dashboard.errorMessage || contracts.errorMessage) && (
            <div className="page-error"><XCircle size={16} /><div><strong>Some live data could not be loaded.</strong><span>{dashboard.errorMessage ?? contracts.errorMessage}</span></div></div>
          )}

          <section className="metrics-grid" aria-label="Database summary">
            <article className="metric-card featured">
              <div className="metric-top"><span>Portfolio value</span><span className="metric-icon"><WalletCards size={18} /></span></div>
              <h2>{formatMoney(latestSnapshot?.portfolio_value)}</h2>
              <div className="metric-bottom"><span>Snapshot {formatDate(latestSnapshot?.captured_at, false)}</span></div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Net P&amp;L</span><span className="metric-icon green"><TrendingUp size={18} /></span></div>
              <h2 className={Number(latestSnapshot?.net_pnl) < 0 ? "metric-negative" : ""}>{formatMoney(latestSnapshot?.net_pnl)}</h2>
              <div className="metric-bottom"><span>Latest recorded snapshot</span></div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Daily return</span><span className="metric-icon amber"><Activity size={18} /></span></div>
              <h2>{latestSnapshot?.daily_return_pct == null ? "—" : `${Number(latestSnapshot.daily_return_pct).toFixed(2)}%`}</h2>
              <div className="metric-bottom"><span>Database value, not market-derived</span></div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Approval rate</span><span className="metric-icon purple"><Gauge size={18} /></span></div>
              <h2>{dashboard.stats.approvalRate}% <small>{dashboard.stats.totalVerifications} decisions</small></h2>
              <div className="risk-track approval-track"><span style={{ width: `${dashboard.stats.approvalRate}%` }} /></div>
              <div className="metric-bottom risk-copy"><span>Avg confidence</span><b>{dashboard.stats.averageConfidence}%</b></div>
            </article>
          </section>

          <section className="main-grid" id="performance">
            <article className="panel performance-panel">
              <div className="panel-header">
                <div><h3>Portfolio value history</h3><p>Recorded P&amp;L snapshots; duplicate timestamps remain visible as captured.</p></div>
                <div className="period-switcher" role="group" aria-label="Performance period">{periods.map((item) => <button key={item} className={period === item ? "active" : ""} onClick={() => setPeriod(item)}>{item}</button>)}</div>
              </div>
              <div className="chart-summary"><strong>{formatMoney(latestSnapshot?.portfolio_value, 0)}</strong><span className="snapshot-count">{visibleSnapshots.length} snapshots</span></div>
              <div className="chart-wrap live-chart-wrap">
                {chart ? <>
                  <div className="chart-labels"><span>{formatMoney(chart.max, 0)}</span><span>{formatMoney((chart.max + chart.min) / 2, 0)}</span><span>{formatMoney(chart.min, 0)}</span></div>
                  <svg className="performance-chart" viewBox="0 0 760 220" preserveAspectRatio="none" role="img" aria-label={`Portfolio value for ${period}`}>
                    <defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#695cf6" stopOpacity="0.22" /><stop offset="1" stopColor="#695cf6" stopOpacity="0" /></linearGradient></defs>
                    <g className="grid-lines"><line x1="0" y1="20" x2="760" y2="20"/><line x1="0" y1="110" x2="760" y2="110"/><line x1="0" y1="200" x2="760" y2="200"/></g>
                    <path className="chart-area" d={chart.area}/><path className="chart-line" d={chart.line}/>
                    <circle className="chart-end-glow" cx={chart.last.x} cy={chart.last.y} r="9"/><circle className="chart-end" cx={chart.last.x} cy={chart.last.y} r="4"/>
                  </svg>
                  <div className="chart-dates"><span>{formatDate(visibleSnapshots[0]?.captured_at, false)}</span><span>{formatDate(visibleSnapshots.at(-1)?.captured_at, false)}</span></div>
                </> : <div className="chart-empty"><BarChart3 size={20} /> No P&amp;L snapshots are available.</div>}
              </div>
            </article>

            <article className="panel activity-panel">
              <div className="panel-header"><div><h3>Latest decisions</h3><p>Includes contract checks and symbol-less hold decisions.</p></div><span className="live-pill"><i />Live</span></div>
              <div className="activity-list decision-list">
                {dashboard.recentDecisions.slice(0, 5).map((decision) => (
                  <div className="activity-item" key={decision.id}>
                    <span className={`activity-icon ${decision.approved ? "green" : "rose"}`}>{decision.approved ? <CheckCircle2 size={16} /> : <XCircle size={16} />}</span>
                    <div><strong>{decision.symbol ?? "Hold / no contract"}</strong><p>{decision.reason ?? "No rationale recorded."}</p></div>
                    <time>{formatDate(decision.created_at)}</time>
                  </div>
                ))}
                {!dashboard.recentDecisions.length && <div className="compact-empty">No verification decisions found.</div>}
              </div>
            </article>
          </section>

          <section className="panel verification-panel" id="verification">
            <div className="verification-header">
              <div>
                <div className="verification-title-row"><h3>Contract verifications</h3><span className={`connection-badge ${contracts.connection}`}><i />{contracts.connection === "live" ? "Connected" : contracts.connection === "connecting" ? "Connecting" : "Connection issue"}</span></div>
                <p>Symbol-bearing decisions grouped by contract. Open a contract to inspect its rationale and linked execution.</p>
              </div>
              <div className="verification-stats" aria-label="Trade verification summary">
                <span><b>{contracts.stats.totalContracts}</b><small>Contracts</small></span>
                <span><b>{contracts.stats.totalActions}</b><small>Actions</small></span>
                <span><b>{contracts.stats.approvalRate}%</b><small>Approval rate</small></span>
                <span><b>{contracts.stats.averageConfidence}%</b><small>Avg confidence</small></span>
              </div>
            </div>
            <div className={`verification-table ${contracts.isLoading ? "is-loading" : ""}`} role="table" aria-label="Contracts with trade verifications" aria-busy={contracts.isLoading}>
              <div className="verification-columns grouped" role="row"><span>Contract</span><span>Actions</span><span>Approved</span><span>Avg confidence</span><span>Latest decision</span><span>Last activity</span><span aria-hidden="true" /></div>
              {contracts.groups.length ? contracts.groups.map((group) => {
                const underlying = group.symbol.match(/^[A-Z]+/)?.[0] ?? group.symbol;
                const tone = group.latestApproved ? "approved" : "rejected";
                return <Link className={`contract-group-row ${tone}`} key={group.symbol} href={`/contracts/${encodeURIComponent(group.symbol)}`} onClick={() => setNavigatingContract(true)}>
                  <span className="contract-cell"><i>{underlying.slice(0, 2)}</i><span><strong>{underlying}</strong><small>{group.symbol}</small></span></span>
                  <strong className="action-count">{group.actionCount}</strong>
                  <span className="approval-split"><b>{group.approvedCount}</b><small>{group.rejectedCount} rejected</small></span>
                  <span className="confidence-cell"><span><i style={{ width: `${group.averageConfidence}%` }} /></span><b>{group.averageConfidence}%</b></span>
                  <span className={`decision-badge ${tone}`}>{group.latestApproved ? "Approved" : "Rejected"}</span>
                  <time>{formatDate(group.latestAt)}</time><ArrowUpRight className="group-chevron" size={15} />
                </Link>;
              }) : <div className="empty-feed">{contracts.isLoading ? <LoaderCircle className="spinner" size={18} /> : <Search size={18} />}<span>{contracts.isLoading ? "Loading contracts…" : searchQuery ? `No contracts match “${searchQuery}”.` : "No symbol-bearing decisions found."}</span></div>}
              {contracts.isLoading && contracts.groups.length > 0 && <div className="table-loader" role="status"><LoaderCircle className="spinner" size={17} /><span>Loading contracts…</span></div>}
            </div>
            <div className="table-pagination" aria-label="Contract pagination">
              <span>Showing {contracts.groups.length ? (contracts.pagination.page - 1) * contracts.pagination.pageSize + 1 : 0}–{Math.min(contracts.pagination.page * contracts.pagination.pageSize, contracts.pagination.totalItems)} of {contracts.pagination.totalItems} contracts</span>
              <div><button disabled={contracts.pagination.page <= 1} onClick={() => setContractPage((current) => Math.max(1, current - 1))}>Previous</button><b>Page {contracts.pagination.page} of {contracts.pagination.totalPages}</b><button disabled={contracts.pagination.page >= contracts.pagination.totalPages} onClick={() => setContractPage((current) => Math.min(contracts.pagination.totalPages, current + 1))}>Next</button></div>
            </div>
          </section>

          <section className="panel execution-panel" id="executions">
            <div className="panel-header"><div><h3>Execution lifecycle</h3><p>Linked through <code>trade_executions.verification_id</code> to each verification decision.</p></div><span className="record-count">{dashboard.executions.length} records</span></div>
            <div className="execution-table">
              <div className="execution-head"><span>Execution</span><span>Verification</span><span>Contract</span><span>Status</span><span>Filled</span><span>Updated</span></div>
              {dashboard.executions.map((execution) => <div className="execution-row" key={execution.id}>
                <strong>#{execution.id}<small>{execution.broker_order_id ?? "No broker order ID"}</small></strong>
                <span>#{execution.verification_id ?? "—"}</span><span>{execution.verification?.symbol ?? "Hold / unknown"}</span>
                <span className={`status-pill ${(execution.status ?? "unknown").toLowerCase()}`}>{execution.status ?? "Unknown"}</span>
                <span>{execution.filled_qty ?? 0}{execution.average_fill_price != null ? ` @ ${formatMoney(execution.average_fill_price)}` : ""}</span>
                <time>{formatDate(execution.updated_at)}</time>
              </div>)}
              {!dashboard.executions.length && <div className="execution-empty"><Clock3 size={23} /><strong>No executions received</strong><p>The table is connected and will populate when <code>trade_executions</code> receives rows.</p></div>}
            </div>
          </section>
        </div>
      </section>
      {navigatingContract && <div className="route-transition-loader" role="status" aria-live="polite"><LoaderCircle className="spinner" size={24} /><span>Opening contract history…</span></div>}
    </main>
  );
}
