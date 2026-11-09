# Product backlog — Mobile design system and gift lists

## Defined direction

The proposal extends Rememberly from date reminders to **gift lists and gift organization among people in the same groups**.

After the design system, the first new functional milestone will be **gift lists with secret reservations on mobile**, using the current backend. Public sharing, a dedicated birthday experience and push come in later stages.

Decisions confirmed so far:

- Mobile first; the web gift list is a later delivery.
- Sharing is initially restricted to authorized groups.
- Navigation approved on 2026-11-07: **Home · Events · Groups · Gifts · Profile**, no central button. It replaces the earlier four-tab proposal. Until the gift list is implemented, the Gifts tab only shows "coming soon". The mocks (2026-11-08) rename the tab and the feature from "wishes" to **gifts / gift list**.
- Commemorative dates remain available from Profile ("Special dates").
- The earlier refactor and the calendar remain discarded. The approved stage is a warm minimalist design system, with a catalog and real pilots for Events and Profile.
- Open business decisions are recorded as blockers before the respective implementations.

## Current stage — Design system before the gift list

Updated 2026-11-08. The web is out of scope for this round. The first two visual proposals were rejected. The current target is the full set of mocks designed in Claude Design (see [design system](../mobile/design-system.md)): brand gradient primary, Fredoka/Quicksand, five-tab floating bar and the screen inventory listed there. The pixel-sampled [home crop](../mobile/references/home-color-reference.png) remains as history. References and plans do not replace the existing AGENTS.md files.

Order: record this backlog → define tokens and components → catalog and pilots → user visual approval → standardize the remaining screens → start the gift list.

The task-by-task plan to implement the full set of mocks (mobile and backend, in iterations) is in [MOBILE-SCREENS-BACKLOG.md](MOBILE-SCREENS-BACKLOG.md); it supersedes the one-line DS-005 plan.

| ID     | Priority | Status                                    | Delivery / acceptance                                                                                                                                                                | Dependency             |
| ------ | -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| DS-001 | P0       | Implemented; new design pending migration | Specification aligned with the mocks: semantic colors, typography, spacing, sizes, borders, shadows, icons and motion in docs/mobile/design-system.md.                               | This record            |
| DS-002 | P0       | Implemented (old palette); review pending | Isolated base in mobile/src/design-system/: text, buttons, fields, selectors, cards, rows, badges, switches, checkbox, OTP, feedback and sheets. No global swap of the legacy theme. | DS-001                 |
| DS-003 | P0       | Implemented (old palette); review pending | Development-only catalog with interactive states and identified demo data. No real automatic submit, sign-up or deletion.                                                            | DS-002                 |
| DS-004 | P0       | Implemented (old palette); review pending | Real Events and Profile using the new base; preserve features, navigation and data. Tests/types/bundles and visual validation on a device.                                           | DS-002/003             |
| DS-005 | P0       | Blocked                                   | After the pilots are approved, migrate Groups, Special dates and authentication to the new tokens (gradient primary, Fredoka/Quicksand); remove replaced duplicate styles.           | DS-004 visual approval |

Visual approval belongs to the user and cannot be inferred from types, tests or bundles. Record evidence per round. The first run ends with the catalog and pilots ready for review; it does not migrate other screens or start the gift list automatically.

Not included in this stage: dark theme, calendar, new notification preferences/rules, API/database changes, payments, full rebranding or changes to the website. Preserve the stationary backdrop and independent sheet animation, keyboard, safe areas and reduced motion. (Profile and group photos are part of the mocks but are not implemented yet.)

All REM milestones below stay blocked for implementation until the design system is complete and approved. The business decisions listed at the end remain pending; table/route examples in the received material must follow the project's parameterized SQL, `/api/v1/` and progressive migrations.

## What already exists and what is new

