# MOB-007: Shared authenticated data client

Status: done (implementation and local checks); device validation pending.

## Outcome

Stable trusted-origin requests, private credential attachment, 401 invalidation, stale-account response suppression, focus-aware resources, and foreground verification that preserves drafts.

## Ownership

mobile/src/data/client.ts; mobile/src/data/hooks.ts; mobile/src/session/controller.ts; mobile/tests/data-client.test.ts

Implemented with disjoint file ownership while the other native/backend tracks ran independently. Shared transport and session changes belong to MOB-007; schema-clearing tests had exclusive database windows.

## Verification

13 data cases and 15 session cases; combined mobile run contains 55 passing cases. Formatting and whitespace checks passed. Final integrated backend selection passed 41 suites / 311 tests, deliberately excluding five provider-email suites described in [CI coverage](../../ci.md).

## Remaining validation

Native rendering, accessibility, platform dialogs/sharing, and end-to-end device interactions are not established by pure tests or JS bundle export. No deployment or commit was performed. See the [mobile guide](../../../mobile/README.md) and [validation record](../validation.md).
