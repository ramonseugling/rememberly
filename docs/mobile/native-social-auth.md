# Native social authentication foundation

This backend foundation supports Google and Apple ID-token verification. Native SDK integration, provider configuration, real interactive login, account linking and provider reauthentication are not implemented. It does not establish native Google/Apple release readiness. Existing password and web Google login remain unchanged.

## Account ownership and collisions

A provider identity is identified by the unique pair `(provider, subject)`, obtained only from a verified signed token. A mapped identity always returns its existing Rememberly user; a later provider email change cannot reassign ownership or alter the user's email.

For a first-time identity, a verified provider email creates a new user only if no existing Rememberly account owns that email (case insensitive). New accounts have no password and `marketing_consent=false`. A collision returns `409 AccountLinkRequiredError`; no account, mapping or session is created, and the challenge remains unused. Verified email alone never links an existing account.

This includes existing password accounts and legacy web Google-only accounts, because the legacy flow did not persist Google subjects. Those users can continue with their existing web sign-in. Native access for those accounts requires a future verified linking flow; it must not be solved by silently linking emails. Apple relay addresses are retained as verified provider addresses and never merged with another address.

Future linking must require an authenticated current session and fresh proof for the existing account, bind the challenge to purpose `link` and the authenticated actor, and independently verify the provider proof. The current database constraint allows only `login`, so a login challenge cannot be used for linking. Provider reauthentication for deletion/revocation is a separate pending contract.

## Configuration

Server-only environment variables:

| Variable                   | Value                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `GOOGLE_NATIVE_CLIENT_IDS` | Comma-separated explicit Google client audiences accepted for the native flow.                    |
| `APPLE_NATIVE_CLIENT_IDS`  | Comma-separated explicit Apple client audiences, such as the configured native bundle identifier. |

Use real registered identifiers only. There is no default, wildcard, or fallback to web `GOOGLE_CLIENT_ID`. Missing or malformed provider configuration returns a sanitized `503`. These identifiers are public audiences, not signing credentials. Never put provider client secrets or Rememberly sessions in mobile configuration or redirect URLs.

The verifier uses maintained `jose`, RS256 only, fixed official JWKS URLs (`https://www.googleapis.com/oauth2/v3/certs` and `https://appleid.apple.com/auth/keys`), Google issuers `https://accounts.google.com` / `accounts.google.com`, and Apple issuer `https://appleid.apple.com`. The runtime must allow HTTPS access to those JWKS hosts. There is no environment or HTTP override for issuer/JWKS URLs.

Tokens require `iss`, `aud`, `sub`, `exp`, `iat` and `nonce`, maximum age ten minutes and five seconds clock tolerance. Multi-audience tokens require an allowed authorized party (`azp`). Google requires a verified email; Apple accepts boolean `true` or its documented string `"true"`. An already mapped Apple subject can sign in when subsequent tokens omit email. New Apple identities require a verified email.

## HTTP contract

Both endpoints accept JSON, reject query parameters and unknown body fields, support POST only and send `Cache-Control: no-store`. No cookies are created. All calls share the existing durable IP login budget (100 per fifteen minutes); exchanges with verified email also consume its existing ten-per-fifteen-minute email budget. Rate limits return the existing `429` / `Retry-After` contract. Limiter failures fail closed with `503`.

1. `POST /api/v1/mobile/auth/challenges` with `{ "provider": "google" | "apple", "purpose": "login" }` returns `201` and `{ "challenge_id": "uuid", "nonce": "64-character hex", "expires_at": "ISO date", "purpose": "login" }`.
2. Start the official provider interaction and pass the returned nonce **exactly** as its OIDC nonce. The signed ID token must contain that exact value. The selected SDK must offer an API that produces that exact nonce claim. An SDK that always hashes its input cannot satisfy this contract by adapting its input: doing so would require finding a hash preimage. Supporting such an SDK requires deliberately extending the provider challenge/verification contract and tests. The future native implementation must verify the selected SDK's nonce behavior on a device. Use SDK state/PKCE protections where applicable; do not use a web-session redirect containing a Rememberly token.
3. `POST /api/v1/mobile/auth/exchange` with `{ "provider": "google" | "apple", "challenge_id": "uuid", "identity_token": "signed ID token" }` returns `201` with the existing native session shape: `{ "token": "opaque server token", "token_type": "Bearer", "expires_at": null, "user": { "id": "uuid", "name": "name", "email": "email" } }`.
4. Store the opaque token in native secure storage and use the existing mobile Bearer API. Discard provider tokens and pending challenges after completion/cancellation; do not persist them as Rememberly credentials.

The nonce is random, server generated, hashed at rest and expires after five minutes. Provider and login purpose must match. Challenge consumption, new user/identity creation and persistent-session insertion commit in one transaction. Concurrent replay has one winner. Expired challenge cleanup deletes at most 100 rows per creation. Failures roll back challenge consumption, allowing a legitimate retry until expiry; a fresh challenge is recommended after `401`.

Responses use `{ name, message, action, status_code }`: invalid request `400`, invalid/expired/replayed proof `401`, existing-email collision `409`, durable limits `429`, unavailable provider/configuration `503`, unexpected failure `500`. Neither raw tokens, nonce values, provider payloads nor low-level verification/database exceptions are logged or returned. The input JSON body is capped at 20 KiB and the identity token at 16 KiB.

## Validation and remaining work

Tests generate ephemeral RSA keys and local JWKS in memory; they do not use external credentials or a public test issuer. A server-only resolver injection enables cryptographic tests without making provider trust configurable over HTTP. Real PostgreSQL tests cover transactional replay, concurrency, nonce/provider isolation, collision denial, rollback, cleanup and identity deletion cascades.

Before native rollout: configure real audiences, implement official interactive SDK flows, verify provider nonce handling and cancellation/state behavior, implement explicit account linking and fresh provider reauthentication, validate on iOS/Android devices and confirm store/privacy requirements. The existing account-deletion/revocation UI currently requires a password, so new social-only users need the pending provider reauthentication work before release.
