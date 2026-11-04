# MOB-005: Implement authenticated mobile data retrieval

Status: done

## Outcome

Implement the [data contracts](../data-contracts.md): `GET /api/v1/mobile/me`, `/api/v1/mobile/agenda`, and `/api/v1/mobile/commemorative-dates` using the existing backend, without changing SSR or mutation consumers.

## Context and dependencies

- Depends on [MOB-003](MOB-003-data-contracts.md) and implemented MOB-002 session validity.
- Inspect the sources listed in the contract. The shared request identity currently omits birthday fields; the group aggregate has no group IDs; the commemorative model returns a display-formatted date.
- Integration tests need disposable local PostgreSQL, migrations, `.env.development`, and the local Next.js server. No email, OAuth, store account, or device is required.

## Scope

- Add the three GET-only routes and safe response projections.
- Reuse or extract strict Bearer authentication and sanitized English error handling through an additive helper; preserve session-route behavior and existing shared cookie-first routes.
- Compute a single reference civil date per list request and deterministic ISO calendar/date ordering without locale parsing or host timezone drift.
- Add small model/utility changes only where needed, preserving existing exported behavior. No schema migration or dependency is anticipated.
- Update inventory and contract status with actual evidence after validation.

## Outside this task

- Expo implementation, writes, account deletion, social login, push, pagination, personal/group deduplication beyond existing rules, global recurrence-policy changes, unrelated baseline fixes, and root/mobile build restructuring.

## Acceptance and integration-test matrix

| Area            | Required evidence                                                                                                                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity/errors | Valid persistent and finite Bearer sessions; missing/invalid/expired/revoked session rejection; cookie-only denial; conflicting-cookie isolation; no-store/no cookies; query rejection; unsupported methods/Allow; sanitized failure envelopes |
| Profile         | Exact allowed fields from current account; updated values reflected; nullable birthday fields; no role/hash/token leakage or arbitrary-user lookup                                                                                             |
| Personal agenda | Empty list, each event type, custom field projection, stored reminders, stable namespaced IDs, owned events only, correct mutation ID distinct from list ID                                                                                    |
| Group agenda    | Only other members of shared groups; no missing-birthday rows; deduplication across groups; representative name/count; no email/year exposure; removed membership disappears; group rows noneditable and reminder null                         |
| Calendar        | Today=0, past date rolls forward, year boundary, February 29/non-leap rollover, legacy impossible dates normalized consistently, ISO date-only output, fixed reference date, deterministic ties independent of row order                       |
| Catalog         | Every definition returned; current user's enabled state; isolation from another account; fixed and nth-Sunday dates; past dates roll forward; disabled entries included; obsolete subscriptions ignored                                        |
| Existing writes | Profile/event update and subscription toggle visible on reread; ownership remains enforced; existing APIs and SSR-facing model shapes unchanged                                                                                                |
| Compatibility   | Session API regression checks after any auth-helper extraction; root types/formats distinguish existing baseline failures from new diagnostics                                                                                                 |

Use synthetic accounts/groups and controlled calendar fixtures. Do not enable real email or run schema-clearing suites concurrently. Exercise host-timezone independence in a relevant utility test or isolated process; do not claim it was checked only because the host uses UTC.

## Verification

Start with new HTTP suites and relevant calendar utility tests, then affected session/event/group/commemorative/profile suites. Use the Node 24 Jest workaround from root instructions. Run relevant type/format checks and review the diff. Do not run a remote native build for this backend-only task.

## Completion record

- Result: implemented the three authenticated GET routes, shared strict mobile Bearer/error helpers, whitelisted projections, and timezone-independent civil recurrence utilities. Existing SSR/models and shared cookie-first behavior remain unchanged.
- Checks: 19 suites / 190 tests passed across new data/session/calendar checks and existing session, migration, profile, event, group, subscription, and group-model regressions. The new calendar tests execute isolated processes under UTC, America/New_York, Asia/Tokyo, and Pacific/Auckland, including a DST boundary. A final session-suite run passed all 40 tests after strengthening the exact 405-envelope assertion. Type checking reports the same nine unrelated baseline diagnostics and no new-file errors. Touched-file formatting passed.
- Blockers: none for local API behavior. No production deployment, device test, or public release was performed. Fixed-date model fixtures use the existing server DEMO_TODAY environment override, and public query overrides are rejected.
- Next action: integrate native read consumers with the implemented contracts; retain account recovery, lost-device revocation, abuse-control, and deployment gates tracked in the session contract.
