# API inventory and contract work

Original inventory inspected against commit `8a7fafa99656dbe46efefca27cc556eb8982df85`, updated for MOB-002 and MOB-005 implementation in this working tree. Recheck implementation before changing a contract. The [mobile session contract](session-contract.md) is implemented and locally verified; it has not been deployed.

## Existing behavior

| Capability                      | Source                                                                       | Mobile gap                                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Protected API                   | `infra/controller.ts`                                                        | Accepts cookie or Bearer; verify all exceptions individually                                                 |
| Login/session/logout            | `pages/api/v1/sessions/index.ts`                                             | POST sets cookie without token in JSON; GET/DELETE read only cookies                                         |
| Session lifetime                | `models/session.ts`                                                          | Web sessions expire after 30 days; implemented mobile sessions have nullable expiration and remain revocable |
| Registration and profile update | `pages/api/v1/users/index.ts`                                                | POST registration and authenticated PATCH; no full profile GET or account DELETE                             |
| OTP/password recovery           | `pages/api/v1/otp`, `pages/api/v1/password`                                  | Depends on email; native navigation and link handling needed                                                 |
| Google login                    | `pages/api/v1/auth/google`, `models/google-auth.ts`                          | Web cookie state and callback redirect; no native exchange flow                                              |
| Personal events                 | `pages/api/v1/events/index.ts`, `pages/api/v1/events/[id].ts`                | CRUD available; preserve ownership checks                                                                    |
| Combined agenda                 | `pages/dates.tsx`                                                            | SSR combines personal events and group birthdays; expose equivalent data                                     |
| Groups                          | `pages/api/v1/groups`                                                        | Existing listing, creation, details, updates, deletion, join, and member management                          |
| Group invitations               | `pages/join-group.tsx`                                                       | Web URL with invite code; native link/resume and optional preview contract needed                            |
| Commemorative dates             | `pages/commemorative-dates.tsx`, `pages/api/v1/commemorative-dates/[key].ts` | SSR reads catalog/preferences; API currently toggles by key                                                  |
| Notifications                   | `models/notification.ts`                                                     | Email delivery; no device, preference, push, or receipt contract                                             |

The additive `/api/v1/mobile/sessions` route now implements password login, Bearer lookup, and revocation. The existing web route remains unchanged. See [MOB-002](tasks/MOB-002-session-api.md) for validation evidence.

## Contract sequence

1. Mobile sessions: specified in MOB-001 and implemented/locally verified in [MOB-002](tasks/MOB-002-session-api.md); public release requirements remain tracked in the contract.
2. Profile, agenda, and commemorative catalog reads: specified in [data contracts](data-contracts.md) by [MOB-003](tasks/MOB-003-data-contracts.md); implemented and locally verified by [MOB-005](tasks/MOB-005-data-api.md).
3. Integrate mobile data consumers after the read endpoints are implemented; existing subscription and other mutation APIs remain unchanged.
4. Define device installation registration/removal and notification preferences.
5. Define authenticated account deletion and its data/identity cleanup semantics.
6. Define native social authentication and link exchanges if included in launch scope.

The specified data-read routes use `/api/v1/mobile/me`, `/api/v1/mobile/agenda`, and `/api/v1/mobile/commemorative-dates`; they are implemented and locally verified, with no production deployment yet. Choose additive routes or explicit modes after assessing current consumers; do not return mobile tokens to every web login by accident.

## Required detail for each implemented contract

- Method/path, authentication source, validated input, response shape, and status codes.
- Example success and failure bodies, with no real credentials or user data.
- Authorization rules, expiration/revocation, and replay or duplicate-request behavior where applicable.
- Compatibility with web and already released app versions; list/ordering limits where relevant.
- Executable tests for the contract, including denial paths and affected legacy behavior.

Existing controller errors generally contain `name`, `message`, `action`, and `status_code`; individual session handlers have custom responses. Do not claim global uniformity until exceptions are checked. Preserve existing consumers or explicitly migrate them.

Reference inventory by source paths; keep final request/response definitions in this document or a linked machine-readable specification when one is introduced. Avoid separate competing TypeScript, Markdown, and schema definitions maintained manually.
