# Mobile backlog

This is the current implementation index. Task records contain detailed contracts and validation evidence. Implemented code still requires device and release validation.

## Shipped to the repository

Checkpoint `4138731` is on `main`: independent Expo app, persistent password sessions, Dates, Groups, Profile, Occasions, signup/recovery UI, session cleanup, account deletion, login limits, push infrastructure/settings, and CI workflows (MOB-001–019).

Push delivery remains disabled. Account owners must delete their groups before deleting their account. Email delivery and hosted CI success have not been verified.

## Current parallel wave

| Task                                            | Scope                                                                   | Completion boundary                                         |
| ----------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| [MOB-020](tasks/MOB-020-native-links.md)        | Invitation/reset custom links and notification navigation               | Local checks and JS exports; device links remain pending    |
| [MOB-021](tasks/MOB-021-native-social-auth.md)  | Google/Apple identity verification and transactional session exchange   | Backend foundation; no interactive provider login yet       |
| [MOB-022](tasks/MOB-022-email-test-coverage.md) | Separate delivery tests from authorization/validation/no-delivery tests | Local CI-selected suite; real mail delivery remains pending |

## Next implementation priorities

The current wave is locally verified: 56 root suites / 479 tests and 77 mobile tests pass, with root/mobile types and formatting and both platform JavaScript exports. Real delivery, hosted CI, signed builds, and device behavior remain unverified. Use Git history for the current commit and publication status.

1. **Native social login and verified account linking.** Add provider interaction using the system browser or supported native SDK, bind provider proof to the server challenge, and securely persist the returned session. Existing accounts must explicitly authenticate before linking; matching email alone never links accounts. Add provider reauthentication for account deletion. Requires provider client identifiers and redirect configuration.
2. **Controlled email delivery validation.** Exercise signup OTP, password recovery, reminders, and broadcasts with an authorized test recipient/provider setup. The isolated delivery suites remain visible and excluded from the default CI run until that setup exists.
3. **Push activation and device validation.** Configure APNs/FCM, verify permissions/taps/logout on physical devices, and arrange receipt processing/retries more frequently than the daily reminder trigger before enabling delivery.
4. **Verified domain links and development builds.** Choose environment-specific bundle/application IDs, Apple team and Android signing identities; configure domain association, then test cold/warm starts and authenticated invitation flows. Custom scheme parsing alone does not establish universal/app links.
5. **Hosted CI and deployment protection.** Confirm a hosted run, configure required checks, and make the Vercel deployment policy match the desired release workflow. Adding a workflow alone does not prevent immediate production deployment.
6. **Store readiness.** Privacy policy/disclosures, screenshots, accessibility/device review, signing, developer accounts, TestFlight/Google internal testing, and submission. Store publishing requires separate authorization.

Email validation, signing/domain preparation, CI settings, and privacy preparation can progress independently. Native social UI depends on the exchange contract; account linking depends on verified proof and reauthentication. Push activation depends on scheduling and device/provider evidence.

## Validation limits

Pure tests, HTTP/database integration tests, types, and JavaScript exports verify different boundaries. None establishes a signed native build, real device behavior, email/push delivery, hosted CI success, or store acceptance. See [validation](validation.md) and each task record for actual results.
