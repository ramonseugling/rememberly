# Validation and automation

## Current evidence versus historical observations

Onboarding on 2026-10-30 reported 208 passing and 8 failing tests (35 passing and 5 failing suites). Missing Resend credentials affected email flows. Type checking reported unresolved `lib/*` imports in tests and possibly undefined birthday assertions. The production build failed downloading Google fonts. Network requirements and setup/start instructions were saved in the environment draft; a draft save does not prove runtime application or publication.

These are historical observations, not results of the documentation task. Reproduce relevant failures before fixing them. Never call a failing suite green by omitting assertions or claiming unavailable services work. Avoid real outbound email to generated test addresses; establish a controlled test-delivery strategy before enabling email credentials for a full suite.

## MOB-002 implementation evidence

The targeted run passed 14 suites / 111 tests against live Next.js and local PostgreSQL: mobile lifecycle and parser cases, real database failure responses, forward migration preserving existing finite rows, repeated migration execution, legacy web session flows, and event/group authorization. Type checking still reports the nine documented baseline diagnostics in unrelated tests; changed implementation and test files produced no new diagnostics. No full-suite rerun, production build, deployment, or device validation was performed for this backend task.

## Parallel foundation evidence

MOB-003 data contracts passed document/link/JSON checks; their endpoints are not implemented. MOB-004 independently installed the Expo project and passed mobile types, three actually executed configuration tests, formatting, offline SDK compatibility checks, and iOS/Android Hermes JavaScript exports. Online Expo API dependency validation was blocked by proxy access; no signed or device build was claimed. Root isolation retains all 42 backend suites, including mobile API tests; the focused session run passed 40 tests and the nine root type diagnostics exactly match the pre-bootstrap baseline. Root package files remain unchanged.

## Parallel data and session implementation evidence

MOB-005 passed 19 suites / 190 backend tests, plus a final 40-test session regression after strengthening an exact error-envelope assertion. New read APIs and calendar calculations were verified with real local services and isolated processes in four timezones. Root type checking retains the same nine historical diagnostics.

MOB-006 passed independent npm ci, mobile types, three config tests, 15 session/client behavior tests, formatting, and both platform Hermes exports. The actual pure client/controller passed local live-API login/restoration/logout/revocation smoke with Node fetch and memory storage; its disposable account was deleted. Neither this smoke nor JavaScript exports establish native keychain/UI/transport behavior on real devices. Database ownership was sequential between backend suites and client smoke. No deployment or signed native build was performed.

## Verification ladder

| Change                    | Start here                                                        | Broaden when needed                                         |
| ------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| Documentation             | Format touched files and check local links                        | No app build required                                       |
| API/model                 | Relevant existing suite plus meaningful new behavior/denial tests | Full affected API suite and web regression checks           |
| Shared types/validation   | Type checks and affected consumers                                | Both client checks once mobile exists                       |
| Mobile UI                 | Types and focused behavior checks using the installed stack       | Device checks for native behavior                           |
| Auth/push/links           | Contract tests and device development build                       | Both platforms, cold start, permission/expiry/failure paths |
| Native config/SDK/signing | Compatible remote build                                           | Install and verify the resulting artifact                   |
| Release                   | Release-build smoke and full release checklist                    | Store beta and staged rollout                               |

Existing commands and prerequisites are in the root `AGENTS.md`. No mobile command exists yet. Add validated mobile commands at bootstrap instead of inventing passing placeholder scripts.

Integration tests use a disposable local database and run sequentially. Do not run parallel suites against the same schema. A server PID or port is not functional evidence: make representative HTTP requests or run real integration tests. Inspect exit statuses; keep failures, skips, and unrun checks distinct.

## Automation to add after the first workflow is proven

1. Independent mobile scripts for type checking, focused tests, and development startup.
2. CI jobs scoped to web/API/mobile paths and their actual dependencies; root checks must exclude native-only source where appropriate.
3. Service startup/readiness helpers only if existing repository scripts are insufficient.
4. A repeatable installed-build smoke checklist for identity, data, links, and push.
5. Optional skills that invoke these verified commands and report evidence without duplicating project rules.

Do not add a new test framework, dependency, task runner, agent topology, or remote build per task without a concrete need. Log verbose output to a local file when useful; inspect the relevant failure excerpt rather than repeatedly dumping entire logs. Do not include credentials in logs or persisted task records.

## Required high-risk cases

- Sessions: absent/invalid/expired credential, revocation, account switching, cookie compatibility, and cross-user access denial.
- Groups: owner/member boundaries, invitation before login, leaving/removal, and account deletion with owned groups.
- Dates: year boundaries, leap day, timezone changes, duplicate group birthdays, and edits reflected on both clients.
- Push: multiple devices, reinstall/token changes, invalid tokens, no permission, cold start, repeated jobs, and partial provider failures.
- Release: app versions older than the current server, release-build behavior, and recovery from API/network errors. OTA updates do not replace native rebuilds or store rules.
