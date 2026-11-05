# Project instructions

## Scope and language

- Write new instructions, documentation, task records, comments, and development communication in English. Do not bulk-translate existing product copy as an unrelated change.
- Work in the existing checkout. Cloud tasks are already isolated; do not create a worktree unless requested.
- Complete the requested task, verify it, and report concrete results. Avoid unrelated refactors or dependency upgrades.

## Find context efficiently

- Inspect `git status --short` before editing and preserve existing work.
- Read the relevant files rather than scanning the entire repository repeatedly.
- For mobile work, start with `docs/mobile/README.md`, then read only documents needed for the task. Instructions under `mobile/AGENTS.md` apply inside that directory.
- `CLAUDE.md` contains detailed legacy web conventions; consult the relevant section when changing web/backend code. Current code and explicit user instructions take precedence over stale descriptions.
- Use one bounded task at a time. Record decisions and outcomes in the task/document that owns them; link to existing information rather than duplicating it.
- Use one agent by default. Delegate only when requested or explicitly authorized, with independent scopes and clear file ownership.

## Repository boundaries

- `pages/` and `components/`: Next.js web application; `pages/api/v1/`: HTTP API shared with future clients.
- `models/`: server-side domain and database operations. `infra/`: controllers, errors, database, migrations, and local services.
- `lib/`: mixed utilities; inspect dependencies before treating any file as client-safe.
- `mobile/`: independent Expo application with its own manifest, lockfile, configuration, and commands. Read `mobile/AGENTS.md` and `mobile/README.md`; root installation/checks do not install or validate it.
- Keep the existing Next.js backend and PostgreSQL. Mobile accesses HTTPS APIs, never database models or web server rendering.
- Preserve web behavior and API compatibility. Installed mobile releases may remain active after the server changes.
- Never expose credentials, database connections, or privileged cron/migration operations to a client bundle. Keep TLS verification enabled.

## Backend conventions

- Use existing controllers, validation schemas, typed errors, and model boundaries. Parameterize SQL.
- Enforce ownership/membership on the server; hiding a control in the app is not authorization.
- Test authentication and authorization changes, including denial paths and existing web cookie behavior.
- Add forward migrations for schema changes; inspect the project's migration conventions before writing one. Do not edit applied migrations.
- No production data in development or integration tests. The integration suite drops and recreates the public schema.

## Existing commands (repository root)

Node.js 24 is pinned in `.nvmrc`; dependencies use `package-lock.json`.

| Operation                                    | Command                                                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Install locked dependencies                  | `npm ci`                                                                                             |
| Start PostgreSQL, migrate, and start Next.js | `npm run dev`                                                                                        |
| Check database readiness                     | `npm run wait-for-postgres`                                                                          |
| Apply migrations                             | `npm run migrations:up`                                                                              |
| Check types                                  | `npx --no-install tsc --noEmit`                                                                      |
| Run all existing tests on Node 24            | `NODE_OPTIONS=--no-experimental-strip-types npm test`                                                |
| Run one existing suite                       | `NODE_OPTIONS=--no-experimental-strip-types npm test -- --runTestsByPath tests/path/to/file.test.ts` |
| Build web application                        | `npm run build`                                                                                      |
| Check formatting of touched files            | `npx --no-install prettier --check <paths>`                                                          |

API integration tests require the local database, migrations, `.env.development`, and a running server on port 3000. Preserve injected environment settings and do not print secret values. Under a cloud sandbox, use the supported permission flow for blocked Docker, network, or localhost operations.

The Node option above addresses the observed Jest config-loading issue on Node 24; preserve other required Node options when combining settings. Do not replace meaningful tests with mocks just to bypass required services.

## Verification and completion

- Match checks to the change. Documentation-only work needs formatting/link checks, not application builds. Start code changes with focused checks; broaden when shared behavior changes.
- Diagnose failures. Distinguish repository defects, missing setup, skipped checks, and regressions. Historical baseline results are in `docs/mobile/validation.md`; they are not current evidence.
- Do not rerun unchanged failing commands without a new diagnosis or state change. Do not run costly remote builds for every edit.
- Next.js may regenerate `next-env.d.ts`; review and restore only incidental changes caused by your commands.
- Report the outcome, files changed, checks run, and unresolved blockers. Update the task status and next step.
- Do not commit, push, submit builds, or publish a release merely to complete a documentation task.
