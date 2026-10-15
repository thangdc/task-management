# Task Management

A personal task manager built around a calm daily dashboard and an interactive Gantt timeline. Start immediately without creating an account; tasks are stored in this browser.

## Current capabilities

- Daily overview with open, due-today, and completed task summaries.
- Quick task capture, task details, priorities, status, start/due dates, and notes.
- List search, completion toggle, deletion, and timeline view.
- Gantt date/progress interactions.
- Local-first persistence and JSON backup export.
- Responsive layout; no account or backend required for the core experience.

The app seeds a small editable sample plan on first open. Clearing browser storage starts a fresh local session. Export a JSON backup before clearing browser data.

## Development

Requires Node.js 20+.

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

## Testing preview

The `Deploy testing preview` workflow publishes `develop` to GitHub Pages at:

https://thangdc.github.io/task-management/

The first deployment may require enabling **Settings → Pages → Build and deployment → Source: GitHub Actions** in the repository settings. Do not consider the preview verified until the workflow succeeds and the URL loads.

## Product roadmap

1. Local-first task capture and planning.
2. Stronger task editing, dependencies, and timeline interactions.
3. Backup/import, persistence resilience, accessibility and regression coverage.
4. Optional Supabase authentication and cloud sync, only after credentials and row-level security are configured and validated.
5. Future integrations (such as Linear) only after the personal workflow is useful and stable.

No Supabase keys or other secrets are needed for local mode. Never commit service-role credentials to the frontend.