# Architecture

## System boundaries

```text
Next.js website ---------+
                        +-- Next.js HTTPS API -- PostgreSQL
Expo iOS/Android app ----+          |
                                   +-- Resend email
                                   +-- Reminder processing -- Push provider -- Devices
```

Use the existing backend rather than introducing a second implementation of business rules. Native clients consume JSON APIs; Next.js `getServerSideProps` is a web rendering mechanism, not an app API.

Keep the native project self-contained in `mobile/`. It will have its own manifest, lockfile, TypeScript configuration, environment selection, and build configuration. Bootstrap must isolate it from root TypeScript/Jest/deployment inputs. An eventual separate repository should require path, CI, and package-distribution adjustments rather than a product rewrite or user migration.

UI must be implemented with native components. Next.js routing, DOM, Tailwind/Radix components, and server rendering are not directly portable. Reuse identity, copy, and pure rules when practical. Inspect utilities before sharing: `lib/` is not a guarantee of client safety. Do not create a shared package until both clients need it.

Proposed libraries: Expo Router for navigation, Expo SecureStore for credentials, Expo Notifications for push, and TanStack Query for server state. Select versions against the chosen Expo SDK. Confirm additions when implementing the relevant task.

## Authentication and data

Preserve web cookie behavior. Mobile needs an explicit way to obtain, persist, present, inspect, and revoke credentials. Existing opaque sessions can support this; JWT and refresh tokens are not automatic requirements. The [mobile session contract](session-contract.md) defines expiration, denial paths, and compatibility for the next implementation task.

Credentials belong in platform secure storage. Clear cached account data and detach notification devices on logout/account changes. The app never receives database credentials, cron tokens, migration tokens, or server-side provider secrets. `EXPO_PUBLIC_*` values are public.

OAuth uses the system browser and platform-appropriate validation, including state/nonce and PKCE where applicable. Validate identity on the backend. If bridging through a web callback, return a short-lived single-use code for HTTPS exchange, not a durable session token in a URL. Do not link identities solely from untrusted client email. Apple identity may use relay email and only supply a name on initial consent.

Use HTTPS, backward-compatible contracts, explicit errors, and server authorization for every resource. Native requests do not require opening browser CORS to `*`. Keep development, staging, and production data and credentials distinct.

## Native experience

Proposed tabs: Dates, Groups, Commemorative Dates, Profile. Authentication, recovery, event forms, group invitations, notification preferences, privacy, support, and deletion complete the navigation.

Support links for group invitations, password reset, and notification destinations, both before and after login. Configure Universal Links/App Links and domain association; validate fallback when the app is absent or content has been deleted. Include loading, empty, retry, offline, expired-session, and permission-denied states.

## Notifications

Current reminder selection is in `models/notification.ts`; delivery is email. `vercel.json` schedules daily jobs at 12:00 UTC, and date utilities use America/Sao_Paulo. This is not yet a per-user scheduling system.

Proposed server-driven push design:

- Device installations: user, installation ID, platform, environment, token, last activity, and status. Support multiple devices and token changes; remove invalid tokens and detach on logout.
- Preferences: channels, IANA timezone, and hour. OS permission is per device and distinct from the account's preference.
- Delivery/outbox records: recipient, source reference, effective date, channel/installation, unique deduplication key, attempts, status, and provider receipt.
- Processing: choose eligible reminders independently of channel; persist work, send with bounded retries, and reconcile receipts. Handle overlapping workers and partial failures.

Expo Push Service is the initial proposal, with APNs/FCM credentials configured appropriately. Push is best effort, not guaranteed exact-time delivery. The app need not remain open. Do not depend on permanent background execution or unlimited local scheduling.

Configurable timezone/hour requires sufficiently frequent job execution and a scheduling design compatible with the hosting plan. Evaluate a queue/worker service if required. Define leap-day behavior, year boundaries, group deduplication, and safe notification text. Existing advance reminders query personal events; do not promise group advance reminders before implementing them.

## Cloud and release operations

Code, Git operations, API tests, and remote build orchestration can stay in the cloud. EAS Build/Submit is the proposed workflow. This Linux environment cannot run an iOS simulator. Development/release builds on real devices are required for push, authentication, links, and final validation; Expo Go is not sufficient.

Store accounts, signing, and provider configuration require the product owner's access. Use secure service bindings, not secrets in chat or source. Account checks, submissions, store review, release, and Codex environment publication are different operations.

Budget for store enrollment, builds, backend/database/jobs, email, monitoring, and optionally cloud devices. Check current pricing and store policies when needed rather than embedding amounts or approval deadlines here.
