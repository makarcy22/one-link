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

## Plan B: no Docker (native Windows install)

Use this when BIOS virtualization cannot be enabled. Install PostgreSQL 16 and Memurai Developer (Redis-compatible server) directly on Windows:

```powershell
winget install -e --id PostgreSQL.PostgreSQL.16 --source winget
winget install -e --id Memurai.MemuraiDeveloper --source winget
```

The PostgreSQL installer asks for a superuser (`postgres`) password — choose one and store it safely; it is dev-only. Keep port `5432`.

Create the app role and database (replace the path if you installed a different major version):

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE ROLE onelink WITH LOGIN PASSWORD 'onelink' CREATEDB;"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE onelink OWNER onelink;"
```

Verify both services:

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U onelink -d onelink -c "SELECT 1;"
memurai-cli ping
```

Expected: a `SELECT 1` result row and `PONG`. The `.env` connection strings stay identical to Plan A (`localhost:5432`, `localhost:6379`).

## What runs where

| Service   | Local address       | Purpose                              |
|-----------|---------------------|--------------------------------------|
| Postgres  | localhost:5432      | Users, brands, content, schedules, analytics |
| Redis     | localhost:6379      | Queues, cache, rate limits, auth sessions |
| Web app   | localhost:5173      | Frontend (Phase 2)                   |
| API       | localhost:3000      | Backend API (Phase 3)                |
