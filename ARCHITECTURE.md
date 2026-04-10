# Architecture overview

High-level map of the monorepo. Detail lives in `docs/architecture/` as features are implemented.

```mermaid
flowchart TB
  subgraph apps [apps]
    web[web_Nextjs]
    embed[embed_vanilla_JS]
    apiDoc[api_edge_fn_layout]
  end
  subgraph packages [packages]
    types[types]
    config[config]
    utils[utils]
    integrations[integrations]
  end
  subgraph infra [infra]
    sb[supabase_migrations]
  end
  web --> types
  web --> config
  embed --> types
  supabase[(Supabase_DB_Auth_Storage)]
  web --> supabase
  embed -->|"public_API"| supabase
  apiDoc -.->|"deployed_via_CLI"| supabase
```

- **Tenant isolation:** Postgres RLS on all tables (spec §4).
- **OwnerRez:** OAuth and webhooks via Edge Functions (server-side; no PKCE per spec).
- **Embed:** Single minimized bundle, no React, isolated from `apps/web`.

See [`docs/decisions/adr-0001-repo-structure.md`](docs/decisions/adr-0001-repo-structure.md) for repo layout and Edge Function paths.
