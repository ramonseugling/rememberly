# Continuous integration

The [CI workflow](../.github/workflows/ci.yml) runs on pull requests and pushes to `main`. The two independent jobs use Node.js 24 and each application's existing lockfile. No Expo account, production database, email credentials, or repository secrets are required.

## Checks

**Web and API** installs root dependencies, checks root Prettier formatting and TypeScript, starts PostgreSQL 16, applies migrations, starts the real Next.js development server, and runs the selected root Jest suites serially. Readiness requires the expected unauthenticated `401` from `/api/v1/mobile/me`. Tests use an isolated runner database and may drop/recreate its schema. The job then builds the web application with `npm run build`; it does not run the production migration/deployment command from `vercel.json`.

**Mobile** installs the independent `mobile/` dependencies, checks formatting and TypeScript, runs every `mobile/tests/*.test.ts` file with Node's test runner, and exports iOS and Android JavaScript bundles. The explicit staging API origin uses a reserved invalid domain. Exporting bundles does not contact that API, upload to EAS, create an installable native binary, or publish a release. Newly added feature unit tests in that directory join CI automatically.

The workflow has read-only repository permissions, cancels superseded runs for the same ref, and retains failed Next.js server logs for seven days. Database integration suites run serially because they reset shared tables/schema; the independent mobile job runs concurrently.

## Email coverage deliberately excluded

CI selects root test files and prints each excluded suite in its log. These five suites currently include delivery assertions against the real Resend provider and generated recipient addresses, so the entire files are excluded:

- `tests/integration/api/v1/admin/broadcast/post.test.ts`
- `tests/integration/api/v1/notifications/send-reminders/get.test.ts`
- `tests/integration/api/v1/notifications/send/post.test.ts`
- `tests/integration/api/v1/otp/post.test.ts`
- `tests/integration/api/v1/password/forgot.test.ts`

This also omits those files' validation, rate-limiting, and authorization assertions. CI does not claim full email or full backend coverage. Other suites, including password-reset consumption and mobile session revocation, remain selected. Daily-digest tests exercise the no-recipient branch because `DIGEST_RECIPIENTS` is unset; successful digest delivery is not covered.

No fabricated `RESEND_API_KEY` is configured, no email delivery is mocked, and application email behavior is unchanged. Before restoring these suites, introduce a supported controlled delivery setup or separate delivery-dependent cases from service-independent assertions. A real API key alone is insufficient: recipient delivery must be controlled as well. Future suites that send email need the same review before joining CI.

## Deployment settings remain separate

Adding GitHub Actions does **not** make Vercel wait for these checks. Vercel's existing Git integration can still deploy a push to `main` immediately, even while CI runs or fails. This change does not alter Vercel, deployment commands, repository rules, or production data.

To require successful checks before changes enter `main`, a repository administrator can configure a GitHub branch ruleset/protection rule requiring pull requests and the `Web and API` and `Mobile` checks after their first workflow run. Direct-push/bypass permissions must match that policy. GitHub protection controls merging; Vercel deployment behavior must be reviewed separately if deployments themselves must wait. These settings have not been applied by this task.

## Local equivalents and limits

Root commands and database prerequisites are in [AGENTS.md](../AGENTS.md). Use `NODE_OPTIONS=--no-experimental-strip-types npm test -- --runTestsByPath <selected files>` on Node 24; running plain `npm test` includes the email-dependent files and requires their delivery prerequisites. Never point these destructive suites at production.

From `mobile/`, run `npm run format:check`, `npm run typecheck`, and `npm test`. Export requires explicit `EXPO_PUBLIC_APP_ENV` and `EXPO_PUBLIC_API_URL`, as described in the [mobile guide](../mobile/README.md).

CI does not replace real-device testing, native development/store builds, push-delivery verification, accessibility review, or end-to-end UI tests. The workflow must run on GitHub before its hosted-runner result can be considered verified.
