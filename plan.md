# Exercise Control Dashboard — Roadmap & Plan

## Context & Objectives
- Based on Resources (managing exercises docs), the app supports planning and running emergency/incident exercises using injects (MSEL), timing, resource tasking, and post-exercise learning.
- Goals: reliable live control, clear operator UX, fast bulk data entry, exportable records for After Action Review (AAR) and Improvement Plan (IP).

## Roadmap (Phased)
### Phase 0 — Stabilize Current MVP
- [ ] Fix encoding artifacts (icons/emojis) in `app/dashboard/page.tsx` action buttons.
- [ ] Persist state locally (injects, resources, timer) via browser storage.
- [ ] Improve import validation messages and highlight offending rows.
- [ ] Accessibility pass: focus states, ARIA labels, color contrast.

### Phase 1 — Core Exercise Features
- [ ] Scenario templates: save/load MSEL sets (CSV/XLSX + JSON format).
- [ ] Status automation: auto-advance resource states with confirmations; snooze/ack for injects.
- [ ] Operator roles and locks: prevent conflicting edits in multi-user mode.
- [ ] Export: CSV of injects/resources and a printable PDF summary (timeline, actions).

### Phase 2 — Collaboration & Control
- [ ] Real-time sync: WebSocket/SSE for multi-operator rooms; presence indicators.
- [ ] Notifications: desktop/audio alerts when inject due or resource arrives.
- [ ] Time controls: pause windows, time offsets, negative countdown to start.
- [ ] Audit trail: immutable event log (who/what/when) for AAR.

### Phase 3 — Evaluations & AAR
- [ ] Evaluation forms: capture observations, expected outcomes, performance notes per inject.
- [ ] Tagging: objectives, capabilities, agencies; filterable reports.
- [ ] AAR/IP generator: export structured report (PDF/Docx) with timelines and findings.

### Phase 4 — Mapping & Ops Enhancements
- [ ] Map injects: basic map view for location-tagged injects (Leaflet/MapLibre).
- [ ] Checklists: ICS/agency checklists; completion tracking.
- [ ] Offline-first: PWA install, background sync on reconnect.

## Implementation Plan
- Data model: `Inject`, `Resource`, `Event` with IDs and timestamps.
- Storage: start with IndexedDB (Dexie) or Next.js server actions + SQLite for multi-user.
- Testing: add Vitest + RTL for timer logic, import parsers, and inline edit flows.
- CI: lint + typecheck on PR; basic e2e later (Playwright).

## Tech Review — Is Node.js/Next.js Right?
- Fit: Excellent for a browser-based, operator UI with imports, timers, and live updates. Next 15 + React 19 is appropriate.
- Multi-user: Add a lightweight Node API (Next Route Handlers) + WebSocket (e.g., `ws`) or Supabase/Firebase if managed OK.
- Offline/air-gapped: For strictly offline ops, consider packaging as desktop (Tauri/Electron) or a local-only Next server.
- Alternatives: Go/.NET backends add type-safe concurrency and reporting performance but are optional; keep Node unless requirements shift.

