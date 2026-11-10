# API inventory and contract work

Original inventory inspected against commit `8a7fafa99656dbe46efefca27cc556eb8982df85`, updated for MOB-002 and MOB-005 implementation in this working tree. Recheck implementation before changing a contract. The [mobile session contract](session-contract.md) is implemented and locally verified; it has not been deployed.

## Existing behavior

| Capability                      | Source                                                                       | Mobile gap                                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Protected API                   | `infra/controller.ts`                                                        | Accepts cookie or Bearer; verify all exceptions individually                                                 |
| Login/session/logout            | `pages/api/v1/sessions/index.ts`                                             | POST sets cookie without token in JSON; GET/DELETE read only cookies                                         |
| Session lifetime                | `models/session.ts`                                                          | Web sessions expire after 30 days; implemented mobile sessions have nullable expiration and remain revocable |
| Registration and profile update | `pages/api/v1/users/index.ts`                                                | POST registration and authenticated PATCH; no full profile GET or account DELETE                             |
| OTP/password recovery           | `pages/api/v1/otp`, `pages/api/v1/password`                                  | Depends on email; native navigation and link handling needed                                                 |
| Google login                    | `pages/api/v1/auth/google`, `models/google-auth.ts`                          | Web cookie state and callback redirect; no native exchange flow                                              |
| Personal events                 | `pages/api/v1/events/index.ts`, `pages/api/v1/events/[id].ts`                | CRUD available; preserve ownership checks                                                                    |
| Combined agenda                 | `pages/dates.tsx`                                                            | SSR combines personal events and group birthdays; expose equivalent data                                     |
| Groups                          | `pages/api/v1/groups`                                                        | Existing listing, creation, details, updates, deletion, join, and member management                          |
| Group invitations               | `pages/join-group.tsx`                                                       | Web URL with invite code; native link/resume and optional preview contract needed                            |
| Commemorative dates             | `pages/commemorative-dates.tsx`, `pages/api/v1/commemorative-dates/[key].ts` | SSR reads catalog/preferences; API currently toggles by key                                                  |
| Notifications                   | `models/notification.ts`                                                     | Email delivery; no device, preference, push, or receipt contract                                             |

The additive `/api/v1/mobile/sessions` route now implements password login, Bearer lookup, and revocation. The existing web route remains unchanged. See [MOB-002](tasks/MOB-002-session-api.md) for validation evidence.

## Contract sequence

1. Mobile sessions: specified in MOB-001 and implemented/locally verified in [MOB-002](tasks/MOB-002-session-api.md); public release requirements remain tracked in the contract.
2. Profile, agenda, and commemorative catalog reads: specified in [data contracts](data-contracts.md) by [MOB-003](tasks/MOB-003-data-contracts.md); implemented and locally verified by [MOB-005](tasks/MOB-005-data-api.md).
3. Integrate mobile data consumers after the read endpoints are implemented; existing subscription and other mutation APIs remain unchanged.
4. Define device installation registration/removal and notification preferences.
5. Define authenticated account deletion and its data/identity cleanup semantics.
6. Define native social authentication and link exchanges if included in launch scope.

The specified data-read routes use `/api/v1/mobile/me`, `/api/v1/mobile/agenda`, and `/api/v1/mobile/commemorative-dates`; they are implemented and locally verified, with no production deployment yet. Choose additive routes or explicit modes after assessing current consumers; do not return mobile tokens to every web login by accident.

## Required detail for each implemented contract

- Method/path, authentication source, validated input, response shape, and status codes.
- Example success and failure bodies, with no real credentials or user data.
- Authorization rules, expiration/revocation, and replay or duplicate-request behavior where applicable.
- Compatibility with web and already released app versions; list/ordering limits where relevant.
- Executable tests for the contract, including denial paths and affected legacy behavior.

Existing controller errors generally contain `name`, `message`, `action`, and `status_code`; individual session handlers have custom responses. Do not claim global uniformity until exceptions are checked. Preserve existing consumers or explicitly migrate them.

Reference inventory by source paths; keep final request/response definitions in this document or a linked machine-readable specification when one is introduced. Avoid separate competing TypeScript, Markdown, and schema definitions maintained manually.