| Area                                | Current state                                                     | Work needed                                                 |
| ----------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| Accounts, authentication, sessions  | Implemented on web and mobile                                     | Reuse and protect the new features                          |
| Events and groups                   | Implemented                                                       | Add access to members' gift lists                           |
| Personal gift list                  | Absent                                                            | Data, APIs and screens                                      |
| Gift list sharing                   | Absent                                                            | Explicit permissions per group                              |
| Reservations and declared purchases | Absent                                                            | Concurrency, confidentiality and interfaces                 |
| Dedicated birthday page             | Absent                                                            | Person and occurrence identification, authorized reads      |
| Profile and group photos            | No functional support identified                                  | Define need and privacy; initially use initials             |
| Push                                | Infrastructure implemented, delivery disabled                     | Configuration, operation and validation on installed builds |
| Deep links                          | Invitations and recovery implemented; notifications open the tabs | Add a specific birthday destination                         |
| Observability                       | Axiom and web Analytics exist                                     | Instrument the new funnel without sensitive data            |

**Important distinction:** group birthdays are derived from users' profiles. A personal event named "Pedro" is free text and does not necessarily identify an account. We will not associate a gift list with someone by name.

## Backlog by milestone

### Milestone 0 — Consolidate context and close the contracts

| ID      | Priority | Delivery and acceptance                                                                                                                                                                |
| ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REM-000 | P0       | Consolidate vision, decisions and backlog in `docs/product/`, preserving the mobile history. Merge useful guidance from the received files without replacing the existing `AGENTS.md`. |
| REM-001 | P0       | Consolidate the audit started in this conversation: existing capabilities, gaps, code references and validation limits. Initial status: **under review**.                              |
| REM-002 | P0       | Close data, authorization, response contracts and lifecycle policies. The reservations implementation is blocked by the decisions listed below.                                        |
| REM-501 | P1       | Diagnose the real requirements for push, links and builds early, reusing existing records. Identify external dependencies without enabling delivery.                                   |

**Corrections to the received documents:** the project uses PostgreSQL with parameterized SQL and no ORM; routes under `/api/v1/`; progressive migrations with automatic rollback disabled. The table and endpoint examples are proposals, not the current state.

### Milestone 1 — Gift list and reservations on mobile

Execute in the order below, with small, verifiable deliveries.

| Order / IDs   | Priority | Delivery and main criterion                                                                                                                                                                       |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — REM-101   | P0       | Persistence of one permanent gift list per user and its items. Title required; optional fields per the approved contract. Private by default.                                                     |
| 2 — REM-201   | P0       | Sharing with groups chosen by the owner. Access requires a current authorized membership and considers the union of common groups.                                                                |
| 3 — REM-102   | P0       | APIs to create, read, edit and delete by the owner. Validate URLs and do not fetch external content.                                                                                              |
| 4 — REM-103   | P0       | **My gift list** screen on mobile: create, edit, delete, empty/error/loading states and selection of authorized groups. Adjust the approved navigation.                                           |
| 5 — REM-202   | P0       | Open another member's gift list through the group. Do not duplicate items when there are several common groups; handle revoked access.                                                            |
| 6 — REM-301   | P0       | Reservation persistence: one globally active reservation per item, including under concurrency and across different groups.                                                                       |
| 7 — REM-302   | P0       | APIs to reserve, mark as purchased and cancel. Only the reserver manages their reservation; conflicts return `409`.                                                                               |
| 8 — REM-303   | P0       | Gift-giver interface with availability and actions. The owner receives only their own items, with no reservation or purchase state and no reserver identity.                                      |
| 9 — REM-304   | **P0**   | Implement and test the approved policies for edit/delete, loss of access and account deletion. This story is no longer P1 and blocks the release of reservations.                                 |
| 10 — REM-601A | P1       | Minimal measurement of creation, sharing, viewing and reservation. Use existing observability when sufficient, without logging titles, URLs or secret states on surfaces accessible to the owner. |
| 11 — REM-602A | P0       | Controlled mobile pilot: authorization, concurrency, regressions, interface states and device validation. Reversible release of the new features.                                                 |

**Main dependency:** approved contracts → persistence and permissions → own and members' gift lists → reservations and lifecycle → pilot.

