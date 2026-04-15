# GeoWaypoint spec compliance checklist (§1–§18)

Cross-check against [GeoWaypoint_Cursor_Build_Spec.docx](../GeoWaypoint_Cursor_Build_Spec.docx). Columns: **UI** (dashboard/embed), **API** (Next routes), **DB** (migrations/RLS), **Edge** (Supabase functions).

Legend: done / partial / missing

| § | Topic | UI | API | DB | Edge | Notes |
|---|--------|----|-----|-----|------|--------|
| 1 | Product / plan matrix | partial | partial | partial | — | `lib/plan.ts` matrix; Stripe products manual |
| 2 | Tech stack & env | done | — | — | — | `.env.example` |
| 3 | Design system | done | — | — | — | tokens, `.btn`, `.rf-input` |
| 4 | Schema & RLS | done | — | done | — | core tables + `embed_events`; loyalty cols migration |
| 5 | Auth & onboarding | partial | partial | — | — | email verify = Supabase default; trial webhook = partial |
| 6 | App shell | partial | — | — | — | Help nav, profile→Settings link, logout confirm |
| 7 | Maps CRUD | done | — | — | — | modals inline; list/grid + max-width layout |
| 8 | Editor | partial | — | — | — | guest_site_detail_mode toolbar; search/bulk/place/zoom/chips = partial–done |
| 9 | Guest widget | done | partial | — | — | Phase 2: popup/sidebar, compare tray, book→quotes + events; embed header title; preview sheet |
| 10 | Analytics | partial | partial | done | — | collapsible filters, presets dropdown, DayPicker range, localStorage persist, `session_id`/`client_seq`, sessions UI |
| 11 | Embed & API admin | partial | partial | — | — | `/embed/...` route, 402, webhook in settings |
| 12 | Settings 7 panels | partial | partial | partial | — | max-width layout; profile embedded `#sp-user-profile` |
| 13 | Profile | partial | partial | — | partial | same forms under Settings; `/profile` banner to Settings |
| 14 | Loyalty | partial | partial | partial | — | `loyalty_tier`, `referred_by`; `/join?ref=` → signup; automation stub |
| 15 | OwnerRez | partial | partial | done | partial | Settings OAuth scope notes + modal reminder |
| 16 | Plan gating | partial | partial | — | — | `UpgradeGateModal`, `gatedServerJson` |
| 17 | Notifications | partial | partial | partial | — | `notifications` table + bell |
| 18 | Deployment | partial | partial | — | — | `/api/health`, `/terms`, `/privacy` |

_Update this table as features ship._
