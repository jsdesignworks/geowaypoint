# Security

- **Secrets:** Never commit `.env` files. Use `apps/*/.env.example` and `environments/*` for names only.
- **Service role:** `SUPABASE_SERVICE_ROLE_KEY` is server-side only; never expose to the client or embed.
- **RLS:** All tables require Row Level Security and policies before use in production.
- **Webhooks:** OwnerRez and Stripe endpoints must verify signatures or auth per spec.
- **Dependencies:** Keep embed minimal; audit regularly.

Report security issues through the channel defined by the project owner (to be documented when the org is public).
