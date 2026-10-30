# Mobile instructions

This directory is reserved for the Rememberly Expo application. No application, package manifest, or runnable mobile command exists yet. Read the root instructions and `docs/mobile/README.md`.

## Implementation boundaries

- Build for iOS and Android using React Native, Expo, and TypeScript. Choose compatible versions from the Expo SDK matrix at bootstrap time; do not inherit the web React version blindly.
- Keep mobile dependencies, lockfile, configuration, and build commands independent of the root web application.
- At bootstrap, explicitly isolate the mobile tree from root TypeScript, Jest discovery, formatting, and deployment/build contexts as appropriate. Root TypeScript currently includes all `**/*.ts` and `**/*.tsx`, so a nested folder alone does not provide isolation. Verify root checks after introducing mobile source.
- Do not import from root `pages`, `components`, `models`, `infra`, or undocumented internal `lib` paths. Use HTTPS API contracts. Share pure code only through an explicit package when justified.
- Keep the app portable to a future separate repository. Avoid assumptions about parent-directory files in builds.
- Use native components, Expo Router, and platform accessibility conventions. Reuse product identity rather than web DOM components.

## Data and identity

- Use environment-specific API URLs; public Expo variables must contain no secrets.
- Store session credentials using platform-backed secure storage. Do not put credentials in ordinary cache, logs, links, analytics, or screenshots.
- Handle session expiration, logout, account switching, and cache cleanup explicitly. Revocation occurs on the server as well as on the device.
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
