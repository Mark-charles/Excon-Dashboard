# EXCON Dashboard

The EXCON Dashboard is a Next.js/React application used by exercise controllers to run emergency management training events. It delivers a single-screen operations view that keeps the timer, master schedule of events (MSE), resource requests, and activity reporting in sync.

## Current Capabilities
- Exercise timer with start/stop/reset, manual time overrides, and automatic persistence.
- Master Schedule management with inline editing, status toggles, drag-free reordering via due times, and CSV/XLSX/DOCX import support.
- Resource request board with status workflows (requested -> tasked -> enroute -> arrived/cancelled), inline ETA edits, and CSV/XLSX import.
- Interactive combined timeline for injects and resources, including per-type/status filters and responsive sizing.
- Session persistence backed by `localStorage`, plus manual JSON export/import, consolidated PDF reporting, and log export from the Dashboard Admin panel.
- Activity logging for inject/resource/session events that feeds JSON exports, PDF reports, and future audit features.

## Architecture & Technology
- React 19.1 with the Next.js 15 App Router and strict TypeScript across the codebase.
- Tailwind CSS 4 for theming; key variants live in `app/globals.css` and `tailwind.config.js`.
- Component breakdown lives under `app/components/`:
  - `exercise/` - header and overview cards
  - `dashboard/` - timer, request board, inject list widgets
  - `forms/` - add/inject and add/resource forms
  - `modals/` - import flows for injects and resources
  - `timeline/` - combined exercise timeline and filters
  - `shared/` - common types and global initialisation
- Utility modules in `app/utils/` handle validation, import/export (XLSX + Mammoth DOCX parsing), style tokens, icons, logging, and time helpers.

## Local Development
### Prerequisites
- Node.js 18+

### Install & Run
```bash
npm install
npm run dev
```
Visit `http://localhost:3000/dashboard` for the dashboard view.

### Production Build
```bash
npm run build
npm start
```

### Quality Checks
```bash
npm run lint
```
No automated tests exist yet; see the plan for proposed coverage.

## Data, Persistence, and Import/Export
- Injects: accepts CSV/XLSX (first worksheet) or DOCX tables. Columns are fuzzy-matched and validated before import.
- Resources: accepts CSV/XLSX; ETA minutes convert to exercise-relative seconds.
- Append imports deduplicate on the tuple `(title, dueSeconds)` for injects and `(label, etaSeconds)` for resources.
- Sessions persist automatically to `localStorage` (`excon_session`) and surface a restore banner on load.
- Manual export/import is available via the Dashboard Admin controls (`excon-exercise.json`).

## Logging & Reporting
- Client-side logging (`app/utils/loggingUtils.ts`) stores error/task entries in `localStorage` and exposes download via "Export Logs".
- `handleExportReport` compiles injects, resources, logs, and the activity timeline into `excon-report.pdf` using jsPDF.
- `error.log` and `task.log` files in the repo capture manually curated notes; app output stays in the browser today.

## Environment Variables
- `NEXT_PUBLIC_ICON_MODE`: `svg` (default) renders inline SVG glyphs, `ascii` swaps to simple text markers. See `app/utils/iconConfig.ts`.

## Documentation Set
- `projectbackground.md` - strategic background, users, and standards alignment.
- `plan.md` - delivery roadmap with current priorities.
- `task.log` / `error.log` - manual tracking of completed work and outstanding issues.
- `support docs/` - AIDR-aligned reference material used for scenario design.

## Project Status - 13 Sep 2025
- Phase 1 refactor complete: monolith replaced with modular components, strict typing, shared utilities, and memoisation improvements.
- Recently delivered: dashboard admin panel with JSON/log/PDF export, activity tracking, import modal refresh, icon helper system, and responsive timeline polish.
- Remaining immediate focus: mobile/tablet layout audit, hardening import validation (clean warnings + better UX), structured automated test harness, and a real persistence/logging backend.

## Known Issues & Gaps
- Dashboard Admin logging still writes to browser storage only; teams need durable export/storage for audits.
- No automated regression tests. Utilities (timeUtils, validation, importExportUtils) and core components lack coverage.
- Tablet/mobile layout needs targeted tuning before field deployment, especially for the timeline and admin controls.
- Import flows rely on XLSX/CSV parsing in-browser; DOCX handling still depends on runtime script injection and clearer error surfacing.

## Next Steps Snapshot
1. Audit responsive behaviour (tablet/field) and tighten keyboard/a11y affordances.
2. Implement durable log/export handling so Admin actions persist beyond the session.
3. Stand up Jest + React Testing Library and cover validation/import/export logic first.
4. Profile large exercises (500+ injects/200+ resources) and capture optimisation/UX backlog items.


