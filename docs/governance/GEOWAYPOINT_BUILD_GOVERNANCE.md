# Final governance rules for GeoWaypoint build

This document is the **final governing instruction layer** for the project. It is **persistent**. The build plan tracks sequencing and tasks; **this file** defines how implementation must behave. Do not duplicate governance by repeatedly editing the plan unless a **real requirement** changes.

## Authority order

1. **GeoWaypoint spec** is the single source of truth for product behavior, schema, UI, flows, integrations, and deployment requirements.
2. **PROJECT_BOOTSTRAP** governs repository structure, organization, implementation discipline, and process.
3. The **current build plan** governs execution sequencing and task tracking.
4. If any conflict exists:

   - **spec** wins over **bootstrap**
   - **bootstrap** wins over **local implementation preference**
   - **do not infer** intent

## Execution model

- Build strictly in phases
- Do not skip phases
- Do not overlap phases unless explicitly required
- Do not partially implement later sections early
- Complete current phase before moving forward

## Hard stop rule

If any of the following occurs:

- ambiguous requirement
- conflicting instructions
- undefined behavior
- missing API/schema detail
- uncertainty about naming, structure, or intended flow

Then:

- **STOP**
- surface the ambiguity clearly
- **do not** guess
- **do not** fill gaps with assumptions
- **do not** redesign around the ambiguity

## Repository rules

- Monorepo structure must remain intact
- No unapproved top-level folders
- No feature code in root
- Deployable apps only in `/apps`
- Shared logic only in `/packages`
- Documentation only in `/docs`
- Infrastructure only in `/infra`
- Environment templates and environment guidance only in `/environments`

## Cross-app boundary rules

- No cross-app imports between `apps/web`, `apps/api`, and `apps/embed`
- Shared logic must only be accessed through `/packages`
- If code is only used by one app, keep it in that app
- Move code into `/packages` only after reuse in 2 or more apps is real

## Naming rules

- Use spec terminology exactly
- No aliases
- No alternate naming
- No internal synonyms
- Applies to:

  - database
  - API
  - UI
  - analytics
  - integrations
  - docs

## API contract rules

- Request and response shapes must match the spec exactly
- No renamed keys
- No silent transformations
- No extra fields unless explicitly required by the current section being implemented
- If the spec does not define the shape clearly enough, stop and escalate

## Database rules

- Implement only schema required by the current spec section
- For initial schema phase, implement only Section 4 tables explicitly defined there
- Do not add inferred tables early
- Do not add inferred columns early
- RLS must be enabled immediately after each table creation
- No table may exist without policy coverage
- No temporary bypasses
- Migrations must be timestamp-prefixed
- Migrations are immutable once committed
- No editing old migrations
- Later schema changes must be additive unless an ADR explicitly authorizes otherwise

## ADR rules

Use an ADR before implementation when deciding:

- repo-level structural deviations
- Edge Function canonical location
- state management strategy not explicitly defined by the spec
- schema additions not directly defined in the current section
- any meaningful architectural choice the spec does not settle

If it is not documented in an ADR when required, it is not approved.

## UI and design rules

- Design tokens must match the spec
- No hardcoded colors where tokens are defined
- Fraunces for headings only
- Sora for UI/body text only
- Do not invent new component patterns
- Do not restyle defined interfaces
- Do not simplify layout behavior unless explicitly approved

## Embed rules

- Embed must stay framework-free
- No React in embed
- No external UI libraries in embed
- Output must be a single minimized JS bundle
- Keep embed isolated from admin UI code
- No dependency on `apps/web` internals
- Target performance budget must remain aligned with the spec
- Avoid unnecessary dependencies and runtime overhead

## Implementation discipline

- Do not redesign
- Do not optimize beyond the spec without approval
- Do not abstract prematurely
- Do not create generic systems before they are needed
- Build only what the current phase requires
- Keep state explicit
- No hidden globals
- No hidden side effects
- No silent failures

## Logging and error rules

- Initialize baseline logging structure
- Initialize Sentry where required
- Do not over-configure observability early
- Errors must be surfaced clearly
- Do not swallow failures

## Documentation rules

- Each implemented major section must have matching docs
- Structural decisions require ADRs
- Release-impacting changes require release notes
- Do not allow undocumented behavior to accumulate

## CI/CD rules

- Create CI structure early
- Placeholder workflows are allowed in the bootstrap phase
- Do not fully expand pipelines before implementation phases require them

## Completion discipline

Do not mark a phase complete unless its completion criteria are actually met.

**Phase A completion requires:**

- repo structure exists
- placeholder docs exist
- ADR-0001 exists
- environment templates exist

**Phase B completion requires:**

- Next.js app runs locally
- fonts and tokens are applied
- Supabase connection strategy is established
- migrations are created and runnable
- no feature UI has been implemented

## Final operating rule

Cursor is implementing a predefined system, not inventing one.

When in doubt:

- stop
- document
- clarify
- then continue
