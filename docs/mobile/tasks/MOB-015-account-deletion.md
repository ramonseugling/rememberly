# MOB-015: Password-confirmed account deletion

Status: done

## Outcome

Allow an authenticated native user to delete their account atomically after confirming their current password. Require owners to delete their groups explicitly first, as selected by the user.

## Scope and context

- [Account deletion contract](../account-deletion.md), existing mobile identity endpoint, session-security password confirmation, current FK migrations, and local integration fixtures.
- Add a transactional account-deletion model and extend `DELETE /api/v1/mobile/me`, preserving existing GET behavior and strict Bearer isolation.
- Remove personal/FK records, case-insensitive email OTPs, and attributed error logs. Preserve other accounts and groups owned by others.
- Verify malformed/authentication/confirmation/ownership denials, rollback, concurrent state changes, and existing mobile data regressions using disposable local PostgreSQL.

## Outside this task

Native UI, OAuth reauthentication, confirmation throttling, public deletion/retention pages, deployment, production deletions, and store submission.

## Acceptance criteria

- [x] Current password and literal DELETE confirmation are required; cookies cannot select an account.
- [x] Owned groups block deletion with 409 and remain intact until explicitly deleted.
- [x] Personal records and every finite/persistent session are deleted atomically; unrelated accounts remain intact.
- [x] Transactional failures roll back cleanup; concurrent password/session/ownership changes are revalidated under locks.
- [x] Focused HTTP/data regressions, formatting, and type checks complete.

## Verification

Requires local PostgreSQL and the live Next development server; tests drop and recreate only the disposable local schema. Run deletion and existing mobile/data tests sequentially, using actual PostgreSQL row locks and a temporary failure trigger. No email provider or production service is called.

## Completion record

- Result: transactional model, DELETE/profile routing, focused tests, existing transport regression updates, and the contract are implemented.
- Checks: deletion and existing mobile/data regression suites pass, 2 suites / 65 tests. Coverage includes wrong/passwordless confirmation, strict Bearer/cookie isolation, malformed requests, owned-group preservation, actual trigger-induced rollback, three deterministic PostgreSQL lock races, account isolation, finite/persistent session invalidation, and push-data cascades. Root type checking, touched-file Prettier, relative documentation links, and diff whitespace checks pass.
- Decisions: owned groups must be explicitly deleted before account deletion; incorrect/passwordless confirmation is 403 and preserves the current valid login.
- Blockers: none for local backend verification. Provider reauthentication, confirmation-endpoint abuse controls, privacy/retention disclosures, and real device validation remain release work.
- Next action: exclusive database ownership is released; integrate native UI through the documented contract and run the combined wave regressions.
