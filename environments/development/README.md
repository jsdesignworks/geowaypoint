# Development environment

## Master login (local Supabase)

After `supabase db reset`, seed creates:

- **Email:** `admin@designworks.app`
- **Password:** `1234`

The web app login form pre-fills these in `next dev` only. For a hosted Supabase project, add the same user under **Authentication** (or run the statements in `supabase/seed.sql` with care).

---

Variable **names** only (values in local `.env.local`, never committed):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- Stripe, Resend, OwnerRez, Sentry keys as in `apps/web/.env.example`
