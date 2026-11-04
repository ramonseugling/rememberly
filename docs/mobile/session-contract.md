# Mobile session contract

Status: implemented and locally verified in [MOB-002](tasks/MOB-002-session-api.md). Not deployed or approved for public release.

Source review: `pages/api/v1/sessions/index.ts`, `models/session.ts`, `models/authentication.ts`, `infra/controller.ts`, `lib/validators.ts`, the sessions migration, and existing session integration tests. Persistent mobile sessions require a forward migration and a compatible session-lookup change. No new authentication provider is required.

## 1. Route and compatibility

Add `POST`, `GET`, and `DELETE /api/v1/mobile/sessions`. Use the existing session model and database. This route controls token delivery and transport; it does not create a second user system or restrict issued tokens to mobile-only resources.

Keep `/api/v1/sessions` unchanged: web POST returns `{ user }` and sets a cookie; web GET reads that cookie and returns `{ user }` or `401 { user: null }`; web DELETE clears the cookie and returns 204, even without a session. Preserve existing web error behavior, including the Google-only account message. No token is added to web JSON responses.

Mobile responses never set, clear, or refresh cookies. Add `Cache-Control: no-store` to all responses on the new route, including errors. Successful JSON responses use `Content-Type: application/json`; a 204 response has no body.

## 2. Credential and lifetime

- A token is the existing opaque, cryptographically random 48-byte value encoded as 96 lowercase hexadecimal characters. It is not a JWT. All example tokens below are fictitious.
- Each successful login creates a new session for that user. Existing sessions remain valid. Repeated POST requests are separate logins, not idempotent retries.
- Mobile sessions have no scheduled or inactivity expiration: persist and return `expires_at: null`. Users remain signed in until the session is revoked, the account is deleted, or the credential is lost or rejected. Persistence does not guarantee access forever. Existing web/password and web/OAuth creation retain their 30-day expiration.
- The shared lookup accepts an existing user/session when `expires_at IS NULL OR expires_at > NOW()`. A non-null expiration at or before now is invalid. Revoke persistent sessions by setting `expires_at = NOW()`, reusing the existing revocation mechanism. Never interpret a missing/invalid credential or failed lookup as a persistent session.
- There is no refresh endpoint or refresh token in this milestone. On an authenticated 401, the app clears its local credential/account cache and returns to login. Network failures and 5xx errors do not by themselves invalidate a session.
- The app stores the token in secure platform storage and sends it only to its configured trusted HTTPS API origin. It must not forward it to redirects or third-party hosts. Local HTTP is allowed only for isolated development.
- Tokens, passwords, Authorization headers, and credential-bearing request/response bodies must not appear in logs, analytics, URLs, or task records. Session storage hardening such as hashing tokens at rest is a separate change; do not claim the current database already does it.

### Persistence migration and deployment

Add a forward migration making `sessions.expires_at` nullable, with null explicitly representing no scheduled expiration. Do not change existing rows or applied migrations, use PostgreSQL infinity, or invent a far-future date. Only an explicit server-side mobile creation path issues null expiration; existing `create`/`createForUser` web defaults remain finite. Request fields cannot choose this policy. The response field is typed `string | null`; normal mobile login returns null, while GET can return an ISO 8601 UTC expiration for a finite session presented as Bearer.

Deploy the nullable schema and null-aware lookup before enabling persistent issuance. Older application instances reject null-expiry sessions, so complete the compatible-reader rollout before issuing them. Do not silently roll back to an old reader while persistent sessions exist. No token rotation or schema backfill is required by this milestone.

## 3. Credential selection

| Request           | New mobile session route                                         | Existing shared protected APIs                                         |
| ----------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Bearer only       | GET/DELETE use Bearer                                            | Existing controller uses Bearer                                        |
| Cookie only       | GET returns 401; DELETE returns 401; neither uses the cookie     | Existing controller uses the cookie                                    |
| Bearer and cookie | GET/DELETE use only Bearer, even if it is invalid; ignore cookie | Preserve current cookie-first behavior, even if that cookie is invalid |
| Neither           | GET/DELETE return 401                                            | Existing unauthorized behavior                                         |

The mobile HTTP client must not send or persist web session cookies. This avoids differing identities between the session route and shared resource routes. Do not silently change global credential precedence in this task. Test the mixed-credential behavior explicitly, including different users and an invalid preferred credential.

POST is a public password login: it ignores preexisting cookies and Authorization and authenticates only the supplied email/password. It never revokes or mutates a credential sent incidentally with that request.

For GET/DELETE, require exactly one Authorization value containing the Bearer scheme (case-insensitive), at least one ASCII space, and one token matching the format above. Trim surrounding whitespace. Reject empty tokens, other schemes, embedded token whitespace, extra credentials, comma-joined values, and malformed tokens with 401. Do not fall back to cookies or accept credentials from query strings or the request body. Do not harden the shared controller parser as an incidental change.

## 4. POST: sign in

Request:

```http
POST /api/v1/mobile/sessions
Content-Type: application/json
```

```json
{
  "email": "alex@example.com",
  "password": "example-password"
}
```

Input follows the existing session schema: email is a string, trimmed and validated as an email; password is a nonempty string and is not trimmed. User lookup remains case-insensitive. Unknown object fields are ignored, matching the existing Zod object behavior. Client-provided user IDs, roles, lifetimes, and tokens cannot influence session creation. Requests require `Content-Type: application/json` (optional parameters accepted) and at most 16 KiB of UTF-8 JSON. Wrong media types, oversized bodies, malformed JSON, or missing/wrong-type/invalid required values return 400. No new password policy is applied at login.

