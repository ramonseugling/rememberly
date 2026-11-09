# Push notification contract

Status: backend implemented behind a delivery flag; provider credentials, supported scheduling, and real-device delivery remain unverified. See [MOB-014](tasks/MOB-014-push-backend.md) and native [MOB-017](tasks/MOB-017-native-push.md).

## Mobile API

All routes require one valid `Authorization: Bearer <session token>` header, ignore cookies, return `Cache-Control: no-store`, and never return a device token. Expired/revoked sessions return 401. Unsupported methods return 405 with `Allow`; undocumented query selectors and body fields return 400. Failures and application logs use generic messages.

| Route                                                | Request                                                                                                                     | Success                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| GET `/api/v1/mobile/notification-preferences`        | No query/body                                                                                                               | 200 preferences                                                |
| PATCH `/api/v1/mobile/notification-preferences`      | `{ "push_enabled"?, "email_events"?, "email_marketing"? }` booleans; at least one, no other fields                          | 200 preferences                                                |
| POST `/api/v1/mobile/push-devices`                   | `{ "installation_id": "UUID", "expo_push_token": "ExpoPushToken[...]", "platform": "ios" }`; platform also allows `android` | 204, empty body                                                |
| DELETE `/api/v1/mobile/push-devices/:installationId` | UUID path; no selectors                                                                                                     | 204, empty body, including missing/another user's installation |

Preferences are `{ "push_enabled": false, "email_events": true, "email_marketing": true, "time_zone": "America/Sao_Paulo", "daily_time": "09:00" }` by default. The three booleans can change and live in the `notification_preferences` table (one row per user; formerly `push_preferences`, which was renamed, and `email_marketing` is seeded from `users.marketing_consent`). `push_enabled` controls push reminders for events, `email_events` the event e-mails (on the day and early reminders, including commemorative dates), and `email_marketing` the "Novidades e dicas" announcements; the unsubscribe link also clears `email_marketing`. A push preference for announcements does not exist yet because no such push is sent. Preferences are account-wide. Device registration alone does not opt in, request OS permission, or prove delivery.

Each installation/token is globally unique. Authenticated registration may rebind either identifier; user and session validity are locked and rechecked before removing a previous binding. Retrying the same account/installation/session preserves the row and reminder deduplication. Rebinding to a new session cancels that installation's queued reminders from the previous session. Removing/replacing an installation cascades its outbox/history, so deduplication does not span deleted registrations.

Devices belong to the exact login session. Enqueue and the final pre-send check require the same device/user/session, valid session expiration, active device, and enabled preference. Existing logout, password reset, account-wide revocation, and account deletion therefore stop subsequent delivery without changing those session flows. Account deletion cascades preferences, devices, deliveries, and attempts. A provider request already in flight cannot be recalled after logout or opt-out.

## Reminder selection and privacy

The job uses the São Paulo reference date and existing annual calendar helpers:

- Personal dates on the day and at their configured advance interval (1, 3, 7, 15, or 30 days).
- Shared-group member birthdays on the day, excluding the birthday person and deduplicated across shared groups by birthday person and recipient.
- Enabled commemorative subscriptions seven days before the occurrence, including movable dates.

A unique device/logical-reminder/date key prevents repeated cron invocations from enqueueing another copy while that device registration remains. Different installations are separate destinations. Email models and email preferences are unchanged.

Android messages specify `channelId: 'reminders'` to match the native notification channel. All notifications use title `Rememberly` and body `You have a date to remember. Open Rememberly to see it.` Data contains only the kind and resource identifier (`event_id`, birthday `user_id`, or commemorative `date_key`). Personal names, event titles, email addresses, and session tokens are omitted. Opening data must still use the authenticated resource APIs and their ownership/membership checks.

## Delivery operations

The existing 12:00 UTC daily `/api/v1/notifications/send` job corresponds to 09:00 São Paulo and calls push only when `PUSH_DELIVERY_ENABLED=true`. That flag defaults off. No extra Vercel cron has been added because the deployment plan's scheduling limits have not been verified.

GET `/api/v1/notifications/push` is a separate authenticated invocation hook, not a publicly callable mobile operation. It requires `Authorization: Bearer <CRON_SECRET>` and returns `{ "disabled": true }` until the flag is enabled. Both invocations use `runPushJob` from `models/push-delivery.ts`. Responses expose counts only. Standalone and combined route durations are configured for at most 60 seconds; actual deployment limits still apply.

The production transport sends one Expo batch of up to 100 messages and checks up to 50 existing ticket receipts per invocation. Each HTTP request has a four-second timeout, fixed HTTPS destination, rejected redirects, and normal TLS verification. The job has a twenty-second soft budget before claiming the send batch. Enqueue and database finalization are additional work; this is not a hard wall-clock guarantee. Remaining work requires another invocation. Over 100 eligible deliveries per day can exceed the current daily-only capacity.

The provider destinations are fixed at `https://exp.host/--/api/v2/push/send` and `https://exp.host/--/api/v2/push/getReceipts`. Set optional server-only `EXPO_PUSH_ACCESS_TOKEN` if Expo push security is enabled. The development CLI's `EXPO_TOKEN` is never used for delivery. Real APNs/FCM credentials must be configured through the Expo project; no credentials are fabricated by the implementation or tests.

Outbox rows track pending, sending, accepted ticket, delivered receipt, failed, or cancelled state. Claims use row locks with `SKIP LOCKED`, leases, and durable attempt records. Only explicit retryable rejection (rate limits) permits another send, up to three total attempts with at least fifteen minutes between attempts. Unsent messages expire after 24 hours. Network timeouts, malformed responses, and expired sending leases become terminal `UnknownOutcome` because Expo may already have accepted the message. This is bounded deduplication and best-effort delivery, not exactly-once delivery.

Ticket receipt checks have a separate durable three-check budget and fifteen-minute spacing. `DeviceNotRegistered` disables the affected registration; permanent failures stop retrying. Receipt success means acceptance by APNs/FCM, not that a person viewed a notification. Unknown/missing receipts eventually fail as `ReceiptUnknown`; worker crashes cannot leave a final exhausted receipt lease permanently eligible.

The daily-only schedule is insufficient for reliable receipt retrieval: Expo receipts expire after roughly 24 hours, so the next daily run can miss them. It also does not provide timely retries or drain batches beyond the cap. Before enabling delivery, approve and configure a supported more frequent invocation/worker, including a receipt pass about fifteen minutes after sending, plus monitoring of pending/unknown/failed states. Do not advertise timely retries, confirmed receipts, or a larger daily capacity until that scheduling exists and has been validated.

## Release validation still required

Keep `PUSH_DELIVERY_ENABLED` unset/false until real iOS and Android development/release builds, APNs/FCM configuration, Expo access security, OS permission flows, token refresh/rebinding, logout/revocation, notification tapping, and approved scheduling/receipt retrieval have been exercised. Expo Go installation is not evidence of remote notification support or end-to-end delivery. Automated backend tests inject the provider transport and perform no real provider requests.
