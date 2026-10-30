# API inventory and contract work

Inventory inspected against commit `8a7fafa99656dbe46efefca27cc556eb8982df85`. Recheck implementation before changing a contract. This is an inventory and gap analysis, not an approved request/response specification.

## Existing behavior

| Capability                      | Source                                                                       | Mobile gap                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Protected API                   | `infra/controller.ts`                                                        | Accepts cookie or Bearer; verify all exceptions individually                        |
| Login/session/logout            | `pages/api/v1/sessions/index.ts`                                             | POST sets cookie without token in JSON; GET/DELETE read only cookies                |
| Session lifetime                | `models/session.ts`                                                          | Opaque token with 30-day expiration; no implemented refresh protocol                |
| Registration and profile update | `pages/api/v1/users/index.ts`                                                | POST registration and authenticated PATCH; no full profile GET or account DELETE    |
| OTP/password recovery           | `pages/api/v1/otp`, `pages/api/v1/password`                                  | Depends on email; native navigation and link handling needed                        |
| Google login                    | `pages/api/v1/auth/google`, `models/google-auth.ts`                          | Web cookie state and callback redirect; no native exchange flow                     |
| Personal events                 | `pages/api/v1/events/index.ts`, `pages/api/v1/events/[id].ts`                | CRUD available; preserve ownership checks                                           |
| Combined agenda                 | `pages/dates.tsx`                                                            | SSR combines personal events and group birthdays; expose equivalent data            |
| Groups                          | `pages/api/v1/groups`                                                        | Existing listing, creation, details, updates, deletion, join, and member management |
| Group invitations               | `pages/join-group.tsx`                                                       | Web URL with invite code; native link/resume and optional preview contract needed   |
| Commemorative dates             | `pages/commemorative-dates.tsx`, `pages/api/v1/commemorative-dates/[key].ts` | SSR reads catalog/preferences; API currently toggles by key                         |
| Notifications                   | `models/notification.ts`                                                     | Email delivery; no device, preference, push, or receipt contract                    |

## Proposed contract sequence

1. Define mobile credential issuance, authenticated session inspection, and revocation; retain web cookie behavior. See [MOB-001](tasks/MOB-001-session-contract.md).
2. Define profile retrieval and a unified agenda with explicit source type, stable IDs, permissions, and ordering.
3. Define commemorative catalog plus user subscriptions.
4. Define device installation registration/removal and notification preferences.
5. Define authenticated account deletion and its data/identity cleanup semantics.
6. Define native social authentication and link exchanges if included in launch scope.

Paths such as `/api/v1/me` or `/api/v1/agenda` are candidates, not existing or frozen endpoints. Choose additive routes or explicit modes after assessing current consumers; do not return mobile tokens to every web login by accident.

## Required detail for each implemented contract

- Method/path, authentication source, validated input, response shape, and status codes.
- Example success and failure bodies, with no real credentials or user data.
- Authorization rules, expiration/revocation, and replay or duplicate-request behavior where applicable.
- Compatibility with web and already released app versions; list/ordering limits where relevant.
- Executable tests for the contract, including denial paths and affected legacy behavior.

Existing controller errors generally contain `name`, `message`, `action`, and `status_code`; individual session handlers have custom responses. Do not claim global uniformity until exceptions are checked. Preserve existing consumers or explicitly migrate them.

Reference inventory by source paths; keep final request/response definitions in this document or a linked machine-readable specification when one is introduced. Avoid separate competing TypeScript, Markdown, and schema definitions maintained manually.
