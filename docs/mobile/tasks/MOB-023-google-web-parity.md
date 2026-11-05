# MOB-023: Google login matching the approved web flow

Status: implementation and local automated validation complete; provider configuration and installed-device validation pending.

## Scope

Port the existing Google sign-in behavior to the native login screen. Reuse web authorization, code exchange, profile and case-insensitive account resolution. No Apple integration, account-linking feature, new provider, or change to approved web behavior.

## Implementation

The system browser returns a one-minute, one-use PKCE-bound handoff code to the existing native scheme. The backend issues the existing persistent mobile session only on successful redemption. The session controller owns secure persistence and late-result revocation. A forward migration adds `mobile_google_logins`; existing migrations are unchanged.

See [configuration and protocol](../google-login.md). Register the additional server callback in the existing Google OAuth client. Device validation requires a reachable development backend and an installed development build. Push, CI/deploy policy and store work are deferred by user instruction.

## Verification

Passed: 83 mobile tests, 14 tests across four root suites (mobile HTTP/model and existing web Google regressions), root/mobile TypeScript, and both platform JavaScript exports. The database tests use `rememberly_mobile_google_test`, preserving the preview seed. Expo configuration resolves the approved iOS/Android development IDs and custom scheme. Formatting checks apply to changed files.

The existing email endpoints were exercised separately with an authorized controlled recipient: OTP, signup, password recovery, password login, personal-event creation and cron-triggered day/advance emails. Resend reported `delivered` for all four messages. Temporary users, events and OTP data were removed. The provider list briefly lagged behind sends; a subsequent read confirmed all four records. No live Google login, signed build, deployment or publication has been performed.

## Next

The user confirmed access to the web Google Cloud project and approved the development identifiers. Apple Developer enrollment and a separate HTTPS development backend do not yet exist, so live iPhone/Google/verified-link validation is pending those prerequisites. See [build configuration](../development-builds.md).

Configure the callback, select development build identifiers, generate/install development builds, and exercise Google sign-in for existing web accounts, new accounts, cancellation, restoration and logout. Then validate the existing email and link journeys with an authorized controlled recipient.
