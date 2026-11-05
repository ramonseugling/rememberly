# MOB-020: Native links and notification navigation

Status: implemented and locally verified; signed-build/device verification and HTTPS domain association pending.

## Outcome

Added strict invitation/reset parsers and `rememberly` scheme routing, a public invitation confirmation screen, in-memory return through login/signup, validated joined-group selection, and notification response navigation to allowlisted tabs. Reset forms accept only validated link tokens and remain available while signed in. No write runs merely from opening a link. Existing session transport and notification privacy presentation remain unchanged.

The EAS project ID and notification plugins are preserved. No provider credentials, association metadata, deployment, signed build, preview, or tunnel were created. See [native links](../native-links.md) for trusted origins, payload contract, association prerequisites, and device checklist.

## Verification

Six focused pure tests cover supported links, hostile/duplicate/malformed/oversized inputs, explicit development trust, notification allowlisting, queued intent isolation across authentication changes, and bounded notification deduplication. Mobile TypeScript checking passes. Formatting is checked for touched files. Parent integration owns the combined mobile suite and both platform JS exports.

## Remaining work

Supply final app identifiers, Apple Team ID, Android store signing fingerprints, and valid domain association documents before enabling verified HTTPS links. Verify native link delivery and notification taps on physical iOS and Android builds, including account-switch races, startup restoration, browser fallback, and expired/revoked resources. Pure tests do not validate operating-system routing or notification delivery.
