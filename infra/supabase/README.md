# infra/supabase

Supabase migrations and policies; **RLS** is required on all tables.

- **Migrations (canonical files):** `../../supabase/migrations` (Supabase CLI). This folder’s `migrations` entry is a **symlink** to that path — see [`docs/decisions/adr-0001-repo-structure.md`](../../docs/decisions/adr-0001-repo-structure.md).
- **`policies/`:** optional notes or exported policy references; executable SQL lives in timestamped migrations only.
