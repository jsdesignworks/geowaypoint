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
- **Map Editor shows 404 inside the shell:** the route is `/editor/<map-uuid>`. If the URL is `/editor` alone, the app redirects to `/maps`. If the URL includes a UUID and you still see 404, the server query on `public.maps` failed or returned no row—often **missing column** `guest_site_detail_mode` (run migration `20260411120000_maps_guest_site_detail_mode.sql`) or **Vercel env** pointing at a different Supabase project than the one that holds your maps. Verify in SQL (same project as `NEXT_PUBLIC_SUPABASE_URL`):

  ```sql
  select column_name from information_schema.columns
  where table_schema = 'public' and table_name = 'maps' and column_name = 'guest_site_detail_mode';
  ```

- Enable **Row Level Security** policies (already defined in migrations).
- Create Storage bucket **`maps`** if not created by migration (migration `20260410130000_storage_maps.sql` should define it).
- Configure **Auth** providers (email, Google) and **Site URL** / redirect URLs.

## Stripe

- Switch to **live** keys and webhook endpoint for production; map events to resort/plan updates per your billing actions.
- Create catalog products per spec §18: Starter ($0), Growth ($59/mo), Pro ($99/mo), Resort ($149/mo), Enterprise ($249/mo).

## Resend, Sentry, Better Uptime

- Verify sending domain in Resend; point Better Uptime (or similar) at **`GET /api/health`**, **`GET /embed/[slug]/[mapId]`** (or `/api/embed/...`), and the marketing `/` route.
- Sentry DSN for Next.js is already wired via `@sentry/nextjs` if env vars are set.

## OwnerRez

- Register OAuth app URLs pointing at your Edge Function / callback routes when §15 integration is deployed.

## Legal & QA

- Replace placeholder copy on in-app **`/terms`** and **`/privacy`** with counsel-approved pages; signup links to Terms.
- Run a short QA matrix: sign up → onboarding → map CRUD → editor → publish → embed snippet on a static HTML page → events in Analytics CSV.
