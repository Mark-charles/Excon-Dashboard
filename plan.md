# EXCON Dashboard Delivery Plan

_Last updated: 13 Sep 2025_

## Snapshot

**Recently Completed**
- [x] Component refactor and strict TypeScript adoption across the dashboard.
- [x] Session persistence (auto localStorage save + manual JSON import/export).
- [x] Dashboard Admin panel with log export, PDF report, and reset actions.
- [x] Activity logging wired into inject/resource/session actions and PDF output.
- [x] Inline SVG/ASCII icon system for inject/resource visual cues.

**In Flight / Needs Attention**
- [ ] Replace placeholder glyphs and clean import validation messaging.
- [ ] Tablet/mobile responsive audit and accessibility sweep.
- [ ] Automated testing scaffold (Jest + React Testing Library) with initial coverage.
- [ ] Durable logging/persistence story beyond browser storage.

**Next Candidate Tasks**
1. Harden import flows (clear errors/warnings, better duplicate surfacing).
2. Finalise responsive layouts and keyboard shortcuts essential for controllers.
3. Stand up the test harness and cover utilities (`timeUtils`, `validation`, `importExportUtils`).
4. Scope central logging/export options (downloadable files, offline cache, agency sync path).

---

## Phase 2 – Core System Reliability

### Objective A: Exercise Persistence & Templates
- [x] Auto-save exercise snapshot to `localStorage` with restore banner.
- [x] Manual JSON export/import for exercises (portable snapshot).
- [ ] Exercise template library for quick start scenarios.
- [ ] Version metadata on exports (schema version, timestamp, operator).

### Objective B: Logging & Auditability
- [x] Centralised client logger capturing error/task events.
- [x] Export combined log text file from the UI.
- [ ] Write logs to durable storage (download, filesystem, or server endpoint).
- [ ] Structured activity view inside the app (sortable/filterable history).
- [ ] Operator notes/annotations tied to injects and resources.

### Objective C: Field Readiness (UX & Accessibility)
- [ ] Responsive layout tuned for 12" tablets in landscape/portrait.
- [ ] Keyboard shortcuts for timer control and quick status updates.
- [ ] High-contrast + motion-reduced theme switches for field conditions.
- [ ] Offline/restore banner UX polish with clear messaging.

### Objective D: Quality Foundation
- [ ] Jest + React Testing Library setup; add CI lint/test scripts.
- [ ] Unit coverage for time parsing/formatting, validation, import/export flows.
- [ ] Component smoke tests for InjectList, ResourceRequestBoard, and Timeline.
- [ ] Performance profiling against 500+ inject / 200+ resource datasets.
- [ ] Error boundaries around modals/import flows with operator-friendly messaging.

---

## Phase 3 – Production Hardening
- [ ] Tablet-first operator mode (simplified controls, large hit targets).
- [ ] Multi-session management (open/save multiple exercises, templates gallery).
- [ ] Observer/evaluator workflow exports (CSV/PDF tailored views).
- [ ] Browser compatibility matrix + load testing sign-off.
- [ ] Deployment pipeline + release checklist (branching, tagging, documentation).

---

## Backlog & Future Considerations
- Participant roster management with role assignments.
- Exercise objectives tracking and evaluation scoring.
- Message log / communications board integrated with inject timeline.
- Hot wash + lessons learned capture tied to post-exercise reporting.
- Scenario/resource libraries for rapid exercise build-out.
- Calendar of exercises with shared agency access.

---

## Tracking & Artefacts
- `task.log` – append entries as work lands.
- `error.log` – record defects and follow-up items until automated pipelines exist.
- `support docs/` – maintain reference materials used for alignment and imports.

_Review and update this plan at the start/end of each working session to keep Phase 2 moving._