## Minimum age

The app is open to people aged 12 or older. `POST /api/v1/users` (registration) and `PATCH /api/v1/users` (profile) answer `400 ValidationError` with message `É preciso ter 12 anos ou mais para usar o Rememberly.` when `birth_day`/`birth_month`/`birth_year` make the person younger than 12 on the current date in `America/Sao_Paulo` (turning 12 today is allowed; a Feb 29 birthday counts on Mar 1 in non-leap years). On `PATCH`, partial birth fields are combined with the stored ones before checking. Without a birth year the age cannot be verified and the request is allowed. Social sign-up (Google, native) has no birth date, so nothing is checked there. The mobile app repeats the check before calling the API (`É preciso ter 12 anos ou mais para criar uma conta.` on sign-up).

## Terms acceptance

`POST /api/v1/users` requires `accepted_terms: true` (boolean, literally `true`) in the JSON body, together with the existing fields. A missing, `false` or non-boolean value answers `400 ValidationError` with message `Aceite os Termos de Uso e a Política de Privacidade para criar a conta.` and no user is created. On `201` the server stores `users.terms_accepted_at = now()` and `users.terms_version = LEGAL_VERSION` (`lib/legal/shared.ts`, currently `2026-11-10`; bump it whenever the Terms or Privacy texts change). Neither column is returned by any API response.

Social sign-up (Google web callback, mobile Google login, native Google/Apple) sends no field: continuing past the "Ao continuar..." notice is the acceptance, and the same two columns are recorded when the account row is created. Signing in again never changes them. Accounts created before this feature keep both columns `NULL` and are not prompted.

## Photos (profile and group)

Added with BE-PHOTO-01. Both endpoints use the shared `authenticatedController` (Bearer or cookie) and take the **raw image bytes** as the request body with an `image/*` `Content-Type` (not multipart). The server accepts JPEG, PNG and WebP up to 2 MB, strips metadata, applies the EXIF orientation, crops to a 512 × 512 square and stores it as WebP.

| Endpoint                          | Who                    | Result                                                  |
| --------------------------------- | ---------------------- | ------------------------------------------------------- |
| `PUT /api/v1/users/avatar`        | The authenticated user | `200 { avatar_url }`; replaces and deletes the old file |
| `DELETE /api/v1/users/avatar`     | The authenticated user | `204`; deletes the file                                 |
| `PUT /api/v1/groups/:id/photo`    | Group owner only       | `200 { photo_url }`; replaces and deletes the old file  |
| `DELETE /api/v1/groups/:id/photo` | Group owner only       | `204`; deletes the file                                 |

Errors: `400 ValidationError` for a non-image content type, invalid or unsupported image data (including GIF), an empty body or a body over 2 MB; `401` when unauthenticated or when a non-owner changes a group photo.

Exposure: `avatar_url` is returned by `GET /api/v1/mobile/me`, by the group member lists and by group-birthday items of `GET /api/v1/mobile/agenda`; `photo_url` by `GET /api/v1/groups` and `GET /api/v1/groups/:id`. Both are public, unguessable URLs (random suffix) and are only handed out to people who share a group with the user, or to the user themselves. Deleting a group or an account removes the stored files on a best-effort basis.

Storage: Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set. Without the token, development and tests write to `public/uploads/` (git-ignored); production refuses uploads with `503` if the token is missing.

## Gift list (owner)

Added with BE-GIFT-02. Shared routes through `authenticatedController` (Bearer or cookie). Each user has one private list; items are visible only to their owner for now (sharing arrives with BE-GIFT-03 and reservations with BE-GIFT-04).

| Endpoint                   | Body                                                               | Result                                           |
| -------------------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| `GET /api/v1/gifts`        | none                                                               | `200 { items: Item[], limit: 50 }`, newest first |
| `POST /api/v1/gifts`       | `{ title, link?, description? }`                                   | `201 Item`                                       |
| `GET /api/v1/gifts/:id`    | none                                                               | `200 Item`                                       |
| `PATCH /api/v1/gifts/:id`  | any of `title`, `link`, `description` (`null` or `""` clears them) | `200 Item`                                       |
| `DELETE /api/v1/gifts/:id` | none                                                               | `204`                                            |

