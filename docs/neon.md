# Connecting Tradexa to Neon (serverless PostgreSQL)

Neon is a serverless, branching PostgreSQL database. Tradexa is built to run on
it unchanged because it uses Prisma + PostgreSQL with `postgresql://` URLs.

## Setup

1. Create a project at https://neon.tech.
2. In **Connection Details**, copy the two connection strings for your
   database (e.g. database name `tradexa`):
   - **Direct / unpooled**: `postgresql://USER:PASSWORD@HOST.neon.tech/tradexa`
   - **Pooled (PgBouncer)**: `postgresql://USER:PASSWORD@HOST-pooler.neon.tech/tradexa`
3. Add `?sslmode=require` to both. Example:
   ```
   postgresql://USER:PASSWORD@HOST-pooler.neon.tech/tradexa?sslmode=require
   ```

## Which URL goes where

| Purpose                              | URL                       | File                                                        |
| ------------------------------------ | ------------------------- | ----------------------------------------------------------- |
| Prisma CLI (migrate / db push / seed) | Direct / unpooled        | `packages/database/.env`  (`DATABASE_URL`)                  |
| Running API                          | Pooled (PgBouncer)        | `services/api/.env`        (`DATABASE_URL`)                 |
| Running worker                       | Pooled (PgBouncer)        | `services/worker/.env`     (`DATABASE_URL`)                 |
| Running notification service         | Pooled (PgBouncer)        | `services/notification-service/.env` (`DATABASE_URL`)       |

Use the **pooled** URL for anything that serves live traffic (it maintains a
small connection pool and is more cost-efficient with Neon's serverless model).
Use the **direct** URL for one-off CLI operations.

## First run against Neon

```bash
# 1. Put your direct URL in packages/database/.env
# 2. Generate the client and apply the schema + seed:
npm run db:generate
npm run db:migrate --workspace packages/database
npm run db:seed --workspace packages/database

# 3. Put the pooled URL in the service .env files, then run:
npm run dev:worker
npm run dev:api
```

## Verification

- `npm run db:push --workspace packages/database` returns success and shows the
  tables created on Neon.
- `npm run db:studio --workspace packages/database` opens Prisma Studio against
  the Neon database.
- Start the API and hit `GET /api/v1/health`; then register a user via
  `POST /api/v1/auth/register`.

## Notes

- **Secrets:** Never commit the real `DATABASE_URL`. The `.env` files are
  git-ignored; commit only `.env.example`.
- **Branches:** Neon branches are handy for development/staging and for
  testing migrations before production.
- **TLS:** Neon requires TLS; `sslmode=require` is set in every connection
  string.
- **Local alternative:** If you'd rather not use Neon locally, `npm run db:push`
  works against local Postgres too (see `infrastructure/docker-compose.yml`).
