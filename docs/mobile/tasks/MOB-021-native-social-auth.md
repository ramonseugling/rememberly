# MOB-021 — Native social authentication backend foundation

Status: implemented backend foundation; native integration and release validation pending.

## Outcome

Added Google/Apple challenge-bound ID-token exchange, explicit server audience allowlists, strict official JWKS verification, nonce hashing/expiry, transactional single use and unique provider-subject ownership. New identities create persistent native Bearer sessions and opt out of marketing by default. Existing-email collisions fail with 409 and require future verified linking. Existing web Google and password routes are unchanged.

Contract and configuration: [Native social authentication](../native-social-auth.md).

## Scope boundaries

No automatic linking, native provider SDK/buttons, live provider credentials, authorization redirects, Expo tunnels, provider reauthentication or release claim. Existing web Google-only users need future explicit linking for native login. Social-only account deletion and session revocation still need provider reauthentication support before rollout.

## Verification

Passed locally on Node 24:

- Three dedicated suites / 49 tests: ephemeral RSA/JWKS verification, real PostgreSQL challenge/identity/session transactions, and HTTP handler validation with real durable rate limits.
- Existing session-security and login-rate-limit model regressions passed in a three-suite / 26-test run that also included the new social transaction suite.
- Root TypeScript and formatting checks for all task-owned files.

Tests use ephemeral keys and the disposable local PostgreSQL database. No production data or real provider login is used. The HTTP success flow is tested at the model boundary with cryptographically signed fixtures; HTTP handlers are exercised directly for request limits and errors. Real provider/JWKS network access, an interactive SDK, and device behavior remain unverified.

## Next task

Implement native SDK integration against the documented nonce/exchange contract after real audience configuration. Design authenticated account linking and fresh provider reauthentication before enabling social-only account creation in a released app.
