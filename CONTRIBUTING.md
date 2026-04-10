# Contributing

1. Follow [`docs/governance/GEOWAYPOINT_BUILD_GOVERNANCE.md`](docs/governance/GEOWAYPOINT_BUILD_GOVERNANCE.md) and the active build plan.
2. Do not skip phases; complete Phase A/B criteria before claiming completion.
3. Spec terminology only — no aliases for resorts, maps, sites, OwnerRez, embed, webhooks, analytics.
4. No cross-imports between `apps/web`, `apps/api`, and `apps/embed`; share via `packages/` only when two or more apps need the same code.
5. Database changes: new timestamp-prefixed migration only; never edit committed migrations. RLS on every table.
6. Ambiguity or undefined behavior: stop, open an ADR or ask for clarification — do not guess.

Pull requests should note scope, migrations, env vars, and QA steps per `releases/template.md`.
