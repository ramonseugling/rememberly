# MOB-006: Connect native login and persistent sessions

Status: done

## Outcome

An existing user can sign in from the app, load their session identity after reopening, and log out with local cleanup and server-side revocation.

## Context and dependencies

- Requires completed [MOB-004](MOB-004-expo-foundation.md) and the implemented [session contract](../session-contract.md).
- Independent of [MOB-005](MOB-005-data-api.md): use the existing session identity response, not unimplemented profile/agenda APIs.
- Own `mobile/**`; coordinate shared documentation changes with the API implementer. Do not run backend schema-clearing suites concurrently.

## Scope

- Add Expo-compatible secure credential storage and a small API client restricted to the configured trusted origin, with no cookies or credential forwarding to redirects/third parties.
- Implement login and authenticated navigation with loading, failure, retry, and session-rejection states. Never show a password-login option as working for Google-only accounts.
- Restore stored credentials on startup and validate through the session endpoint. Do not discard them on a network/5xx failure; do clear rejected credentials and account-specific state.
- Logout captures the credential for revocation, clears local session/cache, and reports unconfirmed server revocation honestly without retaining the token in ordinary storage.
- Add meaningful tests using the actual chosen client stack; verify the real API journey with isolated development accounts. Do not introduce production hooks for test overrides.

## Outside this task

- Registration, OAuth, full profile/agenda flows, push, billing, account deletion, store signing, and public rollout.
- Backend contract changes or unresolved production security requirements.

## Acceptance criteria

- [x] Valid login persists the credential securely and shows the actual session identity.
- [x] Restart/restoration, invalid credentials, revoked sessions, and network outages have correct distinct behavior.
- [x] Logout prevents local access and revokes the presented server session when reachable; switching accounts leaks no prior data.
- [x] No credentials appear in logs, URLs, public config, or ordinary caches; no web cookies are used.
- [x] Type/config/behavior checks pass and the scope of device versus non-device validation is recorded accurately.

## Completion record

- Result: implemented password login, protected native navigation, session identity, SecureStore persistence scoped to environment/origin, startup and foreground validation, local cleanup, revocation/retry, and stale-request/account-switch protection.
- Checks: reproducible npm ci (516 packages), mobile type checking, three configuration tests, 15 session/controller/HTTP tests, formatting, and both iOS/Android Hermes JavaScript exports passed. The actual pure client/controller also passed a live API smoke using Node transport and memory storage: disposable-user login, identity, token restoration, invalid-password denial, logout, and confirmed server revocation. The fixture was removed. Backend regressions independently passed 19 suites / 190 tests.
- Limitations: no signed build or real-device validation. Native keychain behavior, rendering, foreground transitions, and transport must still be verified on iOS/Android with a supported device-reachable development/staging API. Node-memory smoke is not native SecureStore validation; localhost is not physical-device connectivity. Existing production security and release requirements remain tracked in the session contract.
- Next action: connect native feature screens to the now-implemented data APIs, with account-specific data cleanup, and prepare real-device development-build validation. No deployment, commit, or store submission was performed.
