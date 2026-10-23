# Deployment (development/staging)

Target layout:

- **Netlify** → frontend (`apps/web` static build). Free tier friendly.
- **Render** → API (`apps/api`) + managed PostgreSQL.
- **Upstash** → managed Redis (free tier), used by the API queue client and the worker.
- **Worker** (`apps/worker`) → needs an always-on service: Render paid instance,
  Railway, a small VPS, or any host that runs `npm start --workspace @one-link/worker`.

Netlify cannot host the API, worker, Postgres, or Redis — it serves static
sites and short-lived functions only. That is why the app is split this way.

## Auto-deploy (recommended: connect once, ship forever)

Both Netlify and Render deploy **automatically on every push to `main`**:

1. You `git push` → GitHub notifies both services.
2. Each rebuilds from the repo and goes live in 1–3 minutes. No manual steps.
3. Every pull request also gets its own **preview URL** (Netlify) — send these
   to testers to try features before they reach the main site.
4. If a deploy breaks something, roll back in one click from either dashboard
   (Netlify: Deploys → Publish deploy; Render: manual deploy of an older commit).

Safety net: `.github/workflows/ci.yml` typechecks and builds **all**
workspaces on every push and pull request (`npm run build:all`). A red check
means "do not deploy this" — fix first, then push again.

## 1. Deploy the frontend to Netlify

1. Push the repo to GitHub (commit the new `netlify.toml` first).
2. Netlify → Add new site → Import from GitHub → select `makarcy22/one-link`.
3. Build settings are read from `netlify.toml` automatically.
4. Before deploying, set this environment variable in Netlify
   (Site settings → Environment variables):
   - `VITE_API_URL` = your API URL (from step 2, e.g. `https://one-link-api.onrender.com`)
5. Deploy. Your app appears at something like `https://one-link.netlify.app`.

## 2. Deploy the API + database to Render

1. Render → New → Blueprint → select the repo (uses `render.yaml`).
2. Confirm the plan creates `one-link-api` and `one-link-db`.
3. Create a free Upstash Redis database, copy its `rediss://` URL,
   and set it as the API service's `REDIS_URL`.
4. After the first deploy, note the real API URL and update these to match it:
   - API service `BETTER_AUTH_URL`
   - API service `CLIENT_ORIGIN` (your Netlify URL)
   - Google/Meta/LinkedIn/TikTok OAuth redirect URIs and origins in each provider console
5. Apply database tables to the Render Postgres (connect string from Render dashboard):
   - Better Auth: run `npx auth@latest migrate` against it, or apply the generated SQL.
   - App tables: apply every numbered file in `apps/api/migrations/` in order (`001` to `006`).
     `verify_2fa.sql` is a check script, not a migration.
6. Redeploy the API so the corrected URLs take effect.

## 3. Run the worker

Pick one:

- **Same host as API** if it supports background workers (paid tier on Render).
- **Railway** — good beginner option for API + worker + Postgres + Redis together.
- **Small VPS** — cheapest long-term: install Node, clone the repo, run the worker with a process manager.

The worker needs the same `DATABASE_URL`, `REDIS_URL`, and `SOCIAL_TOKEN_KEY` as the API.

## 4. Verify production

- `https://<api>/api/health` shows `{"ok":true,"database":true}`.
- Frontend signup/login works against the deployed API.
- Profile brand save works.
- Publish-now creates jobs; worker marks them completed.

## Costs

All three hosts have free tiers or trial credits, but limits change often —
check each provider's current pricing page before relying on free hosting.
Production rule from the monetization plan still applies: billing and usage
quotas go live before real user growth, so hosting costs stay covered.
