# Arcline trade verification firewall

A Next.js operations dashboard backed by Supabase. It exposes only features supported by the current database:

- portfolio value, net P&L, and daily return history from `pnl_snapshots`;
- grouped and detailed decisions from `Trade Verification node`;
- execution lifecycle data joined through `trade_executions.verification_id`;
- a server-generated JSON export of all three tables (requires the `EXPORT_ACCESS_KEY` environment variable to be set — disabled by default).

## Local setup

Copy `.env.example` to `.env` and set the project URL and service-role key. The service-role key is intentionally read only by Next.js route handlers and must never use a `NEXT_PUBLIC_` prefix.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data relationship

`trade_executions.verification_id` links to `Trade Verification node.id`. P&L snapshots are time-series portfolio records and are not directly related to an individual verification.

The dashboard refreshes every 15 seconds. If `trade_executions` is empty, the execution section displays a connected empty state and populates automatically when records arrive.

## Docker

Build and run the production container with the existing local credentials:

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). Set `APP_PORT` before starting Compose if port 3000 is already in use. The Compose file reads `.env` only at runtime; credentials are not copied into the image.
