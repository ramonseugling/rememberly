# Session security follow-up

Status: implemented locally in [MOB-011](tasks/MOB-011-session-security.md). No public deployment or store release is implied.

## Atomic account recovery

Successful `POST /api/v1/password/reset` keeps its existing input and Portuguese web response, but now changes the password, marks the presented reset token used, and revokes all sessions for that user in a single PostgreSQL transaction. Revocation includes null-expiration mobile sessions and finite web sessions. Other users are unaffected.

A valid reset-token row is locked before use. Invalid, expired, or consumed tokens fail without changes. Two simultaneous uses of the same reset token cannot both succeed. Any failure in password update, consumption, or revocation rolls back the entire operation; a failed reset cannot partially change credentials or sessions. The existing password-reset request/email flow and its limits are unchanged.

Password-based session issuance authenticates as before, then locks the current user row with `FOR SHARE` in its insertion transaction and compares the current stored password hash with the authenticated snapshot. A reset updates that user row before revoking sessions, so issuance either completes before reset and is included in revocation, or observes the changed hash and rejects the stale password. Existing web errors and finite/persistent lifetime policies remain intact.

The reset path locks its own reset-token row, then the user through password UPDATE, then session rows. Session issuance locks the user before inserting a session. Other-session cleanup locks the user before the current session and other session rows. No cleanup/issuance path locks reset-token rows; this avoids an inverse reset-token/user lock dependency.

OAuth `createForUser` also serializes insertion with the user row using `FOR SHARE`, preserving account existence during insertion. It remains a fresh-provider-proof flow, not password authentication: a new OAuth login after a reset may legitimately issue a session. Requests authenticated before revocation are not retrospectively canceled.

## DELETE `/api/v1/mobile/sessions/others`

This operation lets a password-capable account revoke access from other devices while retaining its current session. It does not enumerate devices, identify a particular lost device, or delete the account.

```http
DELETE /api/v1/mobile/sessions/others
Authorization: Bearer <current-session-token>
Content-Type: application/json
```

```json
{
  "password": "current-password-example"
}
```

The body must be a JSON object containing only a nonempty string `password`; preserve whitespace when comparing it. Reject unknown fields, query parameters, invalid JSON, incorrect media types, and bodies larger than 16 KiB. Never accept target user IDs, session IDs, or lifetime controls.

Require exactly one strict Bearer credential using the existing mobile parser: case-insensitive scheme, 96 lowercase hexadecimal token, and no extra credentials. Cookies never select identity or provide fallback. Credentials are not accepted from URLs or JSON. Missing/malformed Bearer returns the existing session 401 envelope. After syntactic credential/body validation, the model verifies current session validity and the latest stored password together under transaction locks. Wrong passwords, revoked/expired/unknown sessions, or null-password accounts cannot change sessions.

Success: **204**, empty body, no `Set-Cookie`. Revoke every other currently active session for the authenticated user, including persistent sessions, while preserving the exact presented valid token. Already expired sessions remain untouched. Repeating the operation with the surviving credential and correct password returns 204 without further changes. New logins after the cleanup commit remain possible and require their own valid proof.

Password confirmation is required for every cleanup request. Null-password/Google-only accounts return the same generic 403 confirmation failure as a wrong password; there is no simulated OAuth reauthentication. A future provider reauthentication contract is needed to enable this action for those accounts. A forgotten password uses account recovery, which revokes every session including the current one.

## Errors and transport

All responses include `Cache-Control: no-store`. No response sets cookies or returns passwords/tokens/session details. Use the existing `{ name, message, action, status_code }` envelope with English messages for this new route. Every 401 includes `WWW-Authenticate: Bearer realm="rememberly"`.

| Case                                                      | HTTP/name                   | Message                                  | Action                                                            |
| --------------------------------------------------------- | --------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| Invalid confirmation input or query                       | 400 / ValidationError       | Invalid password confirmation request.   | Send only your current password as JSON without query parameters. |
| Missing/malformed Bearer                                  | 401 / UnauthorizedError     | A valid Bearer session is required.      | Sign in and send your session token in the Authorization header.  |
| Invalid transactional session                             | 401 / UnauthorizedError     | A valid Bearer session is required.      | Sign in and send your session token in the Authorization header.  |
| Wrong password or passwordless account with valid session | 403 / ForbiddenError        | Unable to confirm your current password. | Confirm your current password and try again.                      |
| Unsupported method                                        | 405 / MethodNotAllowedError | Method not allowed.                      | Use DELETE.                                                       |
| Unexpected/database failure                               | 500 / InternalServerError   | An unexpected error occurred.            | Try again later.                                                  |

For 405, set `Allow: DELETE`; GET, POST, PATCH, HEAD, and OPTIONS are unsupported. HTTP suppresses HEAD bodies. Missing/malformed credentials are rejected before parsing the body; with a syntactically valid token, malformed input returns 400 before transactional account lookup. A 403 confirmation failure preserves the current valid session and must not trigger client logout; reserve 401 for invalid session credentials. Failure messages never identify another account or distinguish a null-password account from a wrong password. Server logging records only static route/method context, never raw credentials, query strings, or database errors.

## Evidence and remaining boundaries

Real PostgreSQL tests cover transaction rollback using a temporary failing revocation trigger, concurrent token replay, and deterministic stale-password issuance races for both finite and persistent sessions. Trigger and lock fixtures exist only in the disposable test database; no fault-injection route is added.

Account deletion is now implemented separately in MOB-015/MOB-018/MOB-019 with an explicitly accepted owned-group block. This work does not add a device list, device-token push cleanup, automatic token rotation, authentication rate-limit infrastructure, or a native settings screen in this original task. Subsequent tasks now provide native controls and durable password-login limits; password-confirmation abuse controls remain separate. Abuse controls covering all password-login/confirmation surfaces remain a separate release requirement. Local client logout alone still cannot prove server revocation when offline.
