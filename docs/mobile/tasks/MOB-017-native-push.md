# MOB-017: Native push preferences and registration

Status: implemented and locally verified; device/release validation pending.

## Outcome

NotificationSettings and NotificationRuntime are integrated into Profile and the root session tree. Explicit permission requests, supported-device/build guards, secure installation identity, token registration, opt-out, account-switch cancellation, and generic authenticated foreground presentation are implemented.

## Verification

12 focused notification cases, combined 71 mobile tests, mobile types/formatting, frozen npm ci, and both platform JS exports passed. No APNs/FCM/device/provider delivery was exercised.

## Limits

Real development/release builds, native permission behavior, token refresh, notification tapping, provider credentials, and an approved receipt/retry schedule remain required. Delivery stays disabled by default.

No production operation, commit, external send, or signed build was performed by this task. See [push contract](../push-contract.md), [account deletion](../account-deletion.md), and [validation](../validation.md) for the relevant evidence.
