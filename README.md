# Tradexa

Investment/trading platform monorepo. Phase 1 (test/MVP) focus: controlled
payment testing, configurable simulated returns (2% per 24-hour period), and a
user + admin platform backed by a single shared API and database.

> **Important (Phase 1):** Returns shown are **simulated test credits**, not
> actual trading profit or guaranteed investment returns. See
> `Tradexa_Software_Requirements.md` for full safety requirements.

## Monorepo layout

```
tradexa/
├── apps/
│   ├── web/      Next.js public + user dashboard (port 3001)
│   ├── admin/    Next.js admin dashboard (port 3002)
│   └── mobile/   Expo React Native app
├── services/
│   ├── api/                     NestJS backend (port 3000)
│   ├── worker/                  BullMQ + Redis jobs (test return engine)
│   └── notification-service/    Notification worker
├── packages/
│   ├── database/   Prisma schema + generated client
│   ├── types/      Shared TypeScript types
│   ├── validation/ Zod schemas
│   └── shared/     Shared constants/helpers
├── docs/
└── infrastructure/  docker-compose.yml (Postgres + Redis)
```

## Prerequisites

- Node.js >= 20
- npm (workspaces)
- Docker (for Postgres + Redis) or a running Postgres/Redis

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up the database.

   **Option A — Neon (serverless PostgreSQL, recommended for dev/staging):**
   1. Create a Neon project (neon.tech) and a database named `tradexa`.
   2. Copy the **direct/unpooled** connection string into
      `packages/database/.env` for migrations:
      `DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/tradexa?sslmode=require"`
   3. Copy the **pooled** connection string into `services/api/.env`,
      `services/worker/.env`, and `services/notification-service/.env` for the
      running services (host is `...-pooler.neon.tech`).

   **Option B — Docker (local Postgres + Redis):**

   ```bash
   docker compose -f infrastructure/docker-compose.yml up -d
   ```

   Set `DATABASE_URL` accordingly (local default is
   `postgresql://tradexa:tradexa@localhost:5432/tradexa_dev?schema=public`).

3. Set up the schema and seed default settings:

   ```bash
   npm run db:generate
   npm run db:migrate --workspace packages/database   # uses packages/database/.env
   npm run db:push --workspace packages/database
   npm run db:seed --workspace packages/database
   ```

   > Use the **direct/unpooled** Neon URL (or a local Postgres) when running
   > Prisma CLI commands from `packages/database/.env`. The running API and
   > workers use the **pooled** URL in their own `.env` files. See
   > `docs/neon.md` for the full Neon setup.

4. Run the services:

   ```bash
   npm run dev:worker      # test return engine
   npm run dev:api         # backend API
   npm run dev:web         # web app (http://localhost:3001)
   npm run dev:admin       # admin app (http://localhost:3002)
   ```

## Phase 1 scope (implemented)

- Monorepo scaffold, all core database tables (Prisma schema)
- NestJS API: config, Prisma, auth (Argon2id + JWT), users, health
- Test return engine worker: idempotent, UTC server timestamps,
  per-period unique constraint, missed-job handling
- Notification worker
- Next.js web (public site + auth + dashboard stub) and admin scaffolds
- Expo mobile scaffold sharing the same API

## Not yet implemented (scheduled milestones)

- Deposit/payment provider + webhooks (Milestone 3)
- Transaction/ledger API endpoints, dashboard portfolio UI (Milestone 2)
- Withdrawal workflow (Milestone 5)
- Full admin RBAC + audit logs UI (Milestone 6)
- Help center, tickets, notifications API (Milestone 7)
- Security/payment/load tests (Milestone 8)
- Mobile app full integration (Milestone 9)
- Paper trading / AI trading engine (Milestone 10)

## Deployment (free tier, for testing)

This repo includes Docker/Vercel config for a free hosting setup:

- **API** (NestJS) → **Railway** using the root `Dockerfile` (builds the whole
  monorepo, regenerates the Prisma client, and rebuilds the native `argon2`
  module). Start command: `node dist/main.js`.
- **Web** and **Admin** (Next.js) → **Vercel** via `apps/web/vercel.json` and
  `apps/admin/vercel.json`. Point each app's `framework` at `nextjs` and, in the
  project settings, set the Vercel **Root Directory** to the app folder.

### Required environment variables (set on each host, never in git)

| Host | Variables |
|------|-----------|
| Railway (API) | `DATABASE_URL` (Neon pooled URL), `JWT_SECRET` (strong random), `CORS_ORIGIN` (your two Vercel URLs, comma-separated), `PORT=3000` |
| Vercel (web) | `NEXT_PUBLIC_API_URL` (e.g. `https://your-api.up.railway.app/api/v1`) |
| Vercel (admin) | `NEXT_PUBLIC_API_URL` (same API URL) |

> Use the **pooled** Neon URL (host `...-pooler.neon.tech?sslmode=require`) for
> the running API. Copy to `.env.example` placeholders only — never commit the
> real `.env` files (they are gitignored via `.env.*` / `!.env.example`).

### Steps

1. **Push to GitHub** (required by all free hosts):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin git@github.com:<you>/tradexa.git
   git push -u origin main
   ```
2. **Railway** – New Project → Deploy from repo → it auto-detects the
   `Dockerfile`. Set the env vars above and deploy.
3. **Vercel** – Import the same repo twice, Root Directory `apps/web` then
   `apps/admin`, set `NEXT_PUBLIC_API_URL`, deploy each.
4. **Database** – keep using the existing Neon free instance; run
   `npm run db:push` pointed at Neon once to ensure the schema is current.

## Key principles

- **Backend is the source of truth.** Frontends never set balances, confirm
  payments, or modify ledger entries.
- Every financial event writes an immutable ledger entry; balances are
  reconstructed from ledger entries.
- Payment webhooks are verified server-side and idempotent.
- Configurable business settings live in `system_settings` (e.g.
  `test_return_rate`), not hard-coded.
- All backend timestamps are UTC; convert to local only when displaying.