### Milestone 2 — Birthday page and notifications

The mocks include the birthday page opened from a push notification (today and early-reminder variants): person, date, group and the person's gift list; no "send greetings" button and no options menu.

| IDs             | Priority | Delivery and acceptance                                                                                                                                        |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REM-401         | P1       | Dedicated birthday page, reusing the registered person and the annual occurrence. Do not create parallel birthdays or link personal events by name.            |
| REM-402         | P1       | Show gift lists only when the visitor has access. The birthday person's page keeps showing no reservation data.                                                |
| REM-502A        | P1       | Extend navigation and payloads to open the right person/occurrence, including after login. Revalidate authorization at the destination.                        |
| REM-502B        | P1       | Prepare and validate real push: credentials, installed builds, permissions, receipt processing, retries and monitoring. Reuse the existing infrastructure.     |
| REM-601B / 602B | P1       | Measure birthday/notification opens and validate the integrated release.                                                                                       |
| REM-403         | P2       | Make greetings easier using sharing or another approved capability, with no automatic sending on the user's behalf. (The mock deliberately omits this button.) |

Push will not be a requirement to initially validate the value of gift lists and reservations.

### Later evolutions

- **Web gift list:** offer the experience to people who arrive through an invitation without installing the app.
- **REM-203:** revocable public link (also shared through WhatsApp), with no reservation or purchase information.
- **REM-503:** early birthday notice to prepare gifts, with an explicit user option. The current early reminders continue to exist.
- Photos, item price/image, advanced ordering and other improvements per approved scope.
- Extraction of store information from URLs, with a specific security analysis.
- Collective gifts, affiliates, payments, subscription and B2B remain future hypotheses.

## Business decisions that block stories

These decisions will not be made implicitly during implementation:

| Decision                                                                                                | Must be resolved before      |
| ------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Fields of the first form, ordering and item limit — the 50-item limit is only a suggestion              | REM-101/103                  |
| What happens when the owner edits or deletes a reserved/purchased item, without revealing a reservation | REM-002, before reservations |
| How the reserver follows or cancels a reservation after losing access to the group/list                 | REM-302/304                  |
| Handling of reservations when the owner or the gift-giver deletes their account                         | Migrations and REM-304       |
| When a reservation expires or a purchased item can become available again                               | REM-301/304                  |
| Identity of the annual occurrence, multi-group context and personal information shown                   | REM-401                      |
| Inclusion of photos, age exposure and how to send greetings                                             | Corresponding features       |

## Technical contracts and validation

- Reuse the existing backend, sessions, groups and MVC patterns. Do not create a backend exclusive to the mobile gift list.
- Explicitly separate the owner's and the gift-givers' responses. Hiding information in the interface does not satisfy the confidentiality requirement.
- Treat availability as derived from reservations; protect exclusivity in the database and in transactions.
- Revalidate access on every read and change; caches, errors and alternative responses must not reveal reservations to the owner either.
- Validate races with a real PostgreSQL: two users trying to reserve the same item, including through different groups.
- Cover owner, authorized member, third party, former member, multiple groups, revocation and account deletion.
- Test request repetition, network failures, session expiry and data refresh on mobile.
- Preserve authentication, events, groups, emails and already approved flows. Push and link tests on installed builds stay separate from Expo Go tests.

This document records planning and approved decisions. The gift list is not implemented. The original history of this proposal is preserved in `whishlist4.md`; this file is the updated execution index.

## Evidence for round DS-001–004 — 2026-11-06

Planning was versioned before the code in commit 5d61a8a. Catalog and real Events/Profile pilots were implemented with isolated tokens; navigation, legacy theme, APIs and business rules were preserved. Local verification: 97 mobile tests, TypeScript, formatting of changed files and Hermes iOS/Android exports passed. New tests verify contrast pairs and catalog availability only in development environment/bundle. The preview uses the existing local database, with no cleanup or seed.

Visual approval, enlarged text, keyboard, screen readers and motion on a device: pending the user's review. DS-005 and any gift-list implementation stay blocked until that approval.

