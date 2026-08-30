"use client";

import {
  Activity, ArrowUpRight, Bell, Bot, BrainCircuit, ChevronDown, ChevronRight, CircleHelp,
  FileClock, Gauge, LayoutDashboard, LineChart, Menu, MoreHorizontal,
  PieChart, Search, Settings, ShieldCheck, Sparkles, Target, TrendingUp,
  WalletCards, X, XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useContractGroups } from "./use-trade-verifications";

const periods = ["1W", "1M", "3M", "1Y", "All"];

const positions = [
  { symbol: "NVDA", name: "NVIDIA", side: "Long", allocation: "18.4%", value: "$28,940", pnl: "+$2,814", change: "+10.7%", tone: "violet" },
  { symbol: "AAPL", name: "Apple", side: "Long", allocation: "15.2%", value: "$23,880", pnl: "+$1,126", change: "+4.9%", tone: "blue" },
  { symbol: "MSFT", name: "Microsoft", side: "Long", allocation: "12.8%", value: "$20,114", pnl: "+$842", change: "+4.4%", tone: "sky" },
  { symbol: "TSLA", name: "Tesla", side: "Hedged", allocation: "8.6%", value: "$13,520", pnl: "−$386", change: "−2.8%", tone: "rose" },
];

const activityItems = [
  { Icon: BrainCircuit, title: "Risk exposure rebalanced", detail: "Reduced technology concentration by 2.4%", time: "12 min ago", tone: "purple" },
  { Icon: TrendingUp, title: "Profit target reached", detail: "NVDA position secured +$1,240", time: "38 min ago", tone: "green" },
  { Icon: ShieldCheck, title: "Protection rule verified", detail: "All positions remain within risk policy", time: "1 hr ago", tone: "blue" },
];

function BrandMark() {
  return <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>;
}

function MiniSparkline({ color = "green" }: { color?: "green" | "blue" }) {
  return (
    <svg className={`sparkline ${color}`} viewBox="0 0 90 34" role="img" aria-label="Recent trend">
      <path className="spark-area" d="M2 29 C12 27,15 20,25 23 S39 14,48 17 S62 8,70 12 S80 4,88 5 L88 34 L2 34 Z" />
      <path className="spark-stroke" d="M2 29 C12 27,15 20,25 23 S39 14,48 17 S62 8,70 12 S80 4,88 5" />
    </svg>
  );
}

