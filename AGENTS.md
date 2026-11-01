# Arc Token Radar

> Built with Arc Studio

Project memory for agents and developers.

## What This App Does

Read-only token discovery, risk scoring and opportunity ranking for Arc mainnet (5042). No contracts, no wallet, no transactions. Live data comes from a Bun scanner (Arc JSON-RPC, optional Bitquery); demo mode is a separate, labelled fictional dataset.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind. Arc Dark theme in `src/index.css`.
- Backend: Bun (`server/`), JSON-file store in `data/` (gitignored), proxied through Vite at `/api`.
- Tests: `bun test tests` (bun:test). Server and tests typecheck via `tsconfig.server.json`.

## Key Files

- `src/engine/` shared pure logic: `types`, `config` (all thresholds), `parse` (logs, ABI, bytecode), `risk`, `opportunity`, `score` (alerts), `analysis` (future AI layer interface).
- `server/providers/arcRpc.ts` discovery via `eth_getLogs`, token enrichment, pool liquidity. `bitquery.ts` market and holder adapter.
- `server/scanner.ts` cycle: scan, ingest (idempotent), enrich, refresh, alerts. Checkpoints advance only after a chunk is ingested.
- `src/hooks/useRadar.ts` client data layer (live vs demo, scoring, alerts).

## Decisions and Rules

- Missing data is `undefined`, scored as unknown, excluded from the score, and lowers coverage. Never default it to safe.
- Green risk requires a sell simulation (configurable). Arc RPC has no debug_trace or state-override simulation, so live tokens are gray at best until a simulator exists.
- Opportunity never alters risk. Opportunity alerts require non-gray risk within the configured band.
- Discoveries older than `NEW_TOKEN_LIVE_LAG_MINUTES` at scan time are backfill and never alert.
- Arc RPC limits measured in development: eth_getLogs range must stay under 10,000 blocks (scanner uses 2,000), and rapid requests hit rate limiting (-32005); the client spaces and retries requests.
- Bitquery queries (`server/providers/bitquery.ts`) follow Bitquery's published Arc examples but have not been executed against the live API because no token was available in development.
- Contract addresses in `server/chain.ts` are third-party reference data (Uniswap on Arc, launchpads from Bitquery docs). Re-verify when launchpads rotate contracts.

## To Run

```bash
bun install
bun run dev
bun run test
bun run check
```


## Vercel deployment (production)

- Build: `bun run build:vercel` then deploy `dist`. One function, `api/[...path].js`, serves every `/api/*` route via `server/routes.ts` (shared with the local Bun server). `server/vercel.ts` adapts Node req/res to Web Request/Response.
- Storage: Redis REST (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) via `server/storage.ts`; otherwise per-instance memory, reported as non-durable in `/api/health` and `/api/status`.
- Scans are bounded (`SCAN_BUDGET_MS`), cooldown-limited, and lock-protected. No polling loop runs in a function.
- Cron: daily at 06:00 UTC by default (Hobby limit). `CRON_SECRET` must be set or `/api/cron` returns 503.
- Production URL: https://arc-studio-3c7427755a6340689b299298.vercel.app (verified: /api/health reports Arc chain 5042).
