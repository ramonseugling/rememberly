# MOB-012: Automated web, API, and native verification

Status: in-progress

## Outcome

Pull requests and pushes to `main` receive independent web/API and mobile checks without production credentials or Expo authentication.

## Scope and implementation

- [CI workflow](../../../.github/workflows/ci.yml): root formatting/types, PostgreSQL 16 migrations and real HTTP integration tests, web build; separate mobile formatting/types/unit tests and dual-platform bundle export.
- Root TypeScript now recognizes the existing `lib/*` imports used by Jest. The group-birthday test explicitly guards its expected match before accessing fields. Root compilation continues to exclude `mobile/`.
- [CI guide](../../ci.md) records exact email-suite omissions, local equivalents, deployment limitations, and manual repository settings.

## Acceptance criteria

- [x] Define PR and `main` push checks using independent locked dependencies.
- [x] Use isolated PostgreSQL and a real HTTP server, without production data or fake email credentials.
- [x] Include all native config, session, and feature unit tests under `mobile/tests/`.
- [x] Explain that GitHub checks alone do not gate existing Vercel automatic deployments.
- [ ] Observe a successful hosted GitHub Actions run after committing/pushing this work.

## Verification and remaining work

Root TypeScript and formatting of the workflow/config/test/docs edits passed locally. YAML structure, every shell step, the Python test-selection block, and documentation link targets were checked. At this checkpoint, selection includes 41 root suites and excludes the five email suites. The workflow is a new hosted-runner configuration; no GitHub run has been triggered by this task. Root integration tests are coordinated with the backend task because local suites share a destructive database. Final local integration ran this exact suite selection successfully: 41 suites / 311 tests. The aggregate mobile command passed 55 cases and mobile type checking. The hosted job and its production web-build step remain unverified; local Google Fonts access is restricted by cloud network policy.

The five provider-dependent suites listed in [CI coverage](../../ci.md#email-coverage-deliberately-excluded) are intentionally omitted, including their non-delivery cases. No claim of full integration/email coverage is made. Successful daily-digest delivery, real-device behavior, and store builds remain outside this task.

Next action: review and commit the integrated work, observe both hosted jobs, then decide whether to configure required pull-request checks. Repository protection and Vercel settings remain unchanged.
