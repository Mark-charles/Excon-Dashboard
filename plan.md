# Exercise Control Dashboard — Roadmap & Plan

## Context & Objectives
- Plan and run incident exercises using injects (MSEL), timing, resources, and post‑exercise review.
- Goals: reliable live control, clear operator UX, fast bulk data entry, solid reporting (print/export).

## Phase 0 — Stabilize MVP (Completed)
- [x] Local persistence (injects, resources, timer)
- [x] Encoding cleanup in docs/UI
- [x] Layout alignment (header + timer)
- [x] Import UX: invalid‑row highlighting, clearer errors, preview
- [x] Baseline accessibility: ARIA for icon buttons, table labels, focus rings

## Phase 1 — Core Exercise Features (Completed)
- Pop‑outs & Alerts
  - [x] Pop‑out displays (Timer, Resources) with live sync
  - [x] Audio alerts: 1 beep when due, 2 beeps when missed; global mute
  - [x] Dashboard toast when Admin/scenario updates land
- Scenarios & Admin
  - [x] Scenario templates: save/load JSON (Admin)
  - [x] Administration page: exercise details, printable summary launcher, reset‑all with guard
  - [x] Scenario load: Append vs Replace toggle; explicit Save button
- Exports & Summary
  - [x] Import‑ready CSV exports (Injects/Resources). Reporting handled in printable summary
  - [x] Printable summary: HH:MM:SS + seconds and a compact timeline snippet (logo + legend)
- Injects & Resources
  - [x] Inject controls: Ack/Unack, Snooze (+5m/+10m/custom), optional audio with auto‑play at due time
  - [x] Resources: auto‑advance toggle (requested → tasked → enroute; enroute → arrived at ETA)
  - [x] Resource ETA inline edit: accepts HH:MM:SS (absolute) or minutes (relative)
- Roles & Locks
  - [x] Roles (admin/operator/viewer) and edit lock. Admin bypasses lock; operator respects it; viewer is read‑only

## Post‑Ship QA & Tests
- QA
  - [ ] Multi‑window sync and timing under fast updates
  - [ ] Audio auto‑play restrictions and fallback beeps
  - [ ] Keyboard navigation (tab/shift‑tab), visible focus, ARIA labels
  - [ ] Contrast and disabled states for all action buttons
- Tests (suggested minimal set)
  - [ ] Time parsers: HH:MM:SS and minutes for injects/resources
  - [ ] Snooze math and re‑arming alerts
  - [ ] Resource auto‑advance transitions

## Phase 2 — Collaboration & Control
- [ ] Real‑time multi‑operator sync (WebSocket/SSE) with presence
- [ ] Notifications: desktop/audio when inject due or resource arrives
- [ ] Time controls: pause windows, offsets, countdown to start
- [ ] Audit trail: immutable event log for AAR

## Phase 3 — Evaluations & AAR
- [ ] Evaluation forms per inject; observations, expected outcomes, notes
- [ ] Tagging: objectives, capabilities, agencies; filterable reports
- [ ] AAR/IP generator: export structured report (PDF/Docx) with timelines and findings

## Phase 4 — Mapping & Ops Enhancements
- [ ] Map injects: basic map view for location‑tagged injects
- [ ] Checklists: ICS/agency checklists; completion tracking
- [ ] Offline‑first: PWA install, background sync

## Notes for Tomorrow
- If you want tests: bootstrap Vitest + RTL and add unit tests for time parsers, Snooze math, and auto-advance.
- Do a focused a11y pass on new controls (Snooze modal buttons, Ack, imports) and verify keyboard flows.
- Decide the Phase 2 kick-off: start with multi-operator sync (ws route + presence) or notifications first.
- Investigate Injects import template: the downloaded CSV cannot be re-imported (shows "Error reading file. Please ensure it is a valid CSV or Excel file."). Reproduce and fix parser/CSV read path.
