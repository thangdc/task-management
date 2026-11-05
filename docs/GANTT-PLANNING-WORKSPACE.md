# Gantt planning workspace — product review and delivery plan

Status: approved implementation direction; feature work is split into independently verifiable PRs.
Target branch: `develop`
Product mode: local-first, no account required.

## 1. Goal

Turn Task Management into a practical personal planning workspace. A user must be able to plan work with estimates, compare actual effort, understand weekdays and non-working days, manage holidays, and manipulate task dates directly on a readable full-width timeline.

This initiative covers five reported problems:
1. Tasks have no estimated or actual effort.
2. The Gantt calendar does not make weekday names and weekends easy to distinguish.
3. There is no way to enter holidays or leave.
4. Moving tasks on the chart does not work reliably.
5. The timeline is visually too small compared with secondary dashboard content.

## 2. Current-state review (develop, reviewed 2026-11-05)

- React 18 + TypeScript + Vite; single-page application in `src/App.tsx`.
- Frappe Gantt `^1.0.4` is the current timeline adapter.
- Canonical task data is in `src/model.ts`; persisted in `task-management.tasks.v1`.
- Task model currently has title, notes, status, priority, start/due dates, progress and timestamps. It has no estimate/actual effort or calendar data.
- The timeline maps tasks to Frappe Gantt and wires `on_date_change` and `on_progress_change`. There is no automated browser-level drag test, so the drag failure is not yet diagnosed.
- The Gantt is placed inside a padded card with a 650px minimum-width host. The main content has a 1370px max width and overview cards remain prominent.
- Current unit tests cover date-only helpers, normalization, progress and malformed local storage; there are no calendar, effort, Gantt interaction or UI regression tests.
- No open PR was visible during review. Existing roadmap issue #2 and security follow-up issue #5 remain tracked.
- The current roadmap says task CRUD/Gantt interactions are still incomplete. This initiative should be delivered as the next focused product increment; it does not authorize Supabase work.

## 3. Product and UX decisions

### 3.1 Estimate and actual effort
- Add optional `estimateHours` and `actualHours` numeric fields to each task. Values are decimal hours, finite and non-negative; blank means not entered (not zero).
- Keep `progress` as a separate completion indicator. Effort spent and completion percentage are different concepts.
- Show estimate, actual and variance (actual minus estimate) in task details and compact task/timeline summaries. Clearly distinguish under-estimate, on-track and over-estimate without implying that actual effort predicts completion.
- In the first version, actual effort is a manually maintained total. Do not invent a timer or work-log subsystem.
- Existing local tasks must migrate safely; old records load with both fields unset. Export/import compatibility must be preserved.

### 3.2 Calendar and working days
- Week view explicitly labels each column with localized weekday + date; Monday is the first day of the week for the default Vietnamese/personal planning experience.
- Saturday and Sunday receive a distinct, low-contrast background; today receives a separate marker that remains legible on weekends.
- Add a calendar management surface for named date ranges such as annual holidays, personal leave and one-off non-working days. Each entry has a name, start date, end date and category.
- Persist calendar settings locally, validate date ranges and prevent malformed entries from breaking the timeline.
- Use a configurable default working week (Monday–Friday). Keep special working days out of scope for the first iteration unless implementation proves it is needed for correct calendar calculations.
- Calendar entries are overlays/context, not tasks. They must not inflate task counts or completion metrics.

### 3.3 Timeline interactions
- A drag of the task bar body moves the task while preserving its duration.
- Dragging either resize handle changes the start or end date.
- Every gesture updates the canonical task model, validates start <= due, and persists through the existing local-first repository path.
- Clicking a task opens the task editor; dragging must not accidentally trigger the editor.
- Provide keyboard/form-based date editing as an accessible fallback.
- First diagnose Frappe Gantt's actual pointer behavior and current CSS/event setup. Do not replace the library or build a custom Gantt unless a reproducible library limitation justifies it.

### 3.4 Timeline-first layout
- Timeline view becomes a dedicated planning workspace using available viewport width and height.
- Reduce or remove the oversized hero, overview cards and decorative sections from the timeline route.
- Keep the timeline toolbar compact and persistent; make task details accessible without taking permanent space away from the chart.
- Preserve responsive behavior: horizontal scroll where needed, usable controls on narrow screens, and no clipped task names or controls.
- Keep overview and task-list views useful; do not force all screens into the Gantt layout.

## 4. Proposed data model and compatibility

Task additions:
- `estimateHours?: number`
- `actualHours?: number`

New local calendar collection:
- `id`
- `name`
- `startDate` (date-only)
- `endDate` (date-only, inclusive)
- `type` (`holiday` | `leave` | `other`)

