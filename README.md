Trade Verification Firewall — n8n Workflow

An automated, AI-verified options trading pipeline built in n8n. The workflow pulls live market data, uses a two-stage AI verification process (via Gemini) to validate trade signals before execution, and logs every step to Google Sheets for auditability.

Overview

This workflow acts as a "firewall" between raw trading signals and actual order execution — no trade reaches Alpaca's order API without passing through an AI-driven verification gate.

Workflow Steps
Schedule Trigger — Runs the workflow on a fixed interval.
Data Fetch (parallel)
options contracts — Pulls available options contracts from Alpaca's Paper API.
alpaca — Pulls live market data from Alpaca's Market Data API.
Gemini (Signal Generation) — Sends market/contract data to Gemini to generate an initial trade signal or recommendation.
code1 — Parses/transforms Gemini's output into a structured format.
Get many rows1 — Retrieves historical/reference rows (e.g., prior trades, rules) from a connected data table.
builds verifier prompt — Constructs a verification prompt combining the trade signal and reference data.
verifier (Gemini) — A second, independent Gemini call that verifies whether the proposed trade meets risk/logic criteria.
code 2 — Parses the verifier's response.
Verification Gate
verification — Logs the verification result as a new row.
gate allow / gate blocker — Filters execution based on whether the trade passed or failed verification. Only approved trades continue downstream; blocked trades are logged and stopped.
Get many rows — Retrieves additional data needed to build the final order.
Code 3 — Formats the order payload.
If — Final conditional check before placing a live order.
place order — Sends the order to Alpaca's Paper API.
Append row in sheet — Logs the placed order to Google Sheets.
Wait — Pauses to allow the order time to fill.
Fetch Updated Order Status — Polls Alpaca for the order's current status.
format execution — Formats the execution result.
Create a row2 — Logs the final execution outcome to the data table/sheet.
Key Design: The Verification Firewall

The core safety mechanism is the two-stage AI check:

Stage 1 (Gemini) generates a candidate trade.
Stage 2 (verifier) independently evaluates that trade against rules/history before it's allowed to reach the place order step.

This separation prevents a single AI call from having unchecked authority to execute trades — every recommendation must pass a second, independent verification gate.

Requirements
n8n instance (self-hosted or cloud)
Alpaca Paper Trading API credentials
Google Gemini API credentials
Google Sheets (or connected data table) for logging
Setup
Import trade-verification-firewall.json into n8n (Workflows → Import from File).
Add your Alpaca and Gemini credentials in n8n's Credentials manager.
Connect your Google Sheet / data table for logging.
Adjust the Schedule Trigger interval as needed.
Test with Execute workflow before enabling the schedule.
Notes
Built during the Alpaca hackathon by a 5-person team.
Uses Alpaca's Paper API — safe for testing without real capital at risk.
Debugging this pipeline (frontend/backend sync + verification logic) was one of the team's key milestones during the build.
