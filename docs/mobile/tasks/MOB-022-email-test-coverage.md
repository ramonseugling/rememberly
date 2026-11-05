# MOB-022: Recover service-independent email endpoint coverage

Status: implemented and locally verified; real delivery validation pending.

## Outcome

Five mixed email suites are split into adjacent service-independent and explicit `*.delivery.test.ts` files. CI excludes only the five delivery suites by exact path and logs the exclusions. The original endpoint suites join CI without mailer mocks, fabricated provider keys, or application behavior changes.

Authorization, validation, method rejection, no-recipient cron handling, reminder mismatch, marketing opt-out, persisted broadcast delivery suppression, passwordless/unknown account behavior, and reset rate-limit denial run without sending email. Rate-limit denial uses two real database reset-token fixtures and asserts no third token is created. Broadcast and cron cases reset their user-related fixtures per test to prevent eligible recipients leaking between cases. Delivery idempotency has its own setup and checks its first successful send rather than depending on another test.

## Verification

Root TypeScript and formatting pass. The complete workflow-selected set passes locally: 56 suites / 479 tests, including the restored endpoint coverage and new social-auth tests. An earlier attempt failed because the local HTTP server was no longer running; the complete run passed after restarting it. No delivery suite or external email operation has been executed. This is local evidence, not a hosted GitHub Actions result.

## Remaining work

Configure an isolated real provider environment with controlled recipients before executing the delivery suites, which retain generated addresses. Verify successful OTP/reset/event/reminder/broadcast delivery and first-send persistence/idempotency there. Daily digest successful delivery is also outside current CI coverage. Do not infer delivery success from fixture-based suppression or zero-recipient requests.

See [CI coverage and deployment limits](../../ci.md) for the exact exclusions. This task does not alter Vercel deployment gates or GitHub branch rules.
