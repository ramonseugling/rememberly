# Native links and notification taps

The app accepts validated Rememberly invitations and password-reset links. The `rememberly` custom scheme is configured. HTTPS links remain website links until the domain association requirements below are completed in signed builds. This task does not publish association files or change the web fallback.

## Accepted inputs

| Input                                                                     | Result                                              |
| ------------------------------------------------------------------------- | --------------------------------------------------- |
| `rememberly://join-group?code=abc12_-3`                                   | Explicit invitation confirmation                    |
| `rememberly://reset-password?token=<96 lowercase hexadecimal characters>` | Password form; no automatic password change         |
| `https://rememberly.com.br/join-group?code=abc12_-3`                      | Same validated invitation when delivered to the app |
| `https://www.rememberly.com.br/reset-password?token=...`                  | Same validated reset when delivered to the app      |

The `rememberly:///path` and `rememberly://app/path` forms are accepted too. Only the exact `/join-group` and `/reset-password` paths and their single expected parameter are allowed. Links reject other hosts, credentials, ports outside the exact origin, fragments, duplicate or unknown parameters, whitespace, encoding tricks, normalized traversal, malformed values, and inputs over 512 characters. Invitation codes match the server's eight lowercase base64url characters. Password reset tokens match the server's 48-byte hexadecimal format.

In development, the already validated `EXPO_PUBLIC_API_URL` origin is also accepted; there is no wildcard for localhost, arbitrary preview domains, or production HTTP. Unknown system links fall back to the app's normal entry screen. No external link can choose an arbitrary route or perform a write just by opening.

A signed-out invitation offers login or signup. The validated pending intent stays in memory and returns to the invitation after authentication. It is never embedded in a `next` redirect parameter. Cancel clears it; process termination discards it. Joining requires pressing **Confirm and join group**, which calls the existing authenticated API, then opens the returned group using a UUID-only parameter. Server membership checks continue to govern group reads. Errors leave confirmation available for retry; cancelled/unmounted or stale-account responses cannot navigate.

Reset tokens are used only by the reset form and removed from route parameters after capture. They are not native session tokens; no login/session credential is added to a URL or ordinary storage. The password change remains an explicit form submission. Reset forms are available with or without a current session.

## Notification navigation

Default notification taps accept these payloads only:

| Payload                                                          | Destination   |
| ---------------------------------------------------------------- | ------------- |
| `{ "kind": "event", "event_id": "<UUID>" }`                      | Dates tab     |
| `{ "kind": "birthday", "user_id": "<UUID>" }`                    | Groups tab    |
| `{ "kind": "commemorative", "date_key": "<known catalog key>" }` | Occasions tab |

These destinations deliberately use the existing tab views. They do not promise an individual item detail route. Payload URLs are ignored. Unknown or malformed payloads cause no navigation. Supported catalog keys are `mothers_day`, `fathers_day`, `valentines_day`, `childrens_day`, and `christmas`.

The runtime handles active response events and the last response at startup, deduplicates the latest 100 handled request identifiers for that runtime, and clears consumed or stale startup responses from the native last-response cache. The foreground privacy handler remains in place. Signed-out taps queue a permitted destination until login. Queued account-bound work is cleared on logout or account switching; delayed initial-response reads compare the captured identity before routing. Payloads do not identify a recipient, so they cannot establish resource authorization; all destination data is fetched through the current authenticated API. No private data is trusted from a notification payload.

## Universal Links and Android App Links prerequisites

The development iOS/Android identifier is now approved as `br.com.rememberly.app.dev`; see [development builds](development-builds.md). Apple team, Android signing fingerprints and a separate HTTPS development backend remain unavailable. Association and signed-device checks remain pending; do not substitute invented signing metadata.

Choose final per-environment iOS bundle IDs and Android application IDs first. Supply the Apple Developer Team ID and actual signing certificate SHA-256 fingerprints for Android (including Play App Signing for store releases). The EAS project ID is not any of these values.

For each trusted HTTPS host that should open the app:

1. Serve a valid HTTPS `/.well-known/apple-app-site-association` JSON document without redirects. Its `applinks.details` must name the real `TEAM_ID.bundleIdentifier` and restrict components to `/join-group` and `/reset-password` with the required query names.
2. Add that host's `applinks:` entitlement to the iOS signed build's `associatedDomains` after the identifiers and association document agree.
3. Serve `/.well-known/assetlinks.json` containing `delegate_permission/common.handle_all_urls`, the real Android package name, and its real SHA-256 signing fingerprints.
4. Add HTTPS `VIEW` intent filters with `autoVerify`, `BROWSABLE` and `DEFAULT` categories, exact hosts, and the two supported paths to the Android signed build.
5. Verify both files, HTTP headers, host delivery, and installed signed builds. Keep the website forms usable when the app is absent or the OS chooses the browser.

No placeholder Team ID, bundle ID, application ID, fingerprint, association file, associated-domain entitlement, or Android auto-verification claim is checked into this task. Native binary changes require rebuilding; a JS export cannot validate operating-system association.

## Device checks before release

Use installed iOS and Android development/release builds, then repeat with store signing where relevant. Test cold and warm opens, signed-out invitation through login and signup, explicit cancel/confirm, invalid/expired invitation, password reset, malformed/hostile links, logout/account switch during pending operations, and server denial of unavailable resources. Test foreground/background/terminated push taps, duplicate/unknown payloads, startup restoration, permission denial, and revoked sessions. Verify website fallback without the app. Expo Go and local pure tests do not prove these behaviors.

See [MOB-020](tasks/MOB-020-native-links.md), [session contract](session-contract.md), and [push contract](push-contract.md).
