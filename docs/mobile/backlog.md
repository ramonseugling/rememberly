# Mobile backlog

Current visual-parity work is tracked in [VIS-001–012](visual-parity.md). The local web-mobile UI is the approved reference; initial source changes are in progress and visual/device acceptance remains pending.

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

## Current priorities (user direction, 2026-11-05)

The approved web application is the product reference. Copy its existing features and behavior; do not invent new functionality. Apple login and a new account-linking workflow are not part of the current delivery.

1. **Google login matching web.** [MOB-023](tasks/MOB-023-google-web-parity.md) implements the existing server-side Google flow, shared account resolution, and secure native return. Real provider/device verification remains pending.
2. **Existing email journeys.** OTP, signup, recovery, day-of email and advance reminder were exercised through existing endpoints with an authorized controlled recipient; Resend confirmed four deliveries on 2026-11-05. No email behavior/template changes were needed. Installed-app recovery-link handling remains part of link validation. See [MOB-023 evidence](tasks/MOB-023-google-web-parity.md).
3. **Existing invitation/recovery links.** Preserve the web fallback and the approved group/reset flows. Custom scheme parsing exists; verified HTTPS association requires actual signing identities.
4. **Development builds.** Use approved `br.com.rememberly.app.dev` identifiers for iOS/Android, configure development builds, and validate on installed apps. These are development identifiers only.

**Deferred until the final phase:** push activation/validation, CI and deployment protection, privacy/store preparation and release. Existing implementations remain in place; do not expand these tracks now.

## Previous priority proposal (superseded by the order above)

The current wave is locally verified: 56 root suites / 479 tests and 77 mobile tests pass, with root/mobile types and formatting and both platform JavaScript exports. Real delivery, hosted CI, signed builds, and device behavior remain unverified. Use Git history for the current commit and publication status.

1. The earlier native-social/explicit-linking proposal is superseded for the current Google UI by [web-parity Google login](google-login.md). The historical ID-token API remains separate and unchanged.
2. **Controlled email delivery validation.** Exercise signup OTP, password recovery, reminders, and broadcasts with an authorized test recipient/provider setup. The isolated delivery suites remain visible and excluded from the default CI run until that setup exists.
3. **Push activation and device validation.** Configure APNs/FCM, verify permissions/taps/logout on physical devices, and arrange receipt processing/retries more frequently than the daily reminder trigger before enabling delivery.
4. **Verified domain links and development builds.** Choose environment-specific bundle/application IDs, Apple team and Android signing identities; configure domain association, then test cold/warm starts and authenticated invitation flows. Custom scheme parsing alone does not establish universal/app links.
5. **Hosted CI and deployment protection.** Confirm a hosted run, configure required checks, and make the Vercel deployment policy match the desired release workflow. Adding a workflow alone does not prevent immediate production deployment.
6. **Store readiness.** Privacy policy/disclosures, screenshots, accessibility/device review, signing, developer accounts, TestFlight/Google internal testing, and submission. Store publishing requires separate authorization.

Email validation, signing/domain preparation, CI settings, and privacy preparation can progress independently. Native social UI depends on the exchange contract; account linking depends on verified proof and reauthentication. Push activation depends on scheduling and device/provider evidence.

## Validation limits

Pure tests, HTTP/database integration tests, types, and JavaScript exports verify different boundaries. None establishes a signed native build, real device behavior, email/push delivery, hosted CI success, or store acceptance. See [validation](validation.md) and each task record for actual results.
