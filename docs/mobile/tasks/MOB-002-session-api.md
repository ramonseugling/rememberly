# MOB-002: Implement the mobile session API

Status: done

## Outcome

Implement the [mobile session contract](../session-contract.md) so a client can obtain, inspect, use, and revoke an existing-model session without changing web login behavior.

## Context and dependencies

- Depends on completed [MOB-001](MOB-001-session-contract.md).
- Start with `pages/api/v1/sessions/index.ts`, `models/session.ts`, `models/authentication.ts`, `infra/controller.ts`, validation/errors, and the existing session tests.
- Tests require the disposable local PostgreSQL database, migrations, `.env.development`, and Next.js on port 3000. No real outbound email or provider credentials are needed; create fixtures directly with repository helpers/SQL and hash passwords using the model.

## Scope

- Add `pages/api/v1/mobile/sessions/index.ts` and focused real-service integration tests.
- Reuse the existing session model. Add the forward nullable-expiration migration, a null-aware shared lookup, and explicit persistent creation for mobile. Preserve finite web creation defaults and existing rows. Follow the compatible-reader deployment order in the contract.
- Implement the canonical contract, including persistent mobile sessions, strict Bearer handling, cookie isolation, no-store, English error responses, and non-enumerating password failures.
- Ensure malformed JSON satisfies the specified response rather than leaking a framework default. Keep any parser changes local to this route.
- Update documentation to distinguish implemented and planned behavior after checks pass.

## Outside this task

- Expo setup, mobile UI, OAuth, refresh tokens, profile/agenda APIs, unrelated migrations, global cookie/Bearer precedence changes, and unrelated baseline fixes.
- Rate-limiter infrastructure or public rollout. Track and resolve the contract's abuse-control release requirement separately.

## Acceptance and integration-test matrix

| Area                   | Required evidence                                                                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login success          | 201 and exact field projection; 96-character random-format token; persisted token/user/null expiration agree; no cookie; repeated logins create distinct sessions                                   |
| Input                  | Missing/empty/wrong-type fields, invalid email, malformed JSON → specified 400; trimmed email/case-insensitive lookup; password whitespace preserved; unknown fields cannot control identity/expiry |
| Authentication failure | Unknown user, wrong password, and null-password account → same 401; no session created; unexpected database failure is not mapped to 401                                                            |
| Session lookup         | GET returns current identity and null for persistent expiry; sessions older than 30 days remain valid; finite future expiry is serialized; finite expiry at/before now is invalid                   |
| Credential parser      | Missing/empty/other scheme/malformed/multiple/extra values rejected; case-insensitive scheme and surrounding whitespace accepted as specified                                                       |
| Cookie isolation       | Cookie-only GET/DELETE denied; conflicting cookie user never wins; invalid Bearer never falls back to valid cookie; POST uses body credentials only                                                 |
| Revocation             | 204 empty body; subsequent GET and protected resource reject token; repeated/expired/well-formed unknown deletion → 204; missing/malformed token → 401                                              |
| Isolation              | Deleting one session preserves another session for the same account and any incidental cookie session                                                                                               |
| Shared API             | New login token can read a protected endpoint such as `/api/v1/events`; verify cookie-first behavior remains unchanged when both credentials reach that existing route                              |
| Headers/errors         | No-store on success and errors; no Set-Cookie; 401 challenge; unsupported methods/Allow; expected English envelope and no internal details                                                          |
| Schema/issuance        | Forward migration preserves existing finite rows; shared APIs accept persistent sessions; web password and web OAuth session creation remain finite; clients cannot request lifetime policy         |
| Web regressions        | Existing session POST/GET/DELETE and Google-only account tests pass; web response bodies/cookies remain unchanged                                                                                   |

Use null expiration, old creation timestamps, and synthetic past/future finite expiration values and database assertions, not a wait for real expiration. Do not run database-clearing test suites concurrently. Do not disable assertions or add production fault-injection APIs to manufacture error responses; verify exceptional paths with an appropriate isolated technique or document a real verification limitation.

## Verification

Start with new suites, then all existing session suites and the protected-resource suites affected by helpers. Use the Node 24 workaround from the root instructions. Run type checking and distinguish documented baseline errors from new errors; format touched files and inspect the diff. Broaden further only if shared behavior changes.

## Completion record

- Result: implemented the mobile session route, explicit persistent session creation, nullable-expiration migration, and null-aware shared lookup. Web issuance and credential precedence remain unchanged.
- Checks: 14 integration suites / 111 tests passed, covering mobile sessions, migration preservation/repeatability, legacy web sessions, and event/group authorization. Live-database failure tests verified sanitized 500 responses for login, lookup, and revocation. Type checking remains blocked by the nine previously documented diagnostics in unrelated tests; no new-file diagnostics were reported. Touched-file formatting and relative links passed.
- Blockers: no local implementation blocker remains. Public login abuse controls, account-recovery revocation, and lost-device revocation remain release requirements. No deployment, public release, native build, or store submission was performed.
- Next action: specify profile and unified-agenda retrieval contracts, then implement them as a bounded API task. Follow the compatible-reader rollout order before enabling persistent session issuance in production.
