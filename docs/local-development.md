# Local development

## Prerequisites

- Node.js 22+ (`node --version`)
- npm (`npm --version`)
- Docker Desktop running (`docker --version`, `docker compose version`)

## First-time setup

Run from the repository root:

```powershell
# 1. Copy environment template (never commit .env)
Copy-Item .env.example .env

# 2. Install all workspace dependencies
npm run setup

# 3. Start PostgreSQL and Redis
npm run infra:up

# 4. Confirm both services are healthy
npm run infra:ps
```

Expected: `postgres` and `redis` both show status `running (healthy)`.

## Verify the databases

```powershell
# PostgreSQL
docker compose exec postgres pg_isready -U onelink -d onelink

# Redis
docker compose exec redis redis-cli ping
```

Expected: `/var/run/postgresql:5432 - accepting connections` and `PONG`.

## Daily commands

```powershell
npm run infra:up     # start databases
npm run infra:down   # stop databases (data is kept in Docker volumes)
npm run infra:ps     # check service status
```

## Troubleshooting

- **Docker not running:** open Docker Desktop and wait for the whale icon to steady.
- **Port already in use (5432/6379):** stop any other local PostgreSQL/Redis, or change the ports in `docker-compose.yml`.
- **npm blocked by execution policy:** `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.
- **Fresh database:** `docker compose down -v` deletes the volumes and all local data. Use with care.

## What runs where

| Service   | Local address       | Purpose                              |
|-----------|---------------------|--------------------------------------|
| Postgres  | localhost:5432      | Users, brands, content, schedules, analytics |
| Redis     | localhost:6379      | Queues, cache, rate limits, auth sessions |
| Web app   | localhost:5173      | Frontend (Phase 2)                   |
| API       | localhost:3000      | Backend API (Phase 3)                |