export default function Home() {
  const [period, setPeriod] = useState("3M");
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contractPage, setContractPage] = useState(1);
  const { groups, pagination, connection, errorMessage, stats } = useContractGroups(contractPage, searchQuery);

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <BrandMark />
          <div><strong>Arcline</strong><span>Autonomous capital</span></div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>
        <nav aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          <a className="nav-item active" href="#overview"><LayoutDashboard size={19} /><span>Overview</span></a>
          <a className="nav-item" href="#performance"><LineChart size={19} /><span>Performance</span></a>
          <a className="nav-item" href="#verification"><Activity size={19} /><span>Verification feed</span><span className="nav-live" /></a>
          <a className="nav-item" href="#portfolio"><PieChart size={19} /><span>Portfolio</span><span className="nav-count">7</span></a>
          <a className="nav-item" href="#activity"><BrainCircuit size={19} /><span>AI activity</span></a>
          <a className="nav-item" href="#reports"><FileClock size={19} /><span>Reports</span></a>
          <p className="nav-label secondary">Account</p>
          <a className="nav-item" href="#settings"><Settings size={19} /><span>Settings</span></a>
          <a className="nav-item" href="#help"><CircleHelp size={19} /><span>Help centre</span></a>
        </nav>
        <div className="agent-card">
          <div className="agent-card-top"><span className="agent-orb"><Bot size={17} /></span><span className="status-dot" />Live</div>
          <strong>Atlas AI is active</strong>
          <p>Monitoring 7 positions across 3 strategies.</p>
          <div className="agent-meter"><span /></div>
          <div className="agent-meta"><span>System confidence</span><b>92%</b></div>
        </div>
        <button className="profile-card">
          <span className="avatar">MT</span><span><strong>Ming Tang</strong><small>Alpha portfolio</small></span><MoreHorizontal size={18} />
        </button>
      </aside>

      {menuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

      <section className="workspace" id="overview">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="searchbox"><Search size={18} /><input aria-label="Search contracts" placeholder="Search contract symbols…" value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setContractPage(1); }} /></div>
          <div className="topbar-actions">
            <div className="market-state"><span />Markets open <b>·</b> 2h 14m</div>
            <button className="icon-button" aria-label="Notifications"><Bell size={19} /><span className="notification-dot" /></button>
            <button className="portfolio-switcher"><span className="switcher-icon"><WalletCards size={17} /></span><span><small>Portfolio</small><strong>Growth Alpha</strong></span><ChevronDown size={16} /></button>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="page-heading">
            <div><p className="eyebrow"><Sparkles size={14} /> AI-managed portfolio</p><h1>Good morning, Ming.</h1><p>Your portfolio is outperforming its benchmark by <strong>4.8%</strong> this quarter.</p></div>
            <button className="report-button" onClick={() => { setReportReady(true); window.setTimeout(() => setReportReady(false), 2400); }}><FileClock size={17} /> Export report</button>
          </div>

          <section className="metrics-grid" aria-label="Portfolio summary">
            <article className="metric-card featured">
              <div className="metric-top"><span>Portfolio value</span><span className="metric-icon"><WalletCards size={18} /></span></div>
              <h2>$157,426.80</h2><div className="metric-bottom"><span className="positive"><ArrowUpRight size={15} /> 12.8%</span><span>+$17,890 this year</span></div><MiniSparkline color="blue" />
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Total return</span><span className="metric-icon green"><TrendingUp size={18} /></span></div>
              <h2>+$18,642.36</h2><div className="metric-bottom"><span className="positive"><ArrowUpRight size={15} /> 13.4%</span><span>All time</span></div><MiniSparkline />
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Win rate</span><span className="metric-icon amber"><Target size={18} /></span></div>
              <h2>72.6%</h2><div className="metric-bottom"><span className="positive"><ArrowUpRight size={15} /> 3.2%</span><span>vs last month</span></div><MiniSparkline />
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Risk score</span><span className="metric-icon purple"><Gauge size={18} /></span></div>
              <h2>Low <small>2.4 / 10</small></h2><div className="risk-track"><span /></div><div className="metric-bottom risk-copy"><span>Conservative</span><span>Within mandate</span></div>
            </article>
          </section>

          <section className="panel verification-panel" id="verification">
            <div className="verification-header">
              <div>
                <div className="verification-title-row"><h3>Live trade verification</h3><span className={`connection-badge ${connection}`}><i />{connection === "live" ? "Connected" : connection === "connecting" ? "Connecting" : connection === "error" ? "Connection issue" : "Preview data"}</span></div>
                <p>Contracts are grouped here. Open one to review every AI action, confidence score, and rationale.</p>
              </div>
              <div className="verification-stats" aria-label="Trade verification summary">
                <span><b>{stats.totalContracts}</b><small>Contracts</small></span>
                <span><b>{stats.totalActions}</b><small>Actions</small></span>
                <span><b>{stats.approvalRate}%</b><small>Approval rate</small></span>
                <span><b>{stats.averageConfidence}%</b><small>Avg confidence</small></span>
              </div>
            </div>
            {connection === "error" && <div className="connection-error"><XCircle size={14} /> The live feed could not be loaded. {errorMessage}</div>}
            <div className="verification-table" role="table" aria-label="Contracts with trade verifications">
              <div className="verification-columns grouped" role="row"><span>Contract</span><span>Actions</span><span>Approved</span><span>Avg confidence</span><span>Latest decision</span><span>Last activity</span><span aria-hidden="true" /></div>
              {groups.length > 0 ? groups.map((group) => {
                const underlying = group.symbol.match(/^[A-Z]+/)?.[0] ?? group.symbol;
                const confidenceTone = group.latestApproved ? "approved" : "rejected";
                return (
                  <Link className={`contract-group-row ${confidenceTone}`} key={group.symbol} href={`/contracts/${encodeURIComponent(group.symbol)}`}>
                      <span className="contract-cell"><i>{underlying.slice(0, 2)}</i><span><strong>{underlying}</strong><small>{group.symbol}</small></span></span>
                      <strong className="action-count">{group.actionCount}</strong>
                      <span className="approval-split"><b>{group.approvedCount}</b><small>{group.rejectedCount} rejected</small></span>
                      <span className="confidence-cell"><span><i style={{ width: `${group.averageConfidence}%` }} /></span><b>{group.averageConfidence}%</b></span>
                      <span className={`decision-badge ${confidenceTone}`}>{group.latestApproved ? "Approved" : "Rejected"}</span>
                      <time>{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(group.latestAt))}</time>
                      <ChevronRight className="group-chevron" size={16} />
                  </Link>
                );
              }) : <div className="empty-feed"><Search size={18} /><span>{connection === "connecting" ? "Loading grouped contracts…" : `No contracts match “${searchQuery}”.`}</span></div>}
            </div>
            <div className="table-pagination" aria-label="Contract pagination">
              <span>Showing {groups.length ? (pagination.page - 1) * pagination.pageSize + 1 : 0}–{Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} contracts</span>
              <div><button disabled={pagination.page <= 1} onClick={() => setContractPage((current) => Math.max(1, current - 1))}>Previous</button><b>Page {pagination.page} of {pagination.totalPages}</b><button disabled={pagination.page >= pagination.totalPages} onClick={() => setContractPage((current) => Math.min(pagination.totalPages, current + 1))}>Next</button></div>
            </div>
          </section>

          <section className="main-grid" id="performance">
            <article className="panel performance-panel">
              <div className="panel-header">
                <div><h3>Portfolio performance</h3><p>Net value after fees and realised gains</p></div>
                <div className="period-switcher" role="group" aria-label="Performance period">{periods.map((item) => <button key={item} className={period === item ? "active" : ""} onClick={() => setPeriod(item)}>{item}</button>)}</div>
              </div>
              <div className="chart-summary"><strong>$157,426</strong><span className="positive"><ArrowUpRight size={14} /> 8.2% in {period}</span></div>
              <div className="chart-wrap">
                <div className="chart-labels"><span>$160k</span><span>$150k</span><span>$140k</span><span>$130k</span><span>$120k</span></div>
                <svg className="performance-chart" viewBox="0 0 760 230" preserveAspectRatio="none" role="img" aria-label={`Portfolio performance for ${period}`}>
                  <defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#695cf6" stopOpacity="0.22" /><stop offset="1" stopColor="#695cf6" stopOpacity="0" /></linearGradient></defs>
                  <g className="grid-lines"><line x1="0" y1="25" x2="760" y2="25"/><line x1="0" y1="70" x2="760" y2="70"/><line x1="0" y1="115" x2="760" y2="115"/><line x1="0" y1="160" x2="760" y2="160"/><line x1="0" y1="205" x2="760" y2="205"/></g>
                  <path className="chart-area" d="M0 195 C35 190 46 176 78 180 C106 183 123 158 152 164 C184 170 190 140 228 145 C260 150 275 130 305 134 C338 137 351 101 390 108 C419 113 431 87 466 91 C501 96 518 70 548 74 C579 77 596 50 628 57 C657 62 674 34 702 42 C728 48 743 26 760 30 L760 230 L0 230 Z"/>
                  <path className="chart-line" d="M0 195 C35 190 46 176 78 180 C106 183 123 158 152 164 C184 170 190 140 228 145 C260 150 275 130 305 134 C338 137 351 101 390 108 C419 113 431 87 466 91 C501 96 518 70 548 74 C579 77 596 50 628 57 C657 62 674 34 702 42 C728 48 743 26 760 30"/>
                  <circle className="chart-end-glow" cx="760" cy="30" r="9"/><circle className="chart-end" cx="760" cy="30" r="4"/>
                </svg>
                <div className="chart-tooltip"><span>Aug 26</span><strong>$157,426</strong></div>
                <div className="chart-dates"><span>Jun 1</span><span>Jun 21</span><span>Jul 11</span><span>Jul 31</span><span>Aug 20</span></div>
              </div>
            </article>

            <article className="panel allocation-panel">
              <div className="panel-header"><div><h3>Asset allocation</h3><p>Current portfolio mix</p></div><button className="more-button" aria-label="Allocation options"><MoreHorizontal size={19} /></button></div>
              <div className="donut-wrap"><div className="donut"><div><strong>7</strong><span>positions</span></div></div></div>
              <div className="allocation-list"><div><span><i className="dot equity" />US equities</span><b>58%</b></div><div><span><i className="dot bonds" />Fixed income</span><b>22%</b></div><div><span><i className="dot cash" />Cash reserve</span><b>13%</b></div><div><span><i className="dot hedge" />Hedges</span><b>7%</b></div></div>
            </article>
          </section>

          <section className="lower-grid">
            <article className="panel positions-panel" id="portfolio">
              <div className="panel-header"><div><h3>Top positions</h3><p>Largest allocations in your managed portfolio</p></div><button className="text-button">View all positions <ArrowUpRight size={14} /></button></div>
              <div className="positions-table" role="table" aria-label="Top portfolio positions">
                <div className="positions-head" role="row"><span>Asset</span><span>Strategy</span><span>Allocation</span><span>Market value</span><span>Return</span></div>
                {positions.map((item) => (
                  <div className="position-row" role="row" key={item.symbol}>
                    <div className="asset-cell"><span className={`asset-logo ${item.tone}`}>{item.symbol.slice(0,1)}</span><span><strong>{item.symbol}</strong><small>{item.name}</small></span></div>
                    <span><i className={`side-dot ${item.side === "Hedged" ? "hedged" : ""}`} />{item.side}</span>
                    <span>{item.allocation}</span><strong>{item.value}</strong>
                    <span className={item.pnl.startsWith("−") ? "negative-return" : "positive-return"}><b>{item.pnl}</b><small>{item.change}</small></span>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel activity-panel" id="activity">
              <div className="panel-header"><div><h3>AI activity</h3><p>Latest autonomous portfolio decisions</p></div><span className="live-pill"><i />Live</span></div>
              <div className="activity-list">
                {activityItems.map(({ Icon, ...item }) => <div className="activity-item" key={item.title}><span className={`activity-icon ${item.tone}`}><Icon size={16} /></span><div><strong>{item.title}</strong><p>{item.detail}</p></div><time>{item.time}</time></div>)}
              </div>
              <button className="activity-button">Open decision log <ArrowUpRight size={14} /></button>
            </article>
          </section>

          <section className="assurance-strip" id="reports">
            <span className="assurance-icon"><ShieldCheck size={19} /></span>
            <div><strong>Automation health is excellent</strong><p>All controls passed. No intervention required.</p></div>
            <div className="assurance-stats"><span><b>99.98%</b><small>Uptime</small></span><span><b>0</b><small>Policy breaches</small></span><span><b>2.4 / 10</b><small>Risk level</small></span></div>
          </section>
        </div>
      </section>
      {reportReady && <div className="toast" role="status"><ShieldCheck size={17} /> Report prepared for download</div>}
    </main>
  );
}
