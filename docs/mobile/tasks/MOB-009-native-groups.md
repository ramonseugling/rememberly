# MOB-009: Native group management

Status: done (implementation and local checks); device validation pending.

## Outcome

Group list/create/join, member birthdays, invitation sharing, owner rename/delete/remove-member, member exit, confirmations and permission-aware controls.

## Ownership

mobile/src/features/groups/; mobile/app/(tabs)/groups.tsx; mobile/tests/groups.test.ts

Implemented with disjoint file ownership while the other native/backend tracks ran independently. Shared transport and session changes belong to MOB-007; schema-clearing tests had exclusive database windows.

## Verification

Four focused permission/input/date tests; combined mobile types and tests pass. Formatting and whitespace checks passed. Final integrated backend selection passed 41 suites / 311 tests, deliberately excluding five provider-email suites described in [CI coverage](../../ci.md).

## Remaining validation

Native rendering, accessibility, platform dialogs/sharing, and end-to-end device interactions are not established by pure tests or JS bundle export. No deployment or commit was performed. See the [mobile guide](../../../mobile/README.md) and [validation record](../validation.md).