`Item` is `{ id, title, link, description, created_at, updated_at }`. Limits: title 1 to 100 characters, link up to 2000 (only `http`/`https`, no credentials, never fetched by the server), description up to 500, at most 50 items per list (`400` "Sua lista já tem 50 presentes."). Unknown fields, an empty patch and invalid values return `400`; items of other users, unknown ids and malformed ids return `404`.

Reserved and purchased items (BE-GIFT-04, decision 2): `PATCH` and `DELETE` on `/api/v1/gifts/:id` answer `409` with `reason: "reserved"` the first time, without saying who reserved. Repeat the request with `?confirm=true` to proceed; the reservation is cancelled. Items marked purchased always answer `409` with `reason: "purchased"`, even when confirmed. The owner list and item payloads never carry reservation data. When the owner confirms, the person who reserved is notified (push with `data: { kind: "gift_released", user_id: <owner id> }` and e-mail), respecting their `push_enabled` and `email_events` preferences; a failed notification never fails the request.

## Notification preferences

`GET`/`PATCH` `/api/v1/mobile/notification-preferences` now also expose `push_marketing` (boolean, default `false`): push for the "Novidades e dicas" announcements, separate from `push_enabled` (event reminders). `PATCH` accepts `push_enabled`, `email_events`, `email_marketing` and `push_marketing` (booleans, at least one, no other fields). Details and the announcement push payload (`{ kind: "announcement", communication_id }`) are in `push-contract.md`.

## Admin communications (web only)

Admin-only (session of an admin user, otherwise 401), under `/api/v1/admin/communications`; used by the admin page, not by the mobile app. `GET`/`POST` the collection; `GET`/`PATCH` `/:id` (drafts only for `PATCH`, `409 already_sent` otherwise); `GET /:id/recipients` returns `{ email, push }` pending recipient counts; `POST /:id/send-test` sends only to the calling admin; `POST /:id/send` requires `{ "confirm_recipients": { "email": n, "push": n } }` equal to the current counts (`409 recipients_changed` otherwise) and answers `409 already_sent` on a second send; `POST /preview` renders the e-mail HTML.

## Gift list member view

Lists are visible to everyone who shares at least one group with the owner; there is no per-group sharing step (decision changed on 2026-11-09, the sharing endpoints were removed).

| Endpoint                      | Body | Result                                                                                                                                                          |
| ----------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/gifts/visible`   | none | `200 { owners: { user_id, name, avatar_url, item_count }[] }`, lists the viewer may see, one per person                                                         |
| `GET /api/v1/users/:id/gifts` | none | `200 { owner: { id, name, avatar_url, birth_day, birth_month, birth_year }, groups: string[], items: Item[] }` (`groups` are the names of the groups in common) |

A viewer can read a list when the viewer and the owner share at least one group; leaving or deleting the last common group removes access immediately. `GET /api/v1/gifts/visible` only lists people whose list has items. Owners can always read their own list through `/users/:id/gifts`. Everything else, including unknown or malformed ids, returns `404` so the endpoint does not reveal who has a list. `PUT` returns `400` for groups the owner does not belong to, malformed ids or a missing `group_ids`. For members (not the owner) each item adds `availability` (`available`, `reserved` or `purchased`) and `reserved_by_me`.

### Reservations (members)

- `PUT /api/v1/gifts/:id/reservation` with `{ "status": "reserved" | "purchased" }` reserves the item or updates your own reservation; returns `{ item_id, availability, reserved_by_me }`. `409` with `reason: "taken"` when someone else holds it (concurrency-safe: one active reservation per item). `404` for the owner, people without access, unknown or malformed ids; `400` for an invalid status.
- `DELETE /api/v1/gifts/:id/reservation` cancels your reservation (`204`, `404` if you hold none).
- A reservation is cancelled when its holder can no longer see the list or deletes the account; a purchase is kept.
- Expiry: `GET /api/v1/notifications/expire-gifts` (cron, `CRON_SECRET`, daily). Seven days after the owner's birthday, purchased gifts are removed and the remaining reservations cleared, once per birthday (`gift_lists.expired_for`). Owners without a birthday are never expired.
