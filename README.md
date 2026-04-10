# GeoWaypoint

Monorepo for GeoWaypoint (resorts, maps, sites, OwnerRez embed, webhooks, analytics).

## Authority

- Product: `GeoWaypoint_Cursor_Build_Spec.docx` (single source of truth for behavior).
- Structure and process: PROJECT_BOOTSTRAP.
- Execution order: Cursor build plan (do not edit the plan file for governance churn).
- Persistent rules: [`docs/governance/GEOWAYPOINT_BUILD_GOVERNANCE.md`](docs/governance/GEOWAYPOINT_BUILD_GOVERNANCE.md).

## Layout

- `apps/web` — Next.js admin and dashboard.
- `apps/api` — Edge function layout documentation; deployed functions live under `supabase/functions` (see ADR-0001).
- `apps/embed` — Framework-free `embed.min.js` bundle.
- `packages/*` — Shared code only when used by two or more apps.
- `infra/supabase/migrations` — Timestamp-prefixed SQL migrations.
- `docs/` — All documentation.

## Prerequisites

- Node.js 18.18+
- npm (workspaces)
- Supabase CLI (for local DB and functions)

## Quick start

```bash
npm install
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

## Scripts

| Script        | Description                |
| ------------- | -------------------------- |
| `npm run dev` | Start Next.js (`apps/web`) |
| `npm run build` | Production build web   |
| `npm run embed:build` | Build embed bundle |
| `npm run lint` | Lint all workspaces      |
| `npm run typecheck` | Typecheck workspaces |

## Spec location

Place `GeoWaypoint_Cursor_Build_Spec.docx` next to this repo or document its path in `docs/architecture/`.
