# Arc Token Radar

A read-only token monitoring and risk intelligence dashboard for Arc mainnet (chain ID 5042). It discovers newly launched tokens, scores detected risk and trading momentum separately, and shows the evidence behind every rating. It never connects a wallet, signs, or sends transactions.

Built with [Arc Studio](https://studio.arc.io)

## What it does

- Dashboard of newly detected tokens with first-seen time, liquidity, volume, price change, holder concentration and buy/sell activity, plus search, filters, sortable columns and a watchlist.
- Token detail page with a traffic-light risk rating (green, yellow, red, or gray when evidence is incomplete), a separate opportunity score, and every finding with its source, timestamp, confidence and limitations.
- Alert center for new tokens, worsening risk and tokens that match your opportunity criteria.
- Scanner status (live, delayed, unavailable, or demo-only) and a sources page showing which discovery methods are active.
- Demo mode with clearly labelled fictional tokens. Live mode never falls back to demo data on its own.

## Tech stack

React, Vite, TypeScript, Tailwind CSS, a small Bun API and scanner, viem for ABI encoding, Bun's test runner.

## Development

Prerequisites: Bun.

```bash
bun install
bun run dev        # starts the API + scanner (port 3001) and the Vite app (port 5173)
bun run server     # API + scanner only
bun run worker     # scanner only, for an always-on host
bun run test       # unit tests for parsing and scoring
bun run check      # lint + typecheck
```

### Environment variables

All optional. Copy `.env.example` to `.env` to set them.

| Variable | Purpose |
| --- | --- |
| `ARC_RPC_URL` | Arc JSON-RPC endpoint. Defaults to the public Arc mainnet endpoint. |
| `BITQUERY_API_KEY` | Bitquery access token for trades and holder data. Server-side only; never sent to the browser. |
| `BITQUERY_GRAPHQL_URL` | Bitquery endpoint. Defaults to `https://streaming.bitquery.io/graphql`. |
| `SCANNER_ENABLED`, `SCAN_INTERVAL_MS`, `SCAN_LOOKBACK_HOURS`, `SCAN_CONFIRMATIONS`, `SCAN_CHUNK_BLOCKS`, `SCAN_MAX_CHUNKS_PER_CYCLE` | Scanner polling and backfill tuning. |
| `RPC_MIN_INTERVAL_MS` | Minimum spacing between RPC requests. |
| `REFRESH_WINDOW_HOURS`, `MAX_REFRESH_PER_CYCLE` | How many recent tokens are re-measured each cycle. |
| `NEW_TOKEN_LIVE_LAG_MINUTES` | Discoveries older than this when scanned count as backfill and never raise new-token alerts. |
| `API_PORT`, `DATA_DIR` | API port and where checkpoints and the token index are stored. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash Redis (REST) for durable state shared between the deployed API and a worker. Without it the Vercel API keeps results in one warm instance only. |
| `CRON_SECRET` | Authorises `GET /api/cron`. Required for scheduled scans. |
| `SCAN_BUDGET_MS`, `SCAN_COOLDOWN_MS`, `SERVERLESS_FRESH_MS` | Time budget of one serverless scan, minimum gap between public scans, and how long results count as fresh. |
| `RPC_PROXY_BASE_URL`, `RPC_PROXY_TOKEN`, `RPC_PROXY_CHAINS` | Provisioned by Arc Studio. Optional outside Arc Studio. |

### Continuous scanning

The scanner stores checkpoints and tokens in `DATA_DIR` so restarts resume where they stopped. Browser polling only refreshes the view. For 24/7 monitoring, run `bun run worker` (or `bun run server`) on an always-on host with a persistent data directory.

### Deploying to Vercel

`bun run build:vercel` builds the dashboard and bundles the API into a single Vercel Function (`api/[...path].js`) plus `vercel.json`; deploy the `dist` folder. API routes: `GET /api/health`, `/api/status`, `/api/tokens`, `/api/alerts`, `/api/config`, `POST /api/scan` (one bounded scan, rate limited) and `GET /api/cron` (needs `CRON_SECRET`).

Serverless functions cannot run a background loop. Each scan is bounded by a time budget and resumes from stored checkpoints. For results that persist and keep updating:

1. Add an Upstash Redis database to the Vercel project (sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`) and set `CRON_SECRET`, then redeploy.
2. Scheduling: the bundled cron runs once a day, the most frequent schedule Hobby plans accept. Pro plans can run it every minute. For frequent scans on any plan, run `bun run worker` on an always-on host with the same Redis variables, or call `/api/cron` from an external scheduler with the secret.

### Troubleshooting

- **Dashboard says the scanner API is not running:** the Vite app proxies `/api` to port 3001. Start the backend with `bun run server` (or `bun run dev`, which starts both). The proxy answers 503 with a JSON explanation when nothing is listening.
- **`/api/status` lists `hints`:** secret-free next steps, such as a wrong or unreachable `ARC_RPC_URL` or a missing `BITQUERY_API_KEY`. The scanner checks `eth_chainId` and refuses to process data unless it is 5042.
- Server errors are logged in full to the server's stdout and returned to the browser as a short message.

### Scoring configuration

Thresholds and weights live in `src/engine/config.ts`. Adjust them live in the Settings page, or place a `scoring.override.json` in the data directory to change the scanner's own alert thresholds.
