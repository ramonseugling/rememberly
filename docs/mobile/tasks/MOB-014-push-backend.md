# MOB-014 — Push delivery backend

Status: implemented and locally verified (2026-11-04). Production delivery remains disabled pending provider/device/scheduling validation.

## Outcome

Implement the [push contract](../push-contract.md) without changing email behavior: strict Bearer preference/device APIs, default-off account preference, exact-session registrations, authenticated token/installation rebinding, and cascade cleanup on deletion. Selection covers personal dates/advance reminders, deduplicated shared birthdays, and seven-day commemorative reminders.

A forward migration creates preferences, registrations, a durable deduplicated outbox, and attempt history. Worker leases coordinate concurrent invocations. Expo sends are batched (up to 100), ticket receipts are tracked separately (up to 50 per invocation), retry budgets are persisted, and ambiguous sends stop rather than being blindly repeated. Privacy-safe content contains resource identifiers only. Production transport is fixed to Expo HTTPS and uses optional server-only `EXPO_PUSH_ACCESS_TOKEN`.

The existing daily email route optionally invokes push under `PUSH_DELIVERY_ENABLED=true`, preserving its email behavior and response. A separate CRON_SECRET-protected invocation hook exists. Delivery defaults off; no additional Vercel schedule was introduced. Daily-only execution cannot reliably retrieve receipts within Expo's retention window or provide timely retries. See the contract's concrete operational bounds and enablement requirements.

## Owned implementation

- `infra/migrations/1793790200000_push-notifications.ts`
- `models/push-devices.ts`, `push-http.ts`, `push-provider.ts`, `push-delivery.ts`
- Mobile preference/device routes and `/api/v1/notifications/push`
- Direct model integration and HTTP authorization/validation tests

Parent integration owns the optional call from the existing daily email route. Native registration/settings are [MOB-017](MOB-017-native-push.md).

## Verification

- Two focused integration suites pass: **34 tests** covering HTTP authorization/validation, ownership, rebinding, exact-session eligibility, deletion cascades, concurrent claims, reminder selection, production batch capacity, bounded send/receipt attempts, stale tokens, and abandoned leases.
- Root `npx --no-install tsc --noEmit` passes.
- Prettier checks pass for the owned implementation, tests, and documentation.

Tests use disposable local PostgreSQL and the local Next.js server, with injected provider transport; they do not send notifications or use fabricated provider credentials. Localhost requires the managed environment's supported execution escalation. The first default-sandbox test attempt failed before setup due to that restriction; rerunning with supported local-service access passed. During implementation, tests caught a batch claim still limited to one row and an invalid role fixture; both were corrected before the final passing run.

## Next action

Validate APNs/FCM and physical iOS/Android builds, approve/configure a more frequent supported trigger, observe ticket/receipt and retry recovery within retention, and confirm deployment duration/capacity before setting the delivery flag. Add operational retention/cleanup and capacity monitoring as production volume grows. No build submission, push, or production deployment was performed by this task.
