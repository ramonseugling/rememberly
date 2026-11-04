# Profile, agenda, and commemorative-date contracts

Status: specified by [MOB-003](tasks/MOB-003-data-contracts.md), implemented and locally verified by [MOB-005](tasks/MOB-005-data-api.md). No production deployment or native read-screen integration has been performed.

## 1. Source review and compatibility

The website currently obtains the profile from the session-backed SSR context in `pages/profile.tsx`, combines personal events and group birthdays in `pages/dates.tsx`, and calls `commemorative.listForUser` in `pages/commemorative-dates.tsx`. Existing event and group mutation APIs remain the source of write behavior.

Add these read-only endpoints without changing SSR props or existing routes:

| Method/path                              | Result                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| `GET /api/v1/mobile/me`                  | The authenticated user's editable profile fields                         |
| `GET /api/v1/mobile/agenda`              | Personal events plus visible group birthdays, ordered by next occurrence |
| `GET /api/v1/mobile/commemorative-dates` | The complete current catalog and this user's subscription state          |

The mobile prefix permits consistent Bearer-only identity and English error responses without changing the existing shared controller's cookie precedence or Portuguese web messages. These are HTTP contracts over the existing models and database, not a separate backend.

## 2. Common transport, identity, and errors

Use the strict Bearer extraction and persistent/finite session validity defined in the [session contract](session-contract.md). Cookies never select identity on these three new routes. A malformed or invalid Bearer credential cannot fall back to a valid cookie. Native clients must continue omitting cookies when calling existing shared mutation endpoints, whose cookie-first behavior is unchanged.

All responses include `Cache-Control: no-store`. Success is 200 with JSON and no `Set-Cookie`. Do not echo credentials or expose passwords, roles, session rows, invite codes, other users' email addresses, or internal metadata. Whitelist response fields. Requests require no body and accept no query parameters; authenticate GET first, then reject any query parameters rather than accepting user ID, date, timezone, filtering, or pagination overrides.

These endpoints are GET-only. Unsupported methods return 405 with `Allow: GET`, including HEAD and OPTIONS; HTTP suppresses a HEAD response body. Native requests do not require a browser CORS preflight. Keep framework parsing from producing contradictory responses for unsupported requests; no JSON body needs parsing on these routes.

| Case                                                     | HTTP/name                   | Message                             | Action                                                           |
| -------------------------------------------------------- | --------------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| Missing, malformed, unknown, expired, or revoked session | 401 / UnauthorizedError     | A valid Bearer session is required. | Sign in and send your session token in the Authorization header. |
| Query parameter supplied                                 | 400 / ValidationError       | Query parameters are not supported. | Remove query parameters and try again.                           |
| Unsupported method                                       | 405 / MethodNotAllowedError | Method not allowed.                 | Use GET.                                                         |
| Unexpected failure                                       | 500 / InternalServerError   | An unexpected error occurred.       | Try again later.                                                 |

Return the existing envelope `{ "name": "...", "message": "...", "action": "...", "status_code": 401 }`, with the actual corresponding status. Every 401 includes `WWW-Authenticate: Bearer realm="rememberly"`. Clients branch on status/name, not text. Sanitize server error recording so credentials, raw query strings, and provider/database internals do not leak. A deleted user makes the joined session lookup invalid and therefore returns 401, not 404. A valid account with no agenda data returns an empty list, not 404.

## 3. GET `/api/v1/mobile/me`

```http
GET /api/v1/mobile/me
Authorization: Bearer <session-token>
```

```json
{
  "user": {
    "id": "11111111-1111-4111-8111-111111111111",
    "name": "Alex Example",
    "email": "alex@example.com",
    "birth_day": 15,
    "birth_month": 3,
    "birth_year": null
  }
}
```

`id` is the current user's UUID string; name/email are strings from the current database record. Each birth field is an integer or null, reflecting stored data, including accounts with missing birthdays. Do not fabricate a birthday, current year, or empty string. The session lookup already reads these fields, but `AuthenticatedRequest.user` currently drops the birthday fields: reuse a safely typed authenticated lookup or a model read rather than assuming the shared request object contains them.

This contract does not add profile writes. Existing `PATCH /api/v1/users` remains unchanged, and the app may reread this endpoint after updating. No arbitrary user lookup or account-deletion behavior is introduced.

## 4. Calendar semantics

Both list responses include `today` as `YYYY-MM-DD` and `time_zone: "America/Sao_Paulo"`. Compute one reference civil date per request using the existing `getToday()` policy; the development-only `DEMO_TODAY` override remains server configuration, never client input. Use that same reference for every row. Do not serialize local midnight with `toISOString().slice(0, 10)` and accidentally shift a calendar date with the execution host's timezone.

`next_date` is a date-only `YYYY-MM-DD`, not an instant. `days_until` is the nonnegative integer count of calendar days from `today` to that next occurrence, not elapsed hours divided by 24 in a daylight-saving timezone. Dates matching today have zero days remaining. `is_next_year` compares the year of `next_date` to the reference year.

For personal events and group birthdays, preserve the current website's annual rollover convention: construct the occurrence for the reference year, and use the next year only when that occurrence is before today. Existing JavaScript date normalization observes February 29 on March 1 in a non-leap year and can normalize legacy impossible month/day combinations. The read API must not silently invent a different recurrence policy, reject the entire list, or mutate such rows. Tests must make this existing behavior explicit. A future product-wide date-validation/leap-day decision must update web, notifications, and mobile coherently in a separate task.

For commemorative dates, preserve the Brazil-specific definitions in `lib/commemorative-dates.ts`, including nth-Sunday rules. Existing `models/commemorative.ts` returns `nextDate` formatted as `DD/MM/YYYY`; this API deliberately exposes date-only ISO format instead. Compute/map calendar components explicitly, never parse the display string with `new Date(displayString)`.

