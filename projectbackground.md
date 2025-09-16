# EXCON Dashboard - Background Brief

_Last updated: 13 Sep 2025_

## Mission
Deliver a single operational picture for exercise controllers so they can run realistic emergency training events, capture outcomes, and align to Australian emergency management standards without juggling spreadsheets and paper timelines.

## Primary Users
- **Exercise Controllers / Directors** - drive the master schedule, manage inject flow, and report outcomes.
- **Scenario Managers** - maintain inject content, import data from planning spreadsheets, and coordinate with observers.
- **Field Liaison / Resource Coordinators** - track resource requests, status changes, and arrival times.
- **Observer/Evaluators** - monitor progress and rely on logs/timeline exports for post-exercise analysis.

Secondary stakeholders include training coordinators, agency representatives, and emergency managers who review outputs and guide future exercises.

## Standards & References
- Anchored to **AIDR emergency exercise doctrine** and **AIIMS** principles (see `support docs/`).
- Imports expect the structures found in agency-issued MSE spreadsheets and Word documents.
- Reporting outputs (JSON, PDF, logs) are designed to feed after-action workflows and improvement plans.

## Current Operating Picture
- **Exercise Timeline Control** - realtime timer, manual overrides, and status-aware inject/resource timeline.
- **Master Schedule Management** - inline editing, validation, import/export for injects, and persistent numbering.
- **Resource Tracking** - workflow-aware status changes, ETA editing, and visual feedback in both board and timeline.
- **Activity Capture** - key actions logged for inclusion in reports and future audit tooling.
- **Dashboard Admin Panel** - JSON export/import, log export, PDF report, and reset utilities.
- **Offline-first Persistence** - localStorage snapshot/restore keeps data available between sessions; JSON export supports handoff or archival.

## Challenges & Opportunities
- Logging currently lives in the browser only; agencies will expect durable audit logs and central storage.
- Import validation messaging was improved but still needs surfacing within the UI when conflicts occur.
- No automated testing or uptime telemetry yet; risk to reliability.
- Responsive behaviour needs a targeted tablet audit before live deployment.

## Phase 2 Focus (see `plan.md` for detail)
1. **Reliability & Persistence** - formalise save/load flows, template support, and durable logging/reporting.
2. **Field Readiness** - responsive layout, keyboard affordances, and resilient offline behaviour.
3. **Quality Foundation** - automated tests, structured error handling, and performance checks with large datasets.
4. **Documentation & Training** - operator quick-start, import templates, and troubleshooting guides aligned with AIDR language.

## Supporting Materials
- `plan.md` - phased delivery plan and backlog.
- `task.log` - running record of completed work.
- `README.md` - technical orientation and current status.
- `support docs/` - reference standards, inject examples, and exercise templates.

*Keep this brief updated as new stakeholders join or Phase 2 milestones ship.*
