# Excon Dashboard

Exercise Control Dashboard for planning and running emergency/incident exercises. Provides inject scheduling (MSEL), resource tasking, a live exercise timer, CSV/XLSX import, and local persistence.

## Quick Start
- Prereqs: Node.js LTS (>= 18) and npm
- Install: `npm install`
- Dev: `npm run dev` then open `http://localhost:3000` (redirects to `/dashboard`)
- Build: `npm run build`
- Start: `npm start`

## Features
- Exercise timer: start/stop/reset, manual set (HH:MM:SS)
- Injects: add/edit/reorder; CSV/XLSX import with validation, templates, and preview
- Resources: add/edit; CSV/XLSX import with validation, templates, and preview
- Local persistence: state stored in `localStorage` and rehydrated on load
- Filters: inject type and resource status filters for timeline view
- Accessibility: focus styles and labeled controls

## Project Structure
- `app/`: Next.js App Router pages (`/dashboard`), layout, and styles
- `public/`: Static assets (may be empty)
- `Resources/`: Reference docs (not used at runtime)
- Config: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`

## Import Templates
Use the built-in “Download Template” buttons in the import dialogs for CSV templates.

## Roadmap
See `plan.md` for phases and upcoming work (templates, export, real-time sync, AAR, mapping).

## Import Template Structure
- Injects CSV columns: `Title`, `Due (minutes)`, `Type`, `To`, `From`
  - Time accepts minutes (e.g., 15), absolute `HH:MM:SS` from start (e.g., 01:30:00), or seconds if the header includes "second"/"sec".
  - Type accepts: in person, radio/phone, electronic, map inject, other (case-insensitive; common abbreviations like ip/rp/e/m/o are mapped).
- Resources CSV columns: `Label`, `Kind (optional)`, `ETA (minutes)`, `Status`
  - ETA accepts minutes, absolute `HH:MM:SS`, or seconds if the header includes "second"/"sec".
  - Status accepts: requested, tasked, enroute, arrived, cancelled.

Notes
- CSVs exported from the app or the templates can be re-imported directly.
- Excel files (`.xlsx` / `.xls`) are also supported.
