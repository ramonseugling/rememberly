# Account deletion

Implemented by [MOB-015](tasks/MOB-015-account-deletion.md). The existing `GET /api/v1/mobile/me` profile response remains compatible.

## HTTP contract

`DELETE /api/v1/mobile/me` requires a strict `Authorization: Bearer <session token>` header and `Content-Type: application/json`. Cookies never select the account. Send exactly:

```json
{ "password": "current account password", "confirmation": "DELETE" }
```

The password is checked exactly, including whitespace. Unknown fields, query parameters, incorrect confirmation text, missing/empty password, invalid JSON, non-JSON bodies, and bodies exceeding 16 KiB return 400. Passwords and tokens are never returned or included in failure logs.

| Status | Meaning                                                         | Native handling                                                 |
| ------ | --------------------------------------------------------------- | --------------------------------------------------------------- |
| 204    | Account and personal data deleted; response has no body         | Clear credentials and cached account data; show signed-out flow |
| 400    | Malformed confirmation request                                  | Correct the request                                             |
| 401    | Missing, malformed, expired, revoked, or unknown Bearer session | Clear invalid session and sign in again                         |
| 403    | Current password could not be confirmed                         | Preserve the session; allow retry                               |
| 409    | Account owns at least one group                                 | Preserve the session; require explicit group deletion first     |
| 500    | Unexpected failure; transaction rolls back                      | Preserve the session and allow retry                            |

Responses use `Cache-Control: no-store`, never set cookies, and use existing English mobile error envelopes. Authentication failures include the Bearer challenge. Other methods return 405 with `Allow: GET, DELETE`.

## Ownership and atomicity

The user explicitly selected **require owners to delete their groups first**. Account deletion never implicitly cascades owned groups. Membership in groups owned by other accounts is removed; those groups, their remaining members, and other accounts remain intact.

One PostgreSQL transaction locks the user before the current session, revalidates that exact session and the latest stored password, and checks `groups.created_by`. The user lock serializes password changes and competing FK inserts such as group ownership. If a concurrent ownership insert commits first, deletion sees the owned group and returns 409. If deletion commits first, a later FK insert cannot reference the deleted user.

Deleting the user cascades personal events, all finite/persistent sessions, group memberships, password-reset tokens, commemorative subscriptions, broadcast delivery records, and push preferences/devices/deliveries/attempts through existing foreign keys. Email-based OTP records are explicitly deleted case-insensitively, and error logs attributed to the account are explicitly deleted because those records lack user foreign keys. Any failure rolls all these operations back.

Aggregate cron records, unattributed error logs, other users' data, and shared group records are retained. This operation does not erase externally retained hosting logs or backups. No production data is used in verification.

## Remaining release work

Passwordless accounts currently return the same generic 403 as an incorrect password. Provider reauthentication or a verified recovery path is needed before offering deletion to those accounts. Native confirmation UI, public store-required deletion information, final privacy disclosures, backup retention policy, device validation, and abuse controls for password-confirmation endpoints remain separate release work. Login throttling alone does not throttle this endpoint.

## Temporary anti-abuse metadata

Login-limit buckets contain hashed identity/window keys rather than user foreign keys, raw email, or raw IP. They remain outside the account row cascade for anti-abuse purposes. Windows expire logically after 15 minutes; physical cleanup is bounded and opportunistic on later login activity, not a guaranteed wall-clock purge. Include this policy and any provider/backup retention in the final privacy disclosure rather than promising erasure of already delivered messages or external records.