Success: 201, no `Set-Cookie` header.

```json
{
  "token": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "token_type": "Bearer",
  "expires_at": null,
  "user": {
    "id": "11111111-1111-4111-8111-111111111111",
    "name": "Alex Example",
    "email": "alex@example.com"
  }
}
```

The null expiration denotes a persistent mobile session; return actual database values. Whitelist response fields: do not spread the session row, password hash, internal roles, or database metadata into JSON. `user.email` is the canonical stored email. User IDs are UUID strings; name/email are strings.

Invalid email/password combination, unknown account, or an account without a password all return the same 401 error body. Do not reveal whether a mobile password-login attempt belongs to a Google-only account. Catch only expected authentication failures for this normalization; database/unexpected failures remain server errors. Native social login is out of scope, and Google-only users cannot use password login until a separate supported flow exists.

## 5. GET: inspect the current session

```http
GET /api/v1/mobile/sessions
Authorization: Bearer 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

Success: 200, no token echoed and no `Set-Cookie` header.

```json
{
  "expires_at": null,
  "user": {
    "id": "11111111-1111-4111-8111-111111111111",
    "name": "Alex Example",
    "email": "alex@example.com"
  }
}
```

Return the current user's name/email from the existing joined lookup, not client input or stale login data. This minimal identity is not the full profile API; birthday and preferences belong to a later contract. GET never creates a session or changes its lifetime policy. A valid finite session still returns its persisted UTC expiration string.

Missing, malformed, unknown, expired, revoked, or orphaned credentials return the same session 401 body. Do not return `{ user: null }` on the new route; that response remains a web-route exception.

## 6. DELETE: revoke the presented session

```http
DELETE /api/v1/mobile/sessions
Authorization: Bearer 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

With a syntactically valid token, return 204 with no body or `Set-Cookie` header after the database operation completes. Revoke only the session matching that token. Never accept a target user/session ID or revoke all sessions implicitly.

Repeated deletion, expired tokens, and well-formed unknown tokens return 204 without revealing existence. Missing/malformed Authorization returns the session 401 body, even with a valid cookie. DELETE is therefore idempotent for a well-formed credential. Database failures return 500, not a false success.

After successful revocation, subsequent authenticated requests using that token must fail; another session for the same user and any incidental cookie remain unaffected. This is not a guarantee of canceling requests already authenticated before the revocation completed.

Client logout clears local credentials and account-specific cache immediately. When reachable, call DELETE using the captured credential before discarding it. If revocation cannot be confirmed, do not claim server-side logout succeeded; a persistent token remains potentially valid until explicitly revoked or its account is deleted; local deletion alone does not invalidate it on the server. Device-token detachment is required when push exists, but is not part of this backend milestone.

## 7. Errors

Use the existing JSON envelope with `name`, `message`, `action`, and numeric `status_code`. Clients branch on HTTP status and error name, not message text. The new route's messages are English; existing web messages remain unchanged. The examples below define the expected text for the new route.

| Case                               | HTTP | Name                  | Message                             | Action                                                           |
| ---------------------------------- | ---- | --------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| Invalid input/JSON                 | 400  | ValidationError       | Invalid login request.              | Provide a valid email address and a nonempty password.           |
| Failed password authentication     | 401  | UnauthorizedError     | Invalid email or password.          | Check your credentials and try again.                            |
| Invalid/missing session credential | 401  | UnauthorizedError     | A valid Bearer session is required. | Sign in and send your session token in the Authorization header. |
| Unsupported method                 | 405  | MethodNotAllowedError | Method not allowed.                 | Use GET, POST, or DELETE.                                        |
| Unexpected failure                 | 500  | InternalServerError   | An unexpected error occurred.       | Try again later.                                                 |

For every 401, set `WWW-Authenticate: Bearer realm="rememberly"`. For 405, set `Allow: GET, POST, DELETE`. HEAD/OPTIONS are unsupported by this route contract; test actual framework behavior during implementation. No CORS preflight support is required for the native client. Do not expose internal failure details in 500 responses.

Example session failure:

```json
{
  "name": "UnauthorizedError",
  "message": "A valid Bearer session is required.",
  "action": "Sign in and send your session token in the Authorization header.",
  "status_code": 401
}
```

Implement any necessary error serialization locally to the new route or through additive helpers; do not globally translate existing errors or change web response contracts. Framework-rejected malformed JSON may need route-specific parsing to satisfy this envelope and no-store requirement; verify this rather than assuming the default Next.js parser does so.

## 8. Persistent-session security and release boundary

Persistent login improves continuity, but a stolen token also has no automatic expiration. Secure device storage and working server-side revocation are essential. Account deletion removes sessions through the existing foreign-key cascade. MOB-011 now revokes all account sessions atomically on successful password reset and provides fresh-password other-session cleanup, including a native Profile action. See [session security](session-security.md). These changes are locally verified and not yet deployed; rate limiting and account deletion remain separate requirements. Sensitive account operations may require fresh authentication without routinely signing the user out.

This contract does not assert that rate limiting already exists. Before exposing mobile login publicly, establish and verify an abuse-control policy covering the login surface, including bypass through the existing web route. Limit attempts without account enumeration and document the limiter's 429/Retry-After behavior in a separate security task before release. Do not introduce an unreliable per-process limiter as an incidental serverless implementation.

MOB-002 can be validated locally without external email or a released app. Production launch is not authorized by this specification or completion of its implementation task. See the [MOB-002 test matrix](tasks/MOB-002-session-api.md) for required evidence.
