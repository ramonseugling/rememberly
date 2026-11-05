# MOB-011: Atomic account recovery and other-session revocation

Status: done

## Outcome

Make password reset atomically revoke finite/persistent sessions, and provide a strict Bearer-only operation for confirming the current password and revoking every other session.

## Scope and source context

- [Security contract](../session-security.md), existing password reset/session models, mobile Bearer/error helpers, and existing web/mobile session tests.
- Add transactions and stale-password issuance protection, preserving web errors and session lifetime policies.
- Add `DELETE /api/v1/mobile/sessions/others`, fresh password confirmation, cookie isolation, sanitized English errors, and idempotent cleanup.
- Real-service concurrency, rollback, isolation, input, and regression tests. No actual email, new credentials, migration, or dependency is required.

## Outside this task

Account deletion, owned-group policy, OAuth reauthentication, push-device cleanup, rate-limit infrastructure, native settings UI, deployments, and store submission.

## Acceptance criteria

- [x] Reset password change, token consumption, and complete user-session revocation commit together or fully roll back.
- [x] Replayed/invalid reset tokens cannot change password or sessions; concurrent replay has one winner.
- [x] A password login authenticated before reset cannot issue a usable old-password credential after reset completes.
- [x] Confirmed cleanup preserves the exact current valid session and every other account; repeated cleanup is idempotent.
- [x] Wrong password, malformed/expired/revoked credentials, cookie-only identity, and null-password accounts cannot revoke access.
- [x] Existing finite web/OAuth and persistent mobile session semantics remain compatible.

## Verification

Run new model/HTTP security tests and existing reset/session/data authorization regressions sequentially using the disposable local database. Validate rollback using a temporary database trigger, and coordinate actual PostgreSQL locks for concurrency tests rather than relying on timing-only sleeps. Run formatting/type checks and distinguish unrelated failures.

## Completion record

- Result: atomic password reset and session revocation, transactional stale-password issuance protection, and password-confirmed other-session cleanup are implemented. Invalid session is 401; wrong/passwordless confirmation is 403 and preserves valid current login.
- Checks: final sequential regression passed 20 suites / 215 tests, including real PostgreSQL rollback/concurrency tests, web/mobile sessions, reset HTTP flow, data/profile/event/group/subscription authorization, and persistent-session migration. Root type checking passes. Touched-file formatting, relative links, and diff whitespace checks pass.
- Blockers: none identified for local verification. Release prerequisites remain documented in the security contract.
- Next action: database ownership released to parent; native consumers can integrate the confirmed cleanup operation. Account deletion, provider reauthentication, push cleanup, and login/confirmation abuse controls remain separately scoped release work.
