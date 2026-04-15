# Release notes

Human-readable release history; use [`../../releases/`](../../releases/) for version files and [`../../releases/template.md`](../../releases/template.md) for the checklist format.

Execution phases (Cursor plans) should stay aligned with [SPEC_COMPLIANCE_CHECKLIST.md](../SPEC_COMPLIANCE_CHECKLIST.md) §7–§9 for guest and maps scope.

## Phase 2 (guest map + Maps UX)

Shipped scope tracked against the Phase 2 plan:

- **Maps:** `guest_site_detail_mode` on `maps`, editor toolbar control, list/grid on Maps page.
- **Guest:** `PublicGuestMapView` and vanilla embed — filters, coded markers, popup vs sidebar detail, footer counts, compare (multi-select + tray), **Book this site** → `POST /api/quotes` + `book_click` analytics.
- **Embed script:** Resort title in green header; compare panel Escape dismiss and ARIA on expand control.
- **Settings:** Widget section documents where to set guest layout (per map, via editor).

## UI references (guest map)

- **HTML mockup (archived):** [`../ui/parkmap_staging.reference.html`](../ui/parkmap_staging.reference.html) — guest widget modal structure (`widget-modal-bar`, `wmarker`, `wpopup`, `widget-foot`).
- **Screenshot:** project asset `Screenshot_2026-04-10_at_11.52.47_AM-0dcc8cbd-7342-41ca-8ed7-5fe238504fe1.png` (Cursor workspace `assets/`) — green header, filters, coded markers, unit popup, footer.
