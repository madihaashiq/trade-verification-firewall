# Trade Verification Firewall

An AI-verified, automated options trading system built on **n8n**, **Alpaca**, and **Google Gemini**. The system generates trade signals from live market data, independently verifies each signal through a second AI pass before execution, and continuously tracks portfolio performance — all without a human in the loop.

Built during the **Alpaca Hackathon** by a team of five.

---

## Overview

Automated trading systems face a core risk: a single point of failure between signal generation and order execution. This project addresses that by introducing a **verification firewall** — no trade reaches the market until it has independently passed a second AI-driven review.

The system is composed of two workflows:

| Workflow | Purpose |
|---|---|
| **Trade Verification Firewall** | Generates, verifies, and executes options trades |
| **P&L Tracker** | Captures portfolio performance snapshots on a recurring schedule |

---

## Architecture

### 1. Trade Verification Firewall

```
Market Data (Alpaca) ──► Signal Generation (Gemini)
                              │
                              ▼
                     Verifier Prompt Builder
                              │
                              ▼
                    Independent Verification (Gemini)
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
               Gate: Allow        Gate: Block
                     │                 │
                     ▼                 ▼
             Place Order (Alpaca)   Log & Stop
                     │
                     ▼
          Poll Order Status ──► Log Execution
```

**Key design principle:** trade generation and trade approval are handled by two separate, independent AI calls. A signal can only reach the execution stage if it passes verification against risk and logic rules — preventing a single model call from having unchecked authority over live orders.

### 2. P&L Tracker

Runs every 5 minutes during market hours (9:00 AM–3:59 PM, Mon–Fri) to:
1. Pull portfolio history from Alpaca's Account API
2. Transform raw equity/return data into structured snapshots
3. Persist each snapshot to Supabase for historical analysis

---

## Tech Stack

- **Orchestration:** n8n (workflow automation)
- **Market Data & Execution:** Alpaca Paper Trading API
- **AI Signal Generation & Verification:** Google Gemini API
- **Data Storage:** Supabase, Google Sheets
- **Scheduling:** Cron-based triggers

---

## Repository Contents

```
├── Trade_verification_firewall.json   # Signal generation, verification, execution
├── P_L.json                           # Scheduled portfolio performance tracker
└── README.md
```

---

## Setup

1. **Import workflows** into n8n: `Workflows → Import from File` for each `.json` file.
2. **Configure credentials** in n8n's Credentials manager:
   - Alpaca API (Custom Auth — key ID + secret)
   - Google Gemini API
   - Supabase API
3. **Set your data destinations** — table names in Supabase and/or the target Google Sheet.
4. **Test each workflow** manually via *Execute workflow* before enabling the schedule trigger.
5. **Activate** both workflows once verified.

> **Security note:** API credentials should always be stored in n8n's Credentials manager, never hardcoded into node parameters or URLs. Exported workflow files are safe to share publicly only after confirming no live keys are embedded in them.

---

## Team

Built by a six-person team over the course of the Alpaca Hackathon. One of the project's defining milestones was debugging the frontend/backend integration around the verification firewall — resolving synchronization and validation issues between the trade-approval logic and the execution pipeline was the turning point that let the full pipeline run end-to-end.

---

## Disclaimer

This project trades exclusively against Alpaca's **Paper Trading API**. It is a hackathon prototype for demonstrating AI-verified automated trading concepts and is not intended for use with real capital without further risk controls, testing, and compliance review.
