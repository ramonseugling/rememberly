# Mobile development guide

Current scope (2026-11-05): reproduce the approved web application without adding product features. Work order is Google login, existing email journeys, links and development builds. Push, CI/deploy and store preparation are deferred. See [backlog](backlog.md) and [Google web parity](google-login.md); historical social-linking/Apple proposals below are not current requirements.

The approved direction is a free iOS/Android application using React Native and Expo, with the existing features plus push notifications. The Next.js site, HTTP API, database, and user accounts remain shared.

This directory replaces the earlier Portuguese planning document. These documents distinguish specified contracts, implemented backend behavior, and the mobile foundation. Follow task records for verified capability and remaining work.

## Read only what the task needs

| Need                                                    | Document                                                |
| ------------------------------------------------------- | ------------------------------------------------------- |
| Scope, milestones, store preparation                    | [Roadmap](roadmap.md)                                   |
| Current implementation status and next priorities       | [Backlog](backlog.md)                                   |
| Boundaries, cloud workflow, notification design         | [Architecture](architecture.md)                         |
| Existing HTTP capabilities and proposed changes         | [API contracts](api-contracts.md)                       |
| Accepted choices and unresolved questions               | [Decisions](decisions.md)                               |
| Existing checks, historical blockers, automation policy | [Validation](validation.md)                             |
| Smallest next delivery                                  | [Contract sequence and next API work](api-contracts.md) |
| Start another bounded task                              | [Task template](tasks/TEMPLATE.md)                      |

The [mobile session contract](session-contract.md) is implemented and locally verified. [MOB-002](tasks/MOB-002-session-api.md) records 111 passing integration tests and remaining release requirements. The independent [Expo app](../../mobile/README.md) now implements password login, persistent-session restoration, session identity, and logout. Feature data screens and signup/recovery UI are now implemented; see the latest task records and validation limits.

Completed parallel tracks: [MOB-003 data contracts](tasks/MOB-003-data-contracts.md) and [MOB-004 Expo foundation](tasks/MOB-004-expo-foundation.md). Completed implementation tracks: [MOB-005 backend reads](tasks/MOB-005-data-api.md) and [MOB-006 native sessions](tasks/MOB-006-mobile-sessions.md). The next wave implemented [shared data](tasks/MOB-007-authenticated-data.md), [Dates](tasks/MOB-008-native-dates.md), [Groups](tasks/MOB-009-native-groups.md), [Profile/Occasions](tasks/MOB-010-native-account.md), [session security](tasks/MOB-011-session-security.md), [CI](tasks/MOB-012-ci.md), and [signup/recovery](tasks/MOB-013-native-registration.md). Device validation and hosted CI remain pending. Contracts are in [data contracts](data-contracts.md).

## Working loop

1. Select one task with a concrete outcome and inspect its source files.
2. Resolve only decisions required by that task; record durable choices once.
3. Implement and run the smallest meaningful checks, then broaden if necessary.
4. Review the diff and record actual outcomes, blockers, and the next action.

Start a new conversation for an independent task when useful. Supply the task path and branch/commit, rather than pasting the entire plan or previous chat. Instructions and files provide durable context; they do not replace reading actual code or checking current state.

## Skills and agents

Use the two `AGENTS.md` files for stable repository rules. Do not load every planning document into every task.

No new skills, subagents, or speculative automation are installed by this preparation. After a workflow is exercised, consider a small skill for API contract changes, mobile verification, or release preparation. A skill should link to authoritative project files and contain repeatable procedure, not copies of architecture or task history.

Use one primary agent by default. Additional agents are useful for an explicitly authorized independent review or separately owned work after contracts are agreed. Parallel agents reduce elapsed time in some cases, but can increase token usage and integration work.

## First useful milestone

An installed development build can sign in with an existing account, fetch protected data, reopen its session, and log out with server-side revocation. Complete the session contract before implementation; do not bootstrap the entire product in one task.

## Latest security and notification wave

The previous feature wave was checkpointed at `bd38404`. New implementation adds [push infrastructure](tasks/MOB-014-push-backend.md), [account deletion](tasks/MOB-015-account-deletion.md), [durable login limits](tasks/MOB-016-login-rate-limits.md), [native push settings](tasks/MOB-017-native-push.md), [native deletion](tasks/MOB-018-native-account-deletion.md), and [public web deletion](tasks/MOB-019-web-account-deletion.md). Combined local evidence: 48 root suites/405 tests and 71 mobile tests passed; types, formatting, and both platform JS exports passed.

Push delivery is off by default pending provider/device validation and a suitable receipt/retry schedule. Cloud Expo preview remains paused. Hosted CI/deployment gating, social login/provider reauthentication, native domain links, email delivery, privacy disclosures, and device/store release validation remain outstanding.

The next parallel wave implements [native custom links and notification navigation](tasks/MOB-020-native-links.md), the [social-auth backend foundation](tasks/MOB-021-native-social-auth.md), and [service-independent email endpoint coverage](tasks/MOB-022-email-test-coverage.md). Combined local verification passes: 56 root suites/479 tests, 77 mobile tests, types/formatting, and both platform JS exports. Interactive social login and verified HTTPS domain association remain pending. See the [backlog](backlog.md) for current priorities and commit status.