## 5. GET `/api/v1/mobile/agenda`

```json
{
  "today": "2026-10-30",
  "time_zone": "America/Sao_Paulo",
  "items": [
    {
      "id": "event:22222222-2222-4222-8222-222222222222",
      "source": {
        "kind": "personal_event",
        "event_id": "22222222-2222-4222-8222-222222222222"
      },
      "title": "Family celebration",
      "type": "custom",
      "custom_type": "Family day",
      "event_day": 30,
      "event_month": 10,
      "reminder_days_before": 7,
      "next_date": "2026-10-30",
      "days_until": 0,
      "is_next_year": false,
      "can_edit": true
    },
    {
      "id": "group-birthday:33333333-3333-4333-8333-333333333333",
      "source": {
        "kind": "group_birthday",
        "user_id": "33333333-3333-4333-8333-333333333333",
        "group_name": "Family",
        "group_count": 2
      },
      "title": "Taylor Example",
      "type": "birthday",
      "custom_type": null,
      "event_day": 1,
      "event_month": 11,
      "reminder_days_before": null,
      "next_date": "2026-11-01",
      "days_until": 2,
      "is_next_year": false,
      "can_edit": false
    }
  ]
}
```

### Sources, ownership, and stable identifiers

- Personal rows are only `event.findAllByUserId(authenticatedUserId)`. `source.event_id` is the UUID accepted by existing event endpoints; the namespaced list `id` is not an event UUID and must not be sent to mutation routes. `can_edit` is true only for these owned personal rows. The server still enforces ownership on mutations.
- Group rows match `groupMember.findAllBirthdaysForUser(authenticatedUserId)`: only other members of groups the viewer currently belongs to, with non-null birth day/month. Exclude the viewer's own birthday, deduplicate by birthday user across shared groups, and include no users from unrelated groups. Do not expose the member's email or birth year.
- Group `source.user_id` is the birthday member UUID already used by the current deduplication query, not a group ID. `group_count` is the number of distinct groups shared with that member. `group_name` is the existing query's `MIN(g.name)` representative string; it is not necessarily a unique group and cannot be used to authorize navigation.
- Current aggregate queries do not return group IDs. This first contract does not add a group-lookup join solely for navigation: a group birthday can lead to the groups list, not a guessed group-detail route. A richer group-target contract can be added later.
- `id` is `event:<event_uuid>` or `group-birthday:<member_uuid>` and remains stable when a title, date, or shared-group count changes. A personal birthday and a group-derived birthday remain distinct rows even if they refer to the same person; the current data model has no reliable linkage between them.
- `type` is one of `birthday`, `dating_anniversary`, `wedding_anniversary`, `celebration`, or `custom`. `custom_type` is a string for a custom personal event and null otherwise. Day/month are stored integers. A personal reminder is the stored/default integer from the existing supported set; group reminder is null because per-user advance configuration is not supported for this source. Do not misrepresent null as a configured zero-day reminder.

### Ordering and list boundaries

Sort ascending by `next_date`, then by the full namespaced `id` using deterministic code-unit comparison. Do not use localized title collation or database row order for ties. `items: []` is the valid empty result. Return the full visible list for this initial parity contract: no filters, cursors, silent truncation, or arbitrary server limit. This matches existing complete-list SSR behavior. Measure list size/latency before release; any pagination rollout must be an explicit contract evolution with clients consuming all required pages.

Agenda excludes commemorative catalog subscriptions; that is a separate list below. It does not infer notification delivery guarantees or introduce group advance reminders.

## 6. GET `/api/v1/mobile/commemorative-dates`

Example response excerpt with one item shown; actual responses contain every defined catalog item:

```json
{
  "today": "2026-10-30",
  "time_zone": "America/Sao_Paulo",
  "items": [
    {
      "key": "christmas",
      "label": "Natal",
      "emoji": "🎄",
      "enabled": true,
      "next_date": "2026-12-25",
      "days_until": 56
    }
  ]
}
```

`key` is the stable catalog identifier. Return all current definitions, including disabled entries, and derive `enabled` only from the authenticated user's `commemorative_subscriptions`. Unknown/obsolete stored subscription keys do not create extra catalog entries. Current keys are `mothers_day`, `fathers_day`, `valentines_day`, `childrens_day`, and `christmas`; the server may add keys, so clients must render unknown valid catalog keys rather than crashing.

`label` and `emoji` preserve the current catalog content, including its Portuguese labels. English development documentation does not translate the product catalog or change the web experience. The response's field names are English; client localization of catalog keys can be a separate product task.

Sort by `next_date` ascending and then `key` using deterministic code-unit comparison. The source catalog is finite and returns completely, with no pagination. Existing `PUT`/`DELETE /api/v1/commemorative-dates/[key]` remain the subscription writes; after a write, reread this list. A subscription is an account preference, not proof of OS notification permission or guaranteed push/email delivery.

## 7. Implementation and validation boundary

No schema change, new dependency, SSR refactor, or mutation contract is required by these reads. Small model/utility additions are appropriate where they make field projection, calendar calculations, and single-reference-date handling explicit. Preserve old model exports/response shapes used by the website. Reuse session validity and safe credential parsing without coupling data handlers to the session route module.

The [MOB-005 test matrix](tasks/MOB-005-data-api.md) defines integration evidence, including cross-user denial, membership removal, identical-date ordering, null birthdays, rollover, commemorative subscriptions, and legacy write compatibility. MOB-003 specified these endpoints; MOB-005 implemented them and passed 19 suites / 190 tests, including affected legacy behavior and timezone checks. Device validation and production release remain separate.
