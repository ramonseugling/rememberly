# MOB-019: Public web account deletion

Status: done

## Outcome

Provide a public Rememberly account deletion URL that users can reach outside the native app, supporting Google Play account-deletion preparation. This task implements the web flow; store-policy approval and production publication remain separate release checks.

## Scope and context

- Public `/account-deletion` page explains removed and retained records, permanent deletion, password confirmation, and the owned-group restriction from [MOB-015](MOB-015-account-deletion.md).
- Unauthenticated users use the existing `/login?next=/account-deletion` route; existing password recovery is linked. Signed-in users confirm their current password, type DELETE, and explicitly acknowledge permanent deletion.
- New `POST /api/v1/account-deletion` accepts exactly the JSON deletion confirmation from the existing [backend contract](../account-deletion.md).
- The endpoint selects only the exact `session_token` cookie, rejects duplicate cookies and Bearer-only authorization, and invokes the existing transactional model. No raw token or password hash enters page props.

## Request security

The server requires an exact `Origin` matching the origin of configured `APP_URL`; it never trusts the request Host to determine the allowed origin. Invalid/missing `APP_URL`, missing/null/foreign Origin, and conflicting Fetch Metadata are rejected with 403. If `Sec-Fetch-Site` is present, it must be `same-origin`. JSON-only input, strict schema, a 16 KiB body bound, and rejected query parameters add request validation. No CORS permission is granted.

A browser same-origin form request supplies Origin automatically. Deployment must configure `APP_URL` to the canonical HTTPS origin from which users access the page. Alternate domains require redirecting to that origin before deletion; forwarded headers do not broaden trust.

The page and endpoint use `Cache-Control: no-store`. A successful response is 204 and expires the HttpOnly, SameSite=Lax web cookie, adding Secure in production. Wrong/passwordless confirmation returns 403, owned groups return 409, and valid sessions remain intact for those failures. Invalid sessions return 401. Unknown failures return a generic 500 without logging bodies, headers, credentials, or raw error details. Existing user-update APIs and the strict Bearer native endpoint are unchanged.

## Acceptance criteria

- [x] Public page describes personal data deletion and retained service records, and links existing login and recovery.
- [x] Authenticated SSR whitelists only name/email; confirmation requires password, DELETE, and explicit acknowledgement.
- [x] Same-origin, cookie-only deletion preserves native account ownership and transaction rules.
- [x] Real-service web/native deletion regressions, types, formatting, and documentation links pass.

## Verification and completion

- Tests use the disposable local PostgreSQL schema and live Next server; no production account or email provider is used.
- Checks: focused web and native deletion suites pass, 2 suites / 45 tests, including SSR safe projection, Origin/Fetch Metadata enforcement, cookie-only identity and duplicate-cookie denial, malformed requests, 403/409 preservation, sanitized failure rollback, and successful session revocation/account isolation. Root TypeScript, touched-file Prettier, relative documentation links, and diff whitespace checks pass.
- Release limits: fresh password reauthentication is the current MVP scope. Provider reauthentication, precise hosting/backup retention disclosure, confirmation abuse controls, real browser/device review, deployed public URL verification, and store console configuration remain release work.
- Next action: fourth exclusive database window is released. Parent can integrate page discoverability and run combined wave regression checks; review the public flow in a real browser before deployment.
