# MOB-003: Specify mobile profile and list retrieval

Status: done

## Outcome

Define additive authenticated HTTP contracts for profile, unified agenda, and commemorative catalog retrieval so native clients do not depend on Next.js server-rendered page props.

## Context and dependencies

- Reviewed `pages/profile.tsx`, `pages/dates.tsx`, `pages/commemorative-dates.tsx`, `models/event.ts`, `models/group-member.ts`, `models/commemorative.ts`, `lib/date-utils.ts`, `lib/commemorative-dates.ts`, the existing user handler/controller, and the session contract.
- Builds on MOB-002 session validity and cookie-isolation behavior. No running service, credential, or mobile bootstrap is required for specification work.

## Scope

- Specify method/path, identity, response fields, error envelopes, dates, ownership, list ordering, and mutation references.
- Distinguish existing model/SSR capabilities from new HTTP routes and identify implementation tests.

## Outside this task

- Backend implementation, database work, Expo code, translation of existing catalog content, notification scheduling, and new recurrence product policy.

## Acceptance criteria

- [x] Canonical [data contracts](../data-contracts.md) include JSON examples and actual source gaps.
- [x] Cookie/Bearer identity, stable list IDs, editability, and group visibility are explicit.
- [x] Calendar formats, reference timezone, deterministic ordering, and existing rollover behavior are specified.
- [x] [MOB-005](MOB-005-data-api.md) defines bounded implementation and real-service acceptance checks.

## Verification

Cross-checked proposed projections against inspected models/SSR pages. Formatted owned Markdown, validated relative links, and parsed JSON examples. No backend tests run because these routes are not implemented.

## Completion record

- Result: specified three GET routes under `/api/v1/mobile/`, preserving existing web and mutation behavior.
- Checks: Markdown formatting, local links, JSON syntax, and example calendar-day counts checked.
- Limitations: legacy date normalization is preserved rather than introducing a new leap-day/invalid-date product policy. Full-list behavior remains initially unpaginated. Group aggregates lack group IDs, so no specific-group deep link is promised.
- Decisions: recorded in the canonical contract; parent can link it from the shared inventory/decision log.
- Next action: implement MOB-005; Expo foundation proceeds independently.
