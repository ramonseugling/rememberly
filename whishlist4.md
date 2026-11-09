# Consolidated backlog — Gift list and presents in Rememberly

> Historical record of the original proposal. The current execution index is `docs/product/BACKLOG.md`.

## Defined direction

The proposal extends Rememberly from date reminders to **wish lists and gift organization among people in the same groups**.

The first milestone will be a **wish list with secret reservations on mobile**, using the current backend. Public sharing, a dedicated birthday experience and push come in later stages.

Decisions confirmed in this conversation:

- Mobile first; the web wish list is a later delivery.
- Sharing is initially restricted to authorized groups.
- Navigation: **Dates · Groups · Wishes · Profile**.
- Commemorative dates remain available from Profile.
- The previously cancelled minimalist redesign and calendar remain discarded.
- Open business decisions will be recorded as blockers before the respective implementations.

## What already exists and what is new

| Area                                | Current state                                                     | Work needed                                                 |
| ----------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| Accounts, authentication, sessions  | Implemented on web and mobile                                     | Reuse and protect the new features                          |
| Dates and groups                    | Implemented                                                       | Add access to members' wishes                               |
| Personal wish list                  | Absent                                                            | Data, APIs and screens                                      |
| Wish list sharing                   | Absent                                                            | Explicit permissions per group                              |
| Reservations and declared purchases | Absent                                                            | Concurrency, confidentiality and interfaces                 |
| Dedicated birthday page             | Absent                                                            | Person and occurrence identification, authorized reads      |
| Profile photos                      | No functional support identified                                  | Define need and privacy; initially use initials             |
| Push                                | Infrastructure implemented, delivery disabled                     | Configuration, operation and validation on installed builds |
| Deep links                          | Invitations and recovery implemented; notifications open the tabs | Add a specific birthday destination                         |
| Observability                       | Axiom and web Analytics exist                                     | Instrument the new funnel without sensitive data            |

**Important distinction:** group birthdays are derived from users' profiles. A personal event named "Pedro" is free text and does not necessarily identify an account. We will not associate a wish list with someone by name.

## Backlog by milestone

### Milestone 0 — Consolidate context and close the contracts

| ID      | Priority | Delivery and acceptance                                                                                                                                                                |
| ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REM-000 | P0       | Consolidate vision, decisions and backlog in `docs/product/`, preserving the mobile history. Merge useful guidance from the received files without replacing the existing `AGENTS.md`. |
| REM-001 | P0       | Consolidate the audit started in this conversation: existing capabilities, gaps, code references and validation limits. Initial status: **under review**.                              |
| REM-002 | P0       | Close data, authorization, response contracts and lifecycle policies. The reservations implementation is blocked by the decisions listed below.                                        |
| REM-501 | P1       | Diagnose the real requirements for push, links and builds early, reusing existing records. Identify external dependencies without enabling delivery.                                   |

**Corrections to the received documents:** the project uses PostgreSQL with parameterized SQL and no ORM; routes under `/api/v1/`; progressive migrations with automatic rollback disabled. The table and endpoint examples are proposals, not the current state.

### Milestone 1 — Wish list and reservations on mobile

Execute in the order below, with small, verifiable deliveries.

| Order / IDs   | Priority | Delivery and main criterion                                                                                                                                                                       |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — REM-101   | P0       | Persistence of one permanent wish list per user and its items. Title required; optional fields per the approved contract. Private by default.                                                     |
| 2 — REM-201   | P0       | Sharing with groups chosen by the owner. Access requires a current authorized membership and considers the union of common groups.                                                                |
| 3 — REM-102   | P0       | APIs to create, read, edit and delete by the owner. Validate URLs and do not fetch external content.                                                                                              |
| 4 — REM-103   | P0       | **My wishes** screen on mobile: create, edit, delete, empty/error/loading states and selection of authorized groups. Adjust the approved navigation.                                              |
| 5 — REM-202   | P0       | Open another member's wish list through the group. Do not duplicate items when there are several common groups; handle revoked access.                                                            |
| 6 — REM-301   | P0       | Reservation persistence: one globally active reservation per item, including under concurrency and across different groups.                                                                       |
| 7 — REM-302   | P0       | APIs to reserve, mark as purchased and cancel. Only the reserver manages their reservation; conflicts return `409`.                                                                               |
| 8 — REM-303   | P0       | Gift-giver interface with availability and actions. The owner receives only their own wishes, with no reservation or purchase state and no reserver identity.                                     |
| 9 — REM-304   | **P0**   | Implement and test the approved policies for edit/delete, loss of access and account deletion. This story is no longer P1 and blocks the release of reservations.                                 |
| 10 — REM-601A | P1       | Minimal measurement of creation, sharing, viewing and reservation. Use existing observability when sufficient, without logging titles, URLs or secret states on surfaces accessible to the owner. |
| 11 — REM-602A | P0       | Controlled mobile pilot: authorization, concurrency, regressions, interface states and device validation. Reversible release of the new features.                                                 |

**Main dependency:** approved contracts → persistence and permissions → own and members' wish lists → reservations and lifecycle → pilot.

### Milestone 2 — Birthday page and notifications

| IDs             | Priority | Delivery and acceptance                                                                                                                                    |
| --------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REM-401         | P1       | Dedicated birthday page, reusing the registered person and the annual occurrence. Do not create parallel birthdays or link personal events by name.        |
| REM-402         | P1       | Show wishes only when the visitor has access. The birthday person's page keeps showing no reservation data.                                                |
| REM-502A        | P1       | Extend navigation and payloads to open the right person/occurrence, including after login. Revalidate authorization at the destination.                    |
| REM-502B        | P1       | Prepare and validate real push: credentials, installed builds, permissions, receipt processing, retries and monitoring. Reuse the existing infrastructure. |
| REM-601B / 602B | P1       | Measure birthday/notification opens and validate the integrated release.                                                                                   |
| REM-403         | P2       | Make greetings easier using sharing or another approved capability, with no automatic sending on the user's behalf.                                        |

Push will not be a requirement to initially validate the value of wish lists and reservations.

### Later evolutions

- **Web wish list:** offer the experience to people who arrive through an invitation without installing the app.
- **REM-203:** revocable public link, with no reservation or purchase information.
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

- Reuse the existing backend, sessions, groups and MVC patterns. Do not create a backend exclusive to the mobile wish list.
- Explicitly separate the owner's and the gift-givers' responses. Hiding information in the interface does not satisfy the confidentiality requirement.
- Treat availability as derived from reservations; protect exclusivity in the database and in transactions.
- Revalidate access on every read and change; caches, errors and alternative responses must not reveal reservations to the owner either.
- Validate races with a real PostgreSQL: two users trying to reserve the same item, including through different groups.
- Cover owner, authorized member, third party, former member, multiple groups, revocation and account deletion.
- Test request repetition, network failures, session expiry and data refresh on mobile.
- Preserve authentication, events, groups, emails and already approved flows. Push and link tests on installed builds stay separate from Expo Go tests.

The result of this stage is a backlog organized and compared with the code. **No file was changed and no new functionality is being declared as implemented.**
