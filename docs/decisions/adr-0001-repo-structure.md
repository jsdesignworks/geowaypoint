# ADR-0001: Monorepo layout and Supabase Edge Function paths

## Status

Accepted

## Context

- The GeoWaypoint spec §2 shows a flat `create-next-app geowaypoint` layout; PROJECT_BOOTSTRAP requires `apps/web`, `apps/api`, `apps/embed`, and `packages/*`.
- Supabase CLI expects a `supabase/` directory at the project root with `config.toml` and `migrations` under `supabase/migrations`.
- Bootstrap lists `infra/supabase/migrations`; we need one canonical migration path compatible with `supabase db` commands.

## Decision

1. **Next.js** lives in `apps/web` with package name `@geowaypoint/web` (not at repository root).
2. **Canonical Supabase project root** is the monorepo root (`geowaypoint/`): run `supabase init`, `supabase link`, `supabase db push`, and `supabase functions deploy` from `geowaypoint/`.
3. **Migrations** are stored in `supabase/migrations/` (CLI requirement). `infra/supabase/migrations` is a **symbolic link** to `../../supabase/migrations` so bootstrap folder layout and CLI stay aligned without duplicating files.
4. **Edge Functions**: **source of truth** for function folders is `supabase/functions/*` (names TBD per spec: `ownerrez-oauth`, `ownerrez-webhooks`, `stripe-webhooks`, `analytics-events`). The tree under `apps/api/functions/` is a **documentation mirror** describing intended function names and ownership; implement and deploy from `supabase/functions` after linking. Optionally sync with a script later; until then, authors edit `supabase/functions` for deploy.
5. **Embed** builds from `apps/embed` to a single `embed.min.js` with no dependency on `apps/web`.

## Consequences

- Developers must `cd geowaypoint` before Supabase CLI commands.
- CI should set working directory to the monorepo root.
- If Windows contributors cannot use symlinks, replace the symlink with a short note in `infra/supabase/README.md` and keep a single `supabase/migrations` path only (document the bootstrap deviation in a follow-up ADR).
