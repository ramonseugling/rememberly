# Decisions

Keep entries short. Update an existing decision or mark it superseded rather than creating conflicting copies. Dates use ISO format.

| ID    | Date       | Status   | Decision and reason                                                                                                                                                           |
| ----- | ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-001 | 2026-10-30 | Accepted | Launch a free iOS/Android MVP with current user-facing features and push. Billing is outside the initial scope.                                                               |
| D-002 | 2026-10-30 | Accepted | Use React Native and Expo, leveraging React/TypeScript expertise with native UI.                                                                                              |
| D-003 | 2026-10-30 | Accepted | Keep the existing Next.js Node backend, PostgreSQL, and accounts. Expose SSR-only data through HTTP contracts.                                                                |
| D-004 | 2026-10-30 | Accepted | Start with an independent project under `mobile/` in this repository. Keep dependencies and builds separate to allow later extraction. Do not move the web application first. |
| D-005 | 2026-10-30 | Accepted | Development can remain in the cloud. Plan remote builds and real-device testing; no local clone is required.                                                                  |
| D-006 | 2026-10-30 | Accepted | New project instructions, documentation, task records, and development communication are in English. Existing product localization is not being bulk-migrated.                |
| D-007 | 2026-10-30 | Proposed | Use server-driven Expo push initially; preserve email as a separate channel. Confirm provider setup during the notification task.                                             |
| D-008 | 2026-10-30 | Proposed | MVP writes require connectivity. Defer offline editing, contacts, calendar integration, widgets, billing, and mobile administration.                                          |

## Decisions required later

- Social login: keep Google and add Apple where required, or begin with first-party login only. Preserve existing web login either way.
- Store account ownership and availability of iPhone/Android test devices.
- Notification timezone/hour defaults, lock-screen content, and per-channel preferences.
- Account deletion: transfer or delete owned groups, retention rules, and identity-provider revocation.
- February 29 recurrence, timezone changes, and deduplication of a person's birthday across groups.
- Exact Expo SDK, package versions, signing identifiers, and build-service plan at bootstrap time.

Open choices do not block unrelated work. Resolve each before implementing the affected behavior; do not silently treat proposals as accepted requirements.