Calendar preferences:
- `workingDays` defaults to Monday through Friday.

Keep date-only values as `YYYY-MM-DD` and avoid UTC conversions. Introduce a versioned storage migration rather than dropping or resetting existing `v1` tasks. If separate keys are used for calendar preferences, document the migration and export/import format.

## 5. Delivery plan and GitHub task breakdown

Each implementation issue becomes a focused PR targeting `develop`. Do not merge a PR until its checks pass; after merge, verify the GitHub Pages preview and fix regressions before moving to the next slice.

### PR-A — Task effort estimates and actuals
- Extend and normalize task model with optional estimate/actual hours.
- Add fields and validation to task editor.
- Show estimate, actual and variance in task list/details without cluttering the timeline.
- Migrate existing local records and preserve backup compatibility.
- Add unit tests for missing, zero, fractional, negative, non-finite and legacy values.

### PR-B — Working calendar and holiday management
- Add calendar model, persistence and migration.
- Add a compact calendar/working-days settings surface.
- Create, edit and delete named holiday/leave ranges.
- Add unit tests for inclusive ranges, invalid dates, overlaps and legacy storage.

### PR-C — Gantt calendar readability
- Show weekday names and dates in the timeline header.
- Distinguish Saturday/Sunday and today visually.
- Render holiday/leave overlays and labels without affecting task data.
- Verify day/week/month scales and locale/date boundaries.

### PR-D — Reliable task dragging and resizing
- Reproduce and diagnose the existing drag issue.
- Fix pointer hit targets, CSS overlays, event propagation or library configuration as evidence requires.
- Verify bar move preserves duration; resize changes only the intended boundary.
- Verify state and local persistence after each interaction; add regression coverage.

### PR-E — Timeline-first workspace redesign
- Give timeline view the available width/height and reduce surrounding chrome.
- Compact toolbar, clearer task labels, accessible details panel.
- Preserve mobile/tablet behavior and existing overview/list views.
- Add layout/browser smoke coverage.

### PR-F — End-to-end regression and release verification
- Verify combined effort/calendar/Gantt behaviors together.
- Test legacy local data, refresh persistence, export/import, keyboard access and responsive layout.
- Fix any regressions found; update README and roadmap only when evidence supports completion.

## 6. Acceptance criteria for the initiative

- User can enter and later edit an estimate and actual effort on every task.
- Empty effort values remain distinct from zero; invalid/negative values cannot be saved.
- Variance is calculated and labeled consistently.
- Weekdays are readable; weekends and today are visually distinguishable in day/week/month modes.
- User can create, edit and delete named holidays/leave ranges; they persist after refresh.
- Holiday/leave ranges are visibly marked on the Gantt and do not behave like tasks.
- Dragging a bar moves the task; resizing changes its duration; date changes persist after refresh.
- Timeline view uses substantially more of the viewport, without breaking list/overview/mobile views.
- Existing users' local task data survives migration.
- For every PR: `npm run typecheck`, `npm test`, `npm run build` pass; preview deployment succeeds and the published URL is checked.
- No Supabase credentials, cloud sync, or scheduled automation are added as part of this scope.

## 7. Engineering guardrails

- Keep domain date/effort/calendar logic outside presentation components.
- Treat Frappe Gantt as a replaceable adapter; do not store library-specific task objects.
- Prefer small PRs with explicit acceptance criteria and focused tests.
- Never overwrite a user's local task data during schema migration.
- Do not mark the initiative complete based on unit tests alone; the Gantt interactions require a real browser smoke test.


## 8. Delivery status (updated 2026-11-05)

- [x] Design review and delivery plan — PR #13 merged.
- [x] PR-A estimate/actual effort — PR #21 merged; CI and preview deployment passed.
- [x] PR-B working calendar and holiday management — PR #22 merged; CI, preview deployment and create/edit/delete smoke test passed.
- [x] PR-C weekday/weekend and holiday rendering — PR #23 merged; CI and preview deployment passed.
- [x] PR-D drag/resize stability fix — PR #24 merged; CI and preview deployment passed. Live browser drag/resize acceptance is still pending, so issue #18 remains open.
- [x] PR-E timeline-first workspace — PR #25 merged; CI and preview deployment passed.
- [ ] PR-F combined regression and release verification — in progress.

The drag fix addresses two verified source-level causes in Frappe Gantt 1.0.4: date-change callbacks fire during mousemove (which previously caused React to recreate the chart mid-gesture), and the click callback fires after a drag. The implementation buffers date changes until mouseup and suppresses the click following a drag. This is not considered fully verified until a live browser test confirms move, resize, click, and refresh persistence.
