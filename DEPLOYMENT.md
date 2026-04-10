# GeoWaypoint — deployment checklist (spec §18)

Use this when moving from local development to production. Adjust hostnames to your accounts.

## Vercel (`apps/web`)

- Create a Vercel project from the monorepo root with **root directory** `geowaypoint/apps/web` (or deploy the workspace package per your CI).
- Set environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Resend/Sentry keys as required by your build.
- Confirm production **Supabase Auth** redirect URLs include `https://<app>/auth/callback`.

## Cloudflare Pages (embed CDN)

- Build `apps/embed` (`npm run build --workspace=@geowaypoint/embed`) and upload `dist/embed.min.js` to your CDN bucket.
- Purge cache after releases. Snippet on **Embed & API** should point at this URL; `data-api-base` must be the Vercel app origin if the script is cross-origin.

## Supabase (production)

- Run all migrations under `geowaypoint/supabase/migrations` against the production project.
- Enable **Row Level Security** policies (already defined in migrations).
- Create Storage bucket **`maps`** if not created by migration (migration `20260410130000_storage_maps.sql` should define it).
- Configure **Auth** providers (email, Google) and **Site URL** / redirect URLs.

## Stripe

- Switch to **live** keys and webhook endpoint for production; map events to resort/plan updates per your billing actions.

## Resend, Sentry, Better Uptime

- Verify sending domain in Resend; release health checks in Better Uptime for `/` and `/api/embed/...` smoke tests as needed.
- Sentry DSN for Next.js is already wired via `@sentry/nextjs` if env vars are set.

## OwnerRez

- Register OAuth app URLs pointing at your Edge Function / callback routes when §15 integration is deployed.

## Legal & QA

- Host privacy policy and terms on public routes or your marketing site; link from signup.
- Run a short QA matrix: sign up → onboarding → map CRUD → editor → publish → embed snippet on a static HTML page → events in Analytics CSV.
