# Rememberly mobile

Independent Expo Router / React Native app for iOS and Android using the existing Rememberly backend. Implemented: persistent password login; native agenda and event CRUD; groups, memberships and invite sharing; profile editing; commemorative subscriptions; signup/OTP and password-recovery UI; password-confirmed sign-out of other sessions. No fabricated user data is presented as real.

These are implemented flows with local tests, not a claim of device/store readiness. Email delivery, native link association, actual push delivery, social login/provider reauthentication, and release validation remain pending.

## Toolchain

Use Node.js 24. Expo SDK 58.0.21, React 19.3.0, React Native 0.88.1, Router 58.0.28, and TypeScript 6.0.3 were selected from official `expo-template-tabs@58.0.30` metadata and Expo's bundled native-module compatibility matrix. React DOM is pinned to 19.3.0 because Router's transitive peers otherwise select an incompatible patch; this does not enable a separate mobile web target.

The package manifest and lockfile belong to this directory. Commands below run from `mobile/`; installing the web root does not install this app. No root source files, package aliases, or backend models are imported.

## Install and configure

```sh
npm ci
cp .env.example .env.local
```

Edit `.env.local` with public configuration only:

- `EXPO_PUBLIC_APP_ENV`: `development`, `staging`, or `production`.
- `EXPO_PUBLIC_API_URL`: API origin such as `https://api.example.com`, with no path, query, fragment, or credentials. There is deliberately no production default. HTTP is accepted only in development.

These variables are embedded in the client bundle; never put tokens or provider secrets in them. The app validates configuration at startup and sends session requests only to the configured origin. A physical device's `localhost` refers to that device, not the cloud backend. Choose a development API origin reachable from the test device through the supported network setup; changing this URL does not expose the cloud server automatically. Never use production user data for development tests.

## Commands

```sh
npm run start
npm run typecheck
npm run test:config
npm run test:sessions
npm test
npm run format:check -- --ignore-path .prettierignore
```

`start` runs Metro for development. In a restricted/offline cloud environment, use `npm run start -- --offline` to start local bundling without Expo service requests. The three configuration tests cover origin normalization, missing environment/URL settings, HTTPS requirements, and rejection of credential-bearing or non-origin URLs. They use Node's built-in test runner with isolation disabled so the TypeScript cases execute correctly in the validated Node 24 environment; no app testing framework has been introduced.

For a local iOS/Android JavaScript export with explicit development configuration:

```sh
EXPO_PUBLIC_APP_ENV=development EXPO_PUBLIC_API_URL=http://localhost:3000 npm run export:native
```

Exports go to ignored `dist/`. This checks bundling for both platforms; it does not produce signed IPA/AAB files, install the app, or validate appearance and native behavior on a device. The example API origin is for compilation, not a physical-device connectivity claim.

## Sessions and transport

Sessions use `/api/v1/mobile/sessions`; controller-owned authenticated requests consume the mobile read APIs and existing mutation routes. Public signup/recovery requests use a separate fixed-origin transport without credentials. Tokens are stored using Expo SecureStore, scoped to the selected environment and API origin, with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` keychain accessibility on iOS. The SecureStore config plugin handles native configuration, including Android backup exclusions. Provider credentials never belong in public configuration.

Startup and foreground revalidation check the saved token before exposing identity. A rejected session clears local access; a network or server outage preserves the credential and offers retry or sign-out. Native navigation protects the authenticated tabs. Password sign-in is explicitly unavailable for Google-only accounts.

Logout clears identity immediately, serializes secure-storage cleanup, and revokes the captured session. Storage or revocation failures are shown explicitly with retry. Failed revocation tokens are retained only in memory for the current process; restarting after offline logout cannot guarantee server revocation. A failed account switch never intentionally restores the previous account, and stale requests cannot overwrite a newer session.

The native adapter uses `expo/fetch` with cookies omitted and redirects rejected; the client always targets the fixed configured origin, rejects unexpected status/identity responses, sanitizes errors, and times requests out. Inspection of the installed SDK's iOS/Android transport implementations confirms these options have native handling; this is not device test evidence. Focus-aware data resources scope results to the exact authenticated identity, cancel obsolete reads, and suppress old-account responses. Screens never receive a session token. Password confirmation failure is 403 so it does not invalidate the current session.

The 15 session/controller/HTTP behavior tests exercise restoration, 401 versus outage handling, revocation, secure-storage failure, delayed-request/write races, account switching, credential isolation, and response rejection with deterministic injected adapters. A separate live smoke used the actual client/controller and Node transport against the local backend with one disposable user, covering login, identity, saved-token restoration, invalid-password denial, logout, and confirmed revocation; the fixture was removed. Node memory storage in that smoke does not validate native keychain storage or rendering.

## Native builds and next work

Store identifiers, app icons, signing, EAS project identity/profiles, and deep-link domain associations have deliberately not been assigned. Choose development/staging/production identities before a signed build. No paid service, account enrollment, native project generation, EAS build, or store submission is part of this foundation.

Next, validate all native flows on actual iOS/Android devices and implement the remaining push activation, social-login, link-association, provider reauthentication, and release requirements. Push, authentication, links, and release behavior require real device validation. Expo Go or a successful export alone does not establish that readiness.

## Latest integrated checks

The combined mobile run passed 55 pure tests (config, session/transport races, data requests, forms, permissions, and public-auth flows), type checking, and formatting. Both platform JavaScript exports were verified separately. The matching backend selection passed 41 suites / 311 tests. Five provider-email suites are explicitly excluded from CI; email signup/recovery UI is tested with injected transport, not real delivery. See [CI coverage](../docs/ci.md). Hosted CI has not run yet and does not currently block Vercel.

Profile birthday fields cannot yet be cleared once saved because the existing backend update preserves null values; the UI explains this. Group invitations can be shared and joined by code; automatic native invitation links require domain association. Reset tokens can be entered manually or provided as route parameters, without claiming universal-link setup.

## Account deletion and push settings

Profile includes password-confirmed account deletion and push registration/preferences. Owners must first delete their owned groups. The website also exposes /account-deletion for authenticated deletion requests. The server now enforces shared persistent login budgets; migration deployment must precede updated login routes.

Push preferences default to off. Remote delivery also requires PUSH_DELIVERY_ENABLED on the server, APNs/FCM setup, real device validation, and a receipt/retry trigger more frequent than the existing daily job. Expo Go cannot exercise this registration path; use a configured development/release build. Successful registration is not delivery confirmation. Notification content is generic and contains no names/date titles; the Android channel is reminders.

Latest combined checks: 71 mobile cases, clean types/formatting, frozen installation, and both platform JS exports; root selected suites passed 405 tests across 48 files. Five email-provider suites and real browser/device/provider delivery remain unverified. No signed build, store submission, or production deployment is part of these changes.
