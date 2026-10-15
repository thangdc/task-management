# Roadmap and delivery rules

This file is the working roadmap for the autonomous engineering workflow. Keep it aligned with issue #2.

## Product goal

A polished, visual-first personal task manager that is useful without an account, stores tasks locally by default, and provides a practical Gantt timeline. Supabase cloud sync is optional and must not be enabled until project configuration and row-level security can be verified.

## Milestones

- [x] PR01 — discovery and architecture proposal.
- [x] PR02 — runnable app shell, visual dashboard, interactive Gantt timeline, CI, and deployed testing preview.
- [ ] PR03 — task-management interactions: filters/sorting are in place; finish CRUD edge cases, dependency handling, useful Gantt interactions, and related tests.
- [ ] PR04 — resilient local-first persistence, import/export recovery, empty/error states, responsive layout, accessibility, and regression tests.
- [ ] PR05 — optional Supabase authentication/schema/RLS/cloud sync. Blocked until required Supabase project configuration and credentials are explicitly provided; do not invent or expose credentials.
- [ ] PR06 — broader regression coverage, browser-level smoke tests where feasible, performance/security review, and documentation.
- [ ] PR07 — release readiness, known limitations, and final verification of the testing URL.

## Acceptance criteria

- All product changes are proposed as pull requests targeting `develop`.
- Run `npm run typecheck`, `npm test`, and `npm run build` for every implementation slice.
- Merge only after PR checks pass. After merge, wait for the preview deployment and verify that the published page responds successfully.
- If a check or preview fails, prioritize fixing that failure before starting unrelated work.
- Keep changes small, coherent, tested, and documented.
- Never commit secrets, enable cloud sync without validated Supabase configuration/RLS, or silently change the product's architecture.
- Do not mark a milestone complete until all its acceptance criteria are implemented and verified. PR03 is still in progress; adding filters/sorting alone does not complete it.

## Autonomous run policy

Each scheduled run should deliver at most one coherent implementation slice:
1. Inspect this roadmap, the current automation PR (if any), and the latest verification state.
2. Fix an outstanding failed check/preview first; otherwise implement the highest-priority unfinished milestone.
3. Run typecheck, unit tests, and production build; fix failures before proposing changes.
4. Open/update a PR targeting `develop`, wait for GitHub CI, and merge only if checks pass.
5. Wait for the GitHub Pages preview deployment and verify the URL.
6. If any verification fails, stop the run and leave enough context for the next run to fix it. Never claim success without evidence.

Supabase and future Linear integration remain conditional/future scope, not reasons to block the local-first core.
