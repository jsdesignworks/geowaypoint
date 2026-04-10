# Environment variables

Canonical list matches **spec §2** and `apps/web/.env.example`.

| Name | Scope | Purpose |
|------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | client | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Bypass RLS for trusted server jobs |
| `NEXT_PUBLIC_APP_URL` | client | Absolute app URL for links and OAuth |
| `STRIPE_SECRET_KEY` | server | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | server | Stripe webhook signing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | client | Stripe.js |
| `RESEND_API_KEY` | server | Transactional email |
| `FROM_EMAIL` | server | Sender address |
| `OWNERREZ_*` | server | OAuth + webhook basic auth per spec |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` | client/server | Error reporting |

Edge Function secrets are set with Supabase CLI (`supabase secrets set`), not checked into git.
