# Mobile roadmap

## Approved scope

Free iOS/Android application sharing accounts and data with the website: registration/recovery, dates, groups, commemorative-date subscriptions, profile, and push notifications. Preserve email as an existing backend capability. The native data flows, password sessions, profile/group/event management, commemorative subscriptions, and signup/recovery UI are implemented. Account deletion and push infrastructure/settings are now implemented. Actual push activation, social login/provider reauthentication, universal links, and device/store validation remain pending.

| Flow                | First-release acceptance                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| Identity            | Existing and new users sign in; OTP/recovery, expiry, cancellation, and logout work                     |
| Dates               | Personal CRUD and group birthdays match the web; group-derived data is not editable as a personal event |
| Groups              | Creation, invitation/join, members, exit, and owner actions enforce API permissions                     |
| Commemorative dates | Catalog and subscription state match the account on the web                                             |
| Profile/settings    | Profile changes, notification preferences, support, privacy, and account deletion                       |
| Native links        | Invite, recovery, and push destinations work with cold start and after login                            |
| Reliability         | Loading, empty/error/offline states, accessibility, safe areas, and recoverable failures                |

Billing, contacts, calendar integration, widgets, offline editing, and mobile administration are deferred proposals. Finalize social-login scope before implementing authentication providers.

## Milestones

| Milestone          | Deliverable                                                           | Evidence needed                                                                                            |
| ------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| M0: Foundation     | Instructions, bounded tasks, baseline diagnosis, staging plan         | Working documentation; readiness failures explicitly tracked                                               |
| M1: API            | Mobile sessions, profile, unified agenda, catalog contracts           | Focused HTTP tests, denial paths, and web regression checks                                                |
| M2: First app      | Independent Expo project, navigation, secure session, API client      | Installable iOS/Android development builds; existing user can sign in and fetch protected data             |
| M3: Feature parity | Dates, groups, commemorative dates, profile, links                    | End-to-end journeys using the same account across web and app                                              |
| M4: Push           | Devices, preferences, processing, delivery tracking                   | Real-device receipt on both platforms; logout, invalid tokens, permission denial, and deduplication checks |
| M5: Beta           | Deletion, privacy, accessibility, release configuration and materials | TestFlight/Play testing, review access, device matrix and launch checklist                                 |
| M6: Release        | Submission and gradual rollout                                        | Store approval, crash/API/delivery monitoring, support and correction process                              |

Critical dependencies: session contract → API implementation → authenticated app → parity and push → beta → stores. Store-account enrollment and design can proceed independently. No fixed delivery estimate is established before an installed build and account requirements are known.

## Store preparation

- Product-owned Apple Developer/App Store Connect, Google Play Console, and build-service accounts. Decide individual/organization identity and secure recovery access.
- Stable bundle/application identifiers; signing, APNs/FCM configuration; separate non-production builds and data.
- Icons, screenshots, descriptions, classification, support and privacy URLs, declarations of data use/SDK behavior, and functional reviewer access.
- Account deletion inside the app and a web request path, with clear associated-data treatment and justified retention. Decide group ownership behavior: the existing database cascades deletion from a group creator.
- Review login-provider rules, including Apple's equivalent login requirements where applicable; plan Apple login if retaining third-party login requires it.
- Inventory names, email, birthdays, third-party dates, group membership, device tokens, and SDK data. Minimize logs and lock-screen content. Separate marketing consent from transactional reminders.
- Assess user-generated-content moderation/reporting/blocking requirements for the actual group features. Avoid unrelated device permissions.
- Check current SDK/target requirements, privacy manifests, new-account Play testing rules, pricing, and policies at submission time. Approval timing is external and cannot be guaranteed.

## Official references

These references were not live-verified during planning; consult current documentation before the affected implementation or submission.

- [Expo remote builds](https://docs.expo.dev/build/introduction/)
- [Expo submission](https://docs.expo.dev/submit/introduction/)
- [Expo push notifications](https://docs.expo.dev/push-notifications/overview/)
- [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [Apple enrollment](https://developer.apple.com/programs/enroll/)
- [Google Play policies](https://play.google/developer-content-policy/)
- [Google Play account testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Google Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)
