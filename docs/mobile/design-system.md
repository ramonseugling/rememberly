# Mobile design system — warm minimalism

Updated 2026-11-08. Status: the visual direction below was designed as high-fidelity mocks in Claude Design (canvas of 46 mobile boards) and is the **target**. The code in `mobile/src/design-system/` still implements the previous palette (solid primary, native system font) and is **not migrated yet**; see [Implementation status](#implementation-status).

## Direction

Soft pink backgrounds, light cards with a thin border and a discreet shadow, circular avatars, and a pink-to-peach brand gradient on every primary element. Friendly but not childish: copy avoids romantic wording (events are for family, friends and colleagues, not only partners).

Source of truth for screens: the Claude Design canvas (`Rememberly mobile screens`). The earlier pixel-sampled references in `docs/mobile/references/` remain as history.

## Tokens

| Role              | Value                                  | Use                                                 |
| ----------------- | -------------------------------------- | --------------------------------------------------- |
| background        | `#FCF4F8` → `#FDF9FB` (vertical)       | Screen background                                   |
| surface           | `#FDF9FB`                              | Cards and panels                                    |
| surfaceMuted      | `#F3E6EF`                              | Neutral badges, close buttons, disabled             |
| text              | `#221921`                              | Primary content                                     |
| textMuted         | `#594553`                              | Secondary content                                   |
| border            | `#F0E4EC`                              | Card and row borders                                |
| controlBorder     | `#A28698`                              | Field and selector boundaries                       |
| brand             | `#E53565`                              | Icons, links and "Back" actions                     |
| accentText        | `#ED5E8E`                              | Text actions on light backgrounds                   |
| brandGradient     | `hsl(340,80%,65%)` → `hsl(25,90%,65%)` | See below                                           |
| iconSurface       | `#FEE6E8` (soft: `#FEF1F7`)            | Icon circles, secondary buttons, "in N days" badges |
| todaySurface      | `#FEDECB`                              | "Today" highlights                                  |
| danger / surface  | `#B42335` / `#FDECF0`                  | Errors and destructive actions                      |
| success / surface | `#245B34` / `#EAF5E8`                  | Confirmations and the WhatsApp action               |

The brand gradient (135°) is used for: primary buttons (white text), selected chips and tabs, switches when on, initials avatars (fallback when there is no photo), the wordmark, and the active tab icon and label. Secondary buttons use `iconSurface` with `accentText`. Do not use a flat pink for primary actions.

### Typography

- Headings: **Fredoka** 600/700. Body: **Quicksand** 400–700 (same families as the web app).
- Scale (size/line): title 24/30, section 20/26, card title 16–18, body 14/20, label 16/22 at 600, caption 12/17.
- Respect the system font scale; never truncate instructions or essential errors.

### Shape and spacing

- Radii: control 12, button 16, row/card 22, panel/sheet 28, badge 10, avatar full.
- Spacing: 4, 8, 12, 16, 20, 24, 32, 40. Side margin 16, card padding 16.
- Minimum touch target 48 × 48. Lucide icons, 18–24, consistent stroke.
- Card shadow: `0 2px 6px rgba(108, 39, 77, 0.06)`. Floating bar shadow: `0 8px 24px rgba(108, 39, 77, 0.16)`.

## Navigation

Floating pill bar (blurred, inset 16 from the screen edges) with five tabs: **Home, Events, Groups, Gifts, Profile**. The active tab has a soft pink pill and the gradient icon and label. There is no central action button: "Add event" is a full-width gradient button inside Events, and "Create group" lives in Groups.

## Screen inventory (mocks)

| Area           | Screens                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Home           | Main, no upcoming events, no events, no groups                                                                             |
| Events         | List, empty, detail, add, edit, notification permission modal, birthday event page (today and early reminder)              |
| Groups         | List, create, events, members, settings (with photo), invitation, leave, photo sheet, empty                                |
| Profile        | Profile, special dates, photo sheet, notifications (on and off), account options, delete account, terms and privacy        |
| Authentication | Login, sign up, code (OTP), forgot password, new password                                                                  |
| Onboarding     | Five steps: welcome, events, groups, gifts, profile                                                                        |
| Gift list      | My list (normal and birthday-today hero), empty, add item, share (groups and WhatsApp link), a member's list, reserve item |

## Product decisions made during the design

- Wording: "events" everywhere (never "dates"); "gift list" and tab "Gifts" (never "wishes").
- Event notifications are a single preference per channel (push and email); early reminders are not a separate setting.
- Notification permission is requested after the first event is created or the first group is joined, never at first login.
- Group invitations are always a link; there is no invitation code.
- Groups and the profile support a photo (pencil on the avatar); the fallback is initials on the brand gradient.
- Account: "Sign out" and "Delete my account" live in the account options page; deletion requires typing the phrase "Delete my account" (localized in the UI as "Excluir minha conta").
- "Terms and privacy" is its own page under Profile, like special dates, notifications and account options.
- The birthday event page (opened from a push notification) shows the person, date, group and their gift list. It has no "send greetings" button and no options menu: events are edited from the Events screen.
- Gift list sharing: per group, plus a revocable WhatsApp link (public link scope is tracked in the product backlog as REM-203).

## Components and states

Semantic text; primary/secondary/destructive/text buttons; field with label, hint and error; selector in a sheet; card; list row; badge; switch; checkbox; six-digit OTP; feedback; bottom sheet.

Every control handles focus, pressed, disabled and loading where applicable. Error and success use text or an icon in addition to color. Spinners and messages need accessible labels. Sheet: stationary backdrop with independent opacity, translation only on the content, pending behavior preserved, and reduced motion respected.

## Implementation status

- Done: tokens (`tokens.ts`) now use the mock gradient `#ED5E8E` → `#F69855` for primary buttons and `#ED5E8E` accent text; contrast is below AA by product decision (D-13). Previously done (old palette): isolated base in `mobile/src/design-system/`, a development-only catalog (route-gated, authenticated, `development` environment and DEV bundle), and pilots for Events, Profile and Home. Remaining differences: solid `#D52555` still used for checkbox, switch and focus; selected chips/tabs gradients; native system font token unused.
- Not done: gradient primary and selected states, Fredoka/Quicksand in the native app, the Gifts tab (currently labeled with a "coming soon" placeholder), and every screen in the inventory that is not an existing pilot. Migration of the remaining screens is tracked task by task in the [mobile screens backlog](../product/MOBILE-SCREENS-BACKLOG.md) (DS-005 in the [product backlog](../product/BACKLOG.md) is superseded by it).
- Visual approval on a device is the user's call and cannot be inferred from types, tests or bundles.

## Validation criteria

Check contrast (normal text 4.5:1, large text and field boundaries 3:1, including white text on both gradient stops), touch targets, enlarged text, labels, error/success, keyboard, safe areas and reduced motion. Run types, formatting, relevant tests and Hermes iOS/Android exports. Do not write tests that only mirror styles. Signed builds, the Google provider, push and HTTPS association stay out of visual acceptance in Expo Go.

## History

- 2026-11-06: first proposal and pilots; rejected (97 mobile tests, TypeScript, formatting and Hermes exports passed).
- 2026-11-07: revision from a reference mock, then from a pixel-sampled crop of the home screen; new Home screen and five-tab navigation; Events pilot (102 tests). Visual approval pending.
- 2026-11-08: full mock set in Claude Design with the gradient primary, Fredoka/Quicksand and the screens above. Documentation updated; code not changed.
