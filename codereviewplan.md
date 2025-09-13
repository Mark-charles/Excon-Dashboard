# EXCON Dashboard — Code Review and Hardening Plan

This plan turns the code review findings into actionable phases. It prioritizes fixing encoding issues, standardizing iconography (ASCII-first), improving correctness and performance, adding persistence/logging, establishing tests, and tightening documentation and DX.

Scope focuses on the current app folder, components, utilities, and top-level docs.

## Phase 0: Encoding + Icon Strategy (ASCII-first)

Goals: eliminate corrupted characters, standardize iconography with lightweight ASCII, and prepare an optional SVG path.

- [x] Enforce UTF-8 and clean documents
  - Re-save `README.md`, `plan.md`, `projectbackground.md` as UTF-8. Remove any corrupted glyphs.
  - Verify terminal/editor default encoding is UTF-8 for all contributors.
- [x] Replace corrupted emoji/glyphs with ASCII
  - Remove broken returns from `app/utils/styleUtils.ts` (`getInjectTypeEmoji`, `getResourceStatusEmoji`).
  - Introduce `app/utils/iconHelpers.ts` with ASCII-first helpers:
    - `renderInjectTypeGlyph(type)` -> strings like `[IP]`, `[RP]`, `[E]`, `[M]`, `[O]`.
    - `renderResourceStatusGlyph(status)` -> `[REQ]`, `[TASK]`, `[ENR]`, `[ARR]`, `[CXL]`.
  - Keep existing color helpers; only swap the glyph source.
- [x] Replace usages across the UI
  - `Timeline.tsx` and `TimelineFilterBar.tsx`: use new ASCII helpers; remove corrupted characters in labels.
  - `InjectList.tsx` action buttons: replace with ASCII labels/symbols and clear titles:
    - Up: `^`, Down: `v`, Complete: `Done`, Undo: `Undo`, Skip: `Skip`, Delete: `Del`.
  - Ensure button sizes and spacing remain usable after text changes.
- [x] Prepare optional SVG path (not enabled by default)
  - Extend `iconHelpers.ts` with optional `mode: 'ascii' | 'svg'` to render inline SVGs later.
  - Default to `ascii` to minimize overhead; document how to switch.
- [x] Visual QA pass
  - Verify alignment and spacing after ASCII changes.
  - Confirm no remaining corrupted characters in UI or docs.

Exit criteria: All corrupted glyphs removed, ASCII glyphs render consistently, docs are clean UTF-8.

## Phase 1: Quick Wins and Correctness

Goals: fix small correctness issues, improve resilience, and make layout responsive.

- [x] Timer typing: use `ReturnType<typeof setInterval>` instead of `NodeJS.Timeout` in `app/dashboard/page.tsx`.
- [x] Non-mutating utilities: make `renumberInjects` return a sorted copy (no in-place sort).
- [x] Functional state updates: prefer `setIsRunning(prev => !prev)` etc.
- [x] Input validation feedback:
  - Show inline feedback when `parseHMS` fails in timer manual set and resource ETA edit.
- [x] Responsive timeline width:
  - Replace hard-coded width (1000) with measured container width via `ref` + `ResizeObserver`.
- [x] Tighten TS config:
  - Remove `allowJs: true` from `tsconfig.json` (project is TS-only).

Exit criteria: Build passes; timeline is responsive; basic validation feedback present; TS config simplified.

## Phase 2: Timeline Performance and UX

Goals: reduce recompute churn and improve usability for larger datasets.

- [x] Memoize heavy computations with `useMemo`:
  - `filteredInjects`, `filteredResources`, `timeIntervals`, and `stackedItems` in `Timeline.tsx`.
- [ ] Virtualize long lists (as needed):
  - Consider `react-window` for `InjectList` when rows exceed a threshold.
- [x] Time marker legibility:
  - Prevent overlapping labels; adapt granularity to viewport width.
- [x] Accessibility and keyboard flows:
  - Add `aria-label` to icon-only controls; ensure inline-edit fields are keyboard-friendly and trap focus correctly.

Exit criteria: Smooth updates under large lists; no obvious over-rendering; accessible interactions.

## Phase 3: Persistence, Logging, and Error Handling

Goals: make sessions resumable, improve observability, and provide user-friendly error handling.

- [x] Session persistence (localStorage):
  - Persist exercise info, timer, injects, resources; restore on mount with an explicit "Restore" prompt.
  - Add JSON export/import for exercises.
- [x] Logging integration:
  - Use `loggingUtils.ts` for import errors, time-parse failures, and critical state transitions.
  - Provide a simple "Export Logs" action (downloads text with error/task logs from localStorage).
