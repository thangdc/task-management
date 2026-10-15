# Enabling autonomous roadmap delivery

The workflow in `.github/workflows/roadmap-agent.yml` is designed to run one small engineering slice per day, open/update a PR against `develop`, wait for CI, merge only when CI passes, and verify the GitHub Pages preview after deployment.

## Required one-time setup

1. **Use `develop` as the repository default branch.** GitHub scheduled workflows only run from the default branch. In the repository, open **Settings → General → Default branch → Switch to `develop`**. The current workflow PR must be merged first.
2. **Create a Gemini API key** with access to the Responses API. Add it under **Settings → Secrets and variables → Actions → New repository secret** as `GEMINI_API_KEY`. Create it in Google AI Studio and store it only as a GitHub Actions secret; Gemini API quotas and billing depend on your Google AI Studio setup.
3. **Create a fine-grained GitHub personal access token** scoped only to `thangdc/task-management`, then add it as `TASK_MANAGEMENT_GITHUB_TOKEN`. Grant:
   - Contents: Read and write
   - Pull requests: Read and write
   - Actions: Read
   - Issues: Read
   - Metadata: Read (automatically required)
4. Ensure GitHub Actions is enabled and the repository's Pages source is **GitHub Actions**. The existing preview workflow should already be deployed, but the first run should verify this.
5. After saving both secrets and switching the default branch, open **Actions → Autonomous roadmap delivery → Run workflow** to test it once. Confirm the run creates a PR, CI passes, the PR merges into `develop`, and the preview URL is verified.

## Safety and operating behavior

- The workflow uses the official Google Gemini CLI GitHub Action, runs typecheck/unit tests/build before proposing code, and does not give the agent the GitHub token directly.
- A separate GitHub token is used only by workflow steps to open/update the PR, read checks, and merge after checks pass.
- Each run delivers at most one coherent slice. The daily schedule continues until the local-first roadmap is complete.
- If PR checks or preview deployment fail, the run fails and leaves the state for the next run to investigate before unrelated work.
- The workflow does not enable Supabase or fabricate credentials. PR05 remains blocked until real project configuration and RLS can be verified.
- The workflow has authority to merge AI-generated changes after checks pass. If you do not want that level of autonomy, remove the merge step and review PRs manually.
- API usage and GitHub Actions minutes may incur charges. Never paste API keys into issues, PRs, prompts, or source files.

## What is not yet verified

Adding the workflow to the repository does not by itself mean it is running. It is operational only after the two secrets are configured, `develop` is the default branch, and a manual test run successfully completes the full PR → CI → merge → preview verification sequence.
