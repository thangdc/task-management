# PR01 — Discovery and Architecture Proposal

## Goal

Establish a small, testable product foundation for personal task planning before implementing the full Gantt experience. This PR is documentation-only: it must not add runtime dependencies, application code, database migrations, or backend services.

## Product principles

1. **Personal productivity first.** Optimize the daily workflow for one person; avoid team/project-management complexity until it is needed.
2. **Usable without an account.** Opening the app should allow immediate task capture and planning.
3. **Local-first persistence.** Save anonymous-user data in browser storage with clear export/backup expectations. Do not silently imply that local data syncs across devices.
4. **Cloud sync is optional.** Supabase Auth and PostgreSQL are a later milestone, protected with Row Level Security (RLS).
5. **Visual-first, not Gantt-only.** Pair a timeline with a practical task list and a daily overview so tasks remain quick to capture and edit.
6. **Integration-ready, not integration-led.** Keep external-provider IDs and sync concerns out of the first release; consider Linear only after the core workflow proves useful.

## Initial user journey

1. Open the app without signing in.
2. See a useful Today / Upcoming overview and a small sample or empty state with a clear “Add task” action.
3. Capture a task with title, due date, priority, and optional start date / duration.
4. Switch between list and Gantt timeline; edit task dates and progress from the most direct interaction available.
5. Refresh the page and confirm local tasks remain.
6. Later, choose to sign in and enable cloud sync without changing the task-planning mental model.

## MVP scope

### Include
- Quick task creation and editing.
- Task title, notes, status, priority, start date, due date, progress, and optional parent/dependency fields where supported cleanly.
- Today / Upcoming task views.
- Gantt timeline with day/week/month zoom, task bars, “today” marker, and clear empty/loading/error states.
- Local persistence, sample data that can be cleared, and a basic export/import path before cloud sync is introduced.
- Responsive layout and keyboard-accessible controls.

### Explicitly defer
- Team workspaces, invitations, comments, notifications, billing, AI planning, complex resource allocation, recurring rules, and Linear synchronization.
- Backend/API implementation and database migrations in this discovery PR.
- Features that depend on paid editions of a Gantt library unless separately approved.

## Gantt library evaluation

The Gantt component is a replaceable UI adapter, not the canonical data model. Store tasks in an application-owned model and map them to/from the chosen library. This protects local data and future cloud sync from library-specific schemas.

| Candidate | Strengths | Trade-offs | Initial assessment |
|---|---|---|---|
| **SVAR React Gantt — `@svar-ui/react-gantt`** | React component, TypeScript support, task dependencies, hierarchical tasks, drag-and-drop, configurable time scales; open-source edition is MIT | Some advanced features belong to a separate commercial PRO package; verify every required feature against the OSS edition | **Preferred candidate for a small proof of concept**, subject to a feature check |
| **Frappe Gantt — `frappe-gantt`** | MIT-licensed, framework-agnostic JavaScript, customizable views, dependency arrows, relatively small integration surface | Not React-native; richer task editing and hierarchy UX may require building more application UI around it | Good lightweight fallback if the React component proves too heavy |
| **Custom timeline** | Full control over interaction and visual design | High implementation and accessibility cost; date math, scrolling, drag/drop, dependencies, and zoom become our responsibility | Do not build from scratch for the MVP |

Sources:
- SVAR React Gantt repository: https://github.com/svar-widgets/react-gantt
- SVAR installation and OSS/PRO licensing: https://docs.svar.dev/react/gantt/getting-started/installation/
- SVAR overview and feature descriptions: https://docs.svar.dev/react/gantt/overview/
- Frappe Gantt repository and MIT license: https://github.com/frappe/gantt

**Decision status:** provisional recommendation only. Before installing a dependency, inspect the current repository scaffold and run a focused proof of concept. Validate task editing, dependency rendering, date/time-scale behavior, responsiveness, keyboard accessibility, bundle impact, and license scope. Do not assume that a feature shown in a PRO demo is available in the MIT edition.

## Proposed architecture

### Frontend
- A small React + TypeScript app is a reasonable default if no existing scaffold or constraint contradicts it.
- Separate domain/task logic from views and persistence.
- Suggested boundaries:
  - `features/tasks`: task model, validation, task operations.
  - `features/planning`: Today / Upcoming and list view.
  - `features/gantt`: timeline adapter and library-specific mapping.
  - `lib/storage`: local persistence interface and implementation.
  - `lib/sync`: reserved interface only until cloud sync is implemented.
- Keep date calculations and task validation independent from the Gantt component.

### Task model (initial concept)
- `id`: stable UUID generated by the app.
- `title`, `notes`
- `status`, `priority`
- `startDate`, `dueDate` (date-only values where possible; avoid accidental timezone shifts)
- `progress` (bounded 0–100)
- `parentId` and dependency IDs only if the chosen MVP UX needs them.
- `createdAt`, `updatedAt`
- Future sync metadata should be added deliberately, not prematurely.

### Persistence progression
1. **Anonymous:** versioned local storage behind a `TaskRepository` interface; handle malformed/old data and storage failures.
2. **Backup:** provide JSON export/import and document that browser storage is not a backup.
3. **Signed-in:** Supabase Auth + PostgreSQL, with RLS enforcing ownership on every user-owned row.
4. **Sync:** define conflict behavior and migration/import rules before promising cross-device sync. Do not automatically merge local and cloud records without a clear user-visible policy.

Local-first does not mean that local storage is secure storage. Avoid putting secrets or sensitive personal information there.

## Non-functional requirements

- Fast initial load and useful empty state.
- No login wall for core task capture.
- Accessible labels, focus states, keyboard interaction, and sufficient contrast.
- Tests for date-only values, due-date boundaries, progress validation, local-storage round trips, and malformed stored data.
- No credentials or Supabase service-role keys in client code.
- Cloud access must use RLS; client-side filtering alone is not authorization.

## Acceptance criteria for PR01

- [ ] Current repository scaffold and existing conventions are inspected before technology choices are finalized.
- [ ] The MVP and explicit non-goals are documented.
- [ ] At least two Gantt candidates are compared, including license and feature caveats.
- [ ] A provisional architecture and task-model boundary are documented.
- [ ] Local-first, backup, and later cloud-sync progression is documented.
- [ ] No application runtime code, dependency changes, or database migrations are included.
- [ ] The next implementation PR is scoped to a small Gantt proof of concept and app shell, not the complete product.

## Next step after approval

**PR02 — App shell + Gantt proof of concept:** inspect and honor the existing scaffold, implement the smallest working screen with representative sample tasks, evaluate the chosen library in the real app, and record the final library decision before building full task workflows.