- [x] Global error handling:
  - Call `setupGlobalErrorHandling()` on app load; surface friendly toasts for failures in modals.

Exit criteria: Users can save/restore sessions; errors are logged and exportable; unhandled errors are captured.

## Phase 4: Testing Foundation

Goals: establish a minimal but useful test bed for correctness and regressions.

- [ ] Add Jest + React Testing Library config and scripts.
- [ ] Unit tests:
  - `timeUtils`: `formatHMS`, `parseHMS` (valid/invalid cases).
  - `validation`: `canTransitionTo`, `generateId` shape, `normalizeHeader`, `mapInjectType`.
  - `renumberInjects` ordering and numbering.
- [ ] Component tests:
  - `InjectList`: inline edit flows; action buttons; status toggles.
  - Import modals: happy path and validation error rendering.
  - `TimerControls`: manual set behavior.
- [ ] Snapshot/light render tests:
  - `Timeline` with small datasets to assert marker and item rendering.

Exit criteria: Tests run locally; critical utilities and flows covered; CI-ready scripts exist.

## Phase 5: Documentation and Developer Experience

Goals: make the project easy to understand, test, and extend.

- [x] README improvements:
  - Add "How to Test", "Known Limitations", and "Icon Strategy (ASCII-first, SVG optional)" sections.
  - Document persistence behavior and privacy implications.
  - Link "support docs" and outline how AIDR standards map to features.
- [x] Linting and formatting:
  - Ensure ESLint runs clean; consider optional Prettier or keep ESLint-only per current setup.
  - Verify Tailwind classes remain consistent after icon/icon-label changes.

Exit criteria: Documentation is current, encoding-clean, and includes testing instructions; linting is green.

## Optional Phase 6: SVG Icons (Opt-in Alternative)

Goals: provide a crisp, scalable icon set as a configurable alternative to ASCII.

- [x] Inline SVGs and helpers:
  - Add SVG mappings to `iconHelpers.ts` and support `mode: 'svg'` returning React elements.
- [x] Configurable mode:
  - Centralize icon mode via `NEXT_PUBLIC_ICON_MODE` (`ascii` | `svg`). Default: `svg`.
- [x] Integration:
  - Update `Timeline`, `TimelineFilterBar`, `ResourceRequestBoard` to render icons from helpers.
- [ ] Performance review:
  - Measure render timings and bundle impact; keep icons minimal.

Exit criteria: Toggling between ASCII and SVG is straightforward; performance remains acceptable.

---

## Work Breakdown by Files (initial targets)

- `app/utils/styleUtils.ts`: remove broken emoji helpers; keep color functions.
- `app/utils/iconHelpers.ts`: new file; ASCII-first icon/glyph API; optional SVG.
- `app/components/timeline/Timeline.tsx`: switch to icon helpers; memoize computations; responsive width.
- `app/components/timeline/TimelineFilterBar.tsx`: clean labels; use ASCII icons; accessibility labels.
- `app/components/dashboard/InjectList.tsx`: ASCII action labels; aria attributes; optional list virtualization.
- `app/dashboard/page.tsx`: interval typing; functional updates; non-mutating `renumberInjects`.
- `app/utils/timeUtils.ts`, `app/utils/validation.ts`: tests; minor safeguards.
- `README.md`, `plan.md`, `projectbackground.md`: encoding cleanup and content updates.
- `tsconfig.json`: remove `allowJs`.

## Risks and Mitigations

- Risk: Icon changes shift layout and overflow.
  - Mitigation: adjust padding/min-widths; verify at common breakpoints.
- Risk: Responsive timeline causes reflow churn.
  - Mitigation: throttle ResizeObserver; memoize derived values.
- Risk: Persistence could conflict with import flows.
  - Mitigation: explicit restore prompt; clear vs merge semantics; document behavior.

## Rough Timeline (sequenced)

- Week 1: Phase 0, Phase 1.
- Week 2: Phase 2, start Phase 3 (persistence).
- Week 3: Finish Phase 3; Phase 4 (tests).
- Week 4: Phase 5 docs; optional Phase 6 SVG if desired.

## Acceptance Summary

- Icons render cleanly (SVG by default, ASCII optional); UI readable and accessible.
- Timeline is responsive and performant; list interactions smooth.
- Sessions can be saved/restored; errors logged/exportable.
- Lint passes cleanly; docs are updated and UTF-8 clean.

Deferred (post-review):
- Virtualized long lists in InjectList (if datasets grow).
- Testing foundation (Jest/Vitest + RTL) and component coverage.
- Optional performance review for SVG icon mode.

