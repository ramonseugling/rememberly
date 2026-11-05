# MOB-004: Bootstrap the independent Expo application

Status: done

## Outcome

Create a minimal, independently installable Expo/React Native application under `mobile/`, with native navigation, theme, explicit API environment selection, and verified development commands.

## Context and dependencies

Read the root and mobile instructions and [Architecture](../architecture.md). This task is independent of the profile/agenda contract work in MOB-003. It does not implement those endpoints or consume speculative response shapes.

## Scope and ownership

- The mobile agent owns `mobile/**`: compatible Expo dependencies, its own lockfile/configuration, native routes and theme, API origin configuration, and validated commands.
- The coordinating agent owns root isolation: exclude the native project from web TypeScript, root Jest discovery, root formatting, and Vercel deployment input. Keep root dependencies and application behavior unchanged.
- The API-contract agent owns only its new contract and task documents. Database tests are not run concurrently.
- Use shared checkout files with disjoint ownership. No worktree, store enrollment, provider login, remote native build submission, or deployment is required.

## Acceptance criteria

- [x] Mobile dependencies and commands work independently from the root app.
- [x] Expo SDK and native library versions are compatible and documented.
- [x] Native navigation/theme render honest foundation screens without claiming implemented data features.
- [x] API URL selection is explicit and contains no production default or credentials.
- [x] Mobile type checking and platform JavaScript exports pass, or a precise external blocker is documented.
- [x] Root TypeScript/Jest do not include the native project; existing mobile API tests under root `tests/` remain discoverable.
- [x] Root lockfile is unchanged; native dependencies/build outputs are not included in the Vercel source upload.

## Verification

Run tested commands from `mobile/`. Platform JavaScript export is not a signed build or device validation. Compare root type diagnostics with the pre-bootstrap baseline. Check effective Jest discovery and run a relevant existing API suite after changing its configuration. Format each project with its own configuration and inspect tracked/untracked outputs.

## Completion record

- Result: independent Expo Router foundation created after session checkpoint `052cf94`; API specification and native bootstrap completed in parallel with disjoint file ownership.
- Checks: mobile npm ci, type checking, three executed configuration tests, local formatting, offline SDK dependency validation, and iOS/Android Hermes JavaScript exports passed. Root Jest discovers 42 backend suites and the focused mobile-session API run passed 40 tests. Root TypeScript excludes mobile and retains exactly nine pre-existing diagnostics. Root package manifest/lockfile are unchanged. The Vercel ignore pattern excludes the native project and retains the backend mobile API routes.
- Limitations: online Expo dependency validation could not reach the Expo API through the configured proxy; supported offline validation and the SDK bundled-module matrix passed. JavaScript exports are not signed builds or device validation. No login/data flows, EAS identity, signing, or store setup exists yet.
- Next action: implement MOB-005 backend reads and MOB-006 native sessions in parallel. Provide an approved device-reachable test API before real-device validation.
