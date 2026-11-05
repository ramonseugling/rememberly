# MOB-010: Native profile and occasions

Status: done (implementation and local checks); device validation pending.

## Outcome

Profile retrieval/editing, explicit existing birthday-clear limitation, commemorative subscriptions, real dates, account-scoped state, logout and fresh-password other-session cleanup.

## Ownership

mobile/src/features/account/; mobile/app/(tabs)/profile.tsx; mobile/app/(tabs)/occasions.tsx; mobile/tests/account.test.ts

Implemented with disjoint file ownership while the other native/backend tracks ran independently. Shared transport and session changes belong to MOB-007; schema-clearing tests had exclusive database windows.

## Verification

Six focused tests; combined mobile types and tests pass. Backend cleanup is tested by MOB-011. Formatting and whitespace checks passed. Final integrated backend selection passed 41 suites / 311 tests, deliberately excluding five provider-email suites described in [CI coverage](../../ci.md).

## Remaining validation

Native rendering, accessibility, platform dialogs/sharing, and end-to-end device interactions are not established by pure tests or JS bundle export. No deployment or commit was performed. See the [mobile guide](../../../mobile/README.md) and [validation record](../validation.md).
