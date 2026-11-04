# Mobile instructions

This directory contains the independent Expo application foundation and password-session flow. Read the root instructions, this directory's `README.md`, and the relevant documents under `docs/mobile/`. Password sessions, native agenda/event CRUD, group management, profile editing, commemorative subscriptions, email signup/recovery UI, and other-session cleanup are implemented. Provider email delivery, push, social login, universal links, account deletion, and real-device behavior remain separate requirements.

## Commands and configuration

- Run commands from `mobile/` using its own package/lockfile and Node.js 24: `npm ci`, `npm run start`, `npm run typecheck`, `npm run test:config`, `npm run test:sessions`, `npm test` (all pure tests), and `npm run format:check -- --ignore-path .prettierignore`.
- Provide `EXPO_PUBLIC_APP_ENV` and `EXPO_PUBLIC_API_URL` via ignored local configuration or the process environment. The API URL must be an origin; staging and production require HTTPS. No production default is defined.
- `EXPO_PUBLIC_APP_ENV=development EXPO_PUBLIC_API_URL=http://localhost:3000 npm run export:native` exports both platform JavaScript bundles to ignored `dist/`; it is not a signed native build or device test.
- The Node configuration tests cover the client origin trust boundary. Add a UI test framework only when there is a concrete behavior to validate.

## Implementation boundaries

- Build for iOS and Android using React Native, Expo, and TypeScript. Choose compatible versions from the Expo SDK matrix at bootstrap time; do not inherit the web React version blindly.
- Keep mobile dependencies, lockfile, configuration, and build commands independent of the root web application.
- Root TypeScript, Jest discovery, Prettier, and Vercel upload configuration explicitly exclude this mobile project. Preserve that isolation when changing build tooling; a nested folder alone does not provide it. Root backend tests under `tests/integration/api/v1/mobile/` remain included. Verify root checks when changing these boundaries.
- Do not import from root `pages`, `components`, `models`, `infra`, or undocumented internal `lib` paths. Use HTTPS API contracts. Share pure code only through an explicit package when justified.
- Keep the app portable to a future separate repository. Avoid assumptions about parent-directory files in builds.
- Use native components, Expo Router, and platform accessibility conventions. Reuse product identity rather than web DOM components.

## Data and identity

- Use environment-specific API URLs; public Expo variables must contain no secrets.
- Store session credentials using platform-backed secure storage. Do not put credentials in ordinary cache, logs, links, analytics, or screenshots.
- Handle session expiration, logout, account switching, and cache cleanup explicitly. Revocation occurs on the server as well as on the device.
- Native HTTP uses `expo/fetch`, with `credentials: 'omit'` and `redirect: 'error'`. Preserve those controls; RN global fetch is not a drop-in trust-boundary replacement. Session client tests cover transport options and response rejection; device behavior still needs validation.
- Secure Store keys are scoped to environment and API origin. The controller's observable state contains no credential; only the token is persisted securely. User-data requests use the controller-owned transport and invalidate only the matching current session on 401; focus-aware resources hide stale account results. Preserve those epoch/scope checks.
- Preserve pending navigation across login, but validate destinations and resource access. Use the system browser for OAuth.
- Keep server state and temporary form state separate. Prefer existing patterns before adding state libraries.

## Experience and validation

- Implement loading, empty, error, retry, offline, and permission-denied states for each relevant flow.
- MVP writes require connectivity; do not silently queue offline writes or promise offline editing.
- Support safe areas, keyboard behavior, readable text scaling, screen readers, and platform back navigation.
- Push must work through the server; do not rely on an always-running app. Never claim guaranteed delivery.
- Use focused local checks first. Device testing is required for push, links, social login, and release validation. Expo Go alone is insufficient evidence.
- Do not add placeholder mobile scripts or claim a device/build check passed without executing it. Add tested commands to these instructions after bootstrap.

## Releases

- Separate development, staging, and production identifiers and credentials.
- EAS remote builds are the proposed cloud workflow. This Linux environment cannot run the iOS simulator.
- Store submission, release approval, and environment publication are distinct operations. Perform external publishing only within explicit user authorization.