## Visual review from a mock — 2026-11-07

The user rejected the look of the first proposal and pointed to a specific mock. The review replaced the pilots' Quicksand typography with the native font, moved the palette closer to the image's soft pink, used pink gradient primary actions and made the Events rows and Profile panels more compact. The catalog includes a demo visual composition. The image was preserved at docs/mobile/references/rememberly-visual-reference.png.

Scope remains the catalog, base and Events/Profile pilots. Gifts, reservations, photos, future navigation and the remaining mock screens stay in their milestones. The new look still requires visual approval on a device; DS-005 and the gift list remain blocked.

Validation for this review: TypeScript, 97 mobile tests, full mobile formatting and Hermes iOS/Android exports passed. Expo Go preview and local API reachable; database preserved, no seed. This is neither visual approval nor device testing.

## Reference correction — 2026-11-07

Revision d3e9d28 was also rejected. The current reference became the home-color-reference.png crop, with colors sampled from pixels and proportions corrected for the mobile viewport. DS-001–004 remain in visual review; DS-005 and the gift list remain blocked. See the method and measurements in the design system document.

## Home and navigation approved — 2026-11-07

The user explicitly anticipated this navigation change and the creation of Home during visual review. It replaces the earlier restriction of waiting for the gift list to change the tabs; it does not release the gift-list feature.

- Greeting with first name, 👋 emoji, the text "Here are your upcoming celebrations" and an initial avatar that opens Profile.
- Upcoming events: up to three real birthdays from the agenda (personal and group), ordered by days until the next occurrence. Includes today and the year rollover; excludes other event types. Ties use title and ID for stability, without merging people by name.
- "See all" opens Events. Each birthday opens its current data in Events; editing is available only for authorized personal events.
- My groups: up to two groups, in the API's current order. "See all" returns to the Groups list even after a visit to the details. Each card opens its group.
- Tabs: Home, Events, Groups, Gifts and Profile. The Gifts tab shows "coming soon", with no gift-list actions.
- Add event lives in Events; Create group stays in Groups. Special dates are reachable from Profile. Event notifications now go to Events.
- Loading, error with retry, empty and pull-to-refresh states use the existing APIs and session protections.

Visual acceptance on a device is pending. Visual exploration of the remaining screens is left for the next round; gift-list implementation remains blocked.

Verification of the Home delivery: 101 mobile tests, TypeScript, formatting and Hermes iOS/Android bundles passed. An authenticated read smoke of profile, agenda and groups passed; the smoke session was revoked. Visual validation and manual navigation on the device remain pending.

## Events — visual reference of 2026-11-07

The Events screen was revised according to the [submitted mock](../mobile/references/events-reference.png): title and description at the top, a calendar icon as the add action, sections "Next 7 days", "This month" and "Later", compact cards with an initial avatar, name, type, today badge or short date, and a details arrow. On tap, the user sees the event; personal events remain editable in the existing sheet. There are no registered photos at the moment.

"This month" now means the calendar month of the local date returned by the agenda; a date in the next seven days stays in the first section even when it crosses the month boundary. The remaining dates appear in chronological order, with expansion for long lists. Empty, error, refresh and CRUD states remain available. Visual validation on the device: pending.

Verification of the Events round: 102 mobile tests, TypeScript, formatting and Hermes iOS/Android exports passed. Visual approval on the device pending.

## Full mock set — 2026-11-08

All screens were designed in Claude Design using the project's design system, with the gradient primary, Fredoka/Quicksand and the five-tab floating bar: Home (with three empty variants), Events (list, empty, detail, add, edit, birthday pages), Groups and invitations, Profile and account (special dates, photo, notifications, account options, delete account, terms and privacy), authentication, onboarding (5 steps) and the gift list (list, empty, add, share, member's list, reserve). The target and the product decisions made during the design are recorded in the [design system](../mobile/design-system.md). No code changed; the gift list remains unimplemented and blocked by the decisions above.
