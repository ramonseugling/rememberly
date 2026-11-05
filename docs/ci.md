# Continuous integration

The [CI workflow](../.github/workflows/ci.yml) runs on pull requests and pushes to `main`. The two independent jobs use Node.js 24 and each application's existing lockfile. No Expo account, production database, email credentials, or repository secrets are required.

## Checks

**Web and API** installs root dependencies, checks root Prettier formatting and TypeScript, starts PostgreSQL 16, applies migrations, starts the real Next.js development server, and runs the selected root Jest suites serially. Readiness requires the expected unauthenticated `401` from `/api/v1/mobile/me`. Tests use an isolated runner database and may drop/recreate its schema. The job then builds the web application with `npm run build`; it does not run the production migration/deployment command from `vercel.json`.

**Mobile** installs the independent `mobile/` dependencies, checks formatting and TypeScript, runs every `mobile/tests/*.test.ts` file with Node's test runner, and exports iOS and Android JavaScript bundles. The explicit staging API origin uses a reserved invalid domain. Exporting bundles does not contact that API, upload to EAS, create an installable native binary, or publish a release. Newly added feature unit tests in that directory join CI automatically.

The workflow has read-only repository permissions, cancels superseded runs for the same ref, and retains failed Next.js server logs for seven days. Database integration suites run serially because they reset shared tables/schema; the independent mobile job runs concurrently.

## Email coverage deliberately excluded

CI selects root test files and logs each exclusion. Only these explicitly named provider-delivery suites are excluded:

- `tests/integration/api/v1/admin/broadcast/post.delivery.test.ts`
- `tests/integration/api/v1/notifications/send-reminders/get.delivery.test.ts`
- `tests/integration/api/v1/notifications/send/post.delivery.test.ts`
- `tests/integration/api/v1/otp/post.delivery.test.ts`
- `tests/integration/api/v1/password/forgot.delivery.test.ts`

Their adjacent original suites now run in CI. They cover authorization, input validation, unsupported methods, unknown/passwordless reset accounts, reset throttling with two persisted recent tokens, cron no-match cases, marketing opt-out, and suppression of already-recorded broadcast deliveries. Cron and broadcast fixtures are isolated per case: no eligible recipient reaches the mailer. The mismatched reminder case now calls the endpoint and asserts zero sends rather than merely checking that its fixture exists. Required cron configuration is asserted; missing configuration does not silently skip a test.

The excluded assertions still cover OTP sending, successful password reset requests (including the allowance and expired-window cases), matching event/reminder sends, broadcast delivery persistence, and idempotency after a real send. Successful delivery and the full request-to-provider path are **not** verified by CI. The persisted-delivery fixture only verifies recipient suppression, not that a prior email was sent. Daily-digest tests exercise the no-recipient branch because `DIGEST_RECIPIENTS` is unset; successful digest delivery remains uncovered.

No fabricated `RESEND_API_KEY` is configured, no email delivery is mocked, and production email code is unchanged. The delivery suites retain generated recipient addresses; do not run them against a live provider until recipients are adapted to a controlled inbox/domain and an isolated delivery environment is configured. An API key alone is insufficient. Future suites that send email need the same review before joining CI.

See [MOB-022](mobile/tasks/MOB-022-email-test-coverage.md) for local verification evidence and remaining delivery work. Hosted GitHub Actions results require a separate observed run.

## Deployment settings remain separate

Adding GitHub Actions does **not** make Vercel wait for these checks. Vercel's existing Git integration can still deploy a push to `main` immediately, even while CI runs or fails. This change does not alter Vercel, deployment commands, repository rules, or production data.

To require successful checks before changes enter `main`, a repository administrator can configure a GitHub branch ruleset/protection rule requiring pull requests and the `Web and API` and `Mobile` checks after their first workflow run. Direct-push/bypass permissions must match that policy. GitHub protection controls merging; Vercel deployment behavior must be reviewed separately if deployments themselves must wait. These settings have not been applied by this task.

## Local equivalents and limits

Root commands and database prerequisites are in [AGENTS.md](../AGENTS.md). Use `NODE_OPTIONS=--no-experimental-strip-types npm test -- --runTestsByPath <selected files>` on Node 24; running plain `npm test` includes the email-dependent files and requires their delivery prerequisites. Never point these destructive suites at production.

From `mobile/`, run `npm run format:check`, `npm run typecheck`, and `npm test`. Export requires explicit `EXPO_PUBLIC_APP_ENV` and `EXPO_PUBLIC_API_URL`, as described in the [mobile guide](../mobile/README.md).

CI does not replace real-device testing, native development/store builds, push-delivery verification, accessibility review, or end-to-end UI tests. The workflow must run on GitHub before its hosted-runner result can be considered verified.
