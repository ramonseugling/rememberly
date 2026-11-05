# Development builds

These builds validate the existing web features in an installed app. They do not submit to stores, enable push delivery or configure deployment automation.

Confirmed prerequisites as of 2026-11-05: the user does not yet have Apple Developer enrollment or a separate HTTPS development backend. Physical iPhone installation and live Google callback validation therefore remain pending. Build configuration is prepared; no remote build has been submitted. Production remains unchanged.

## Current configuration

- The user approved `br.com.rememberly.app.dev` for both the iOS bundle identifier and Android application ID on 2026-11-05.
- `mobile/app.json` preserves the existing EAS project and `rememberly` scheme and adds these development identifiers. They must not be reused for a future production release.
- `mobile/eas.json` has only an internal `development` profile, using Node 24, `expo-dev-client`, and the EAS development environment. No store profile or auto-submit is configured.
- Configure `EXPO_PUBLIC_API_URL` in the EAS development environment with a development backend reachable from the phone. Do not use production data. The build profile sets `EXPO_PUBLIC_APP_ENV=development`. No secrets belong in Expo public variables.

From `mobile/`, after configuring the API and signing:

```sh
npx eas-cli build --profile development --platform android
npx eas-cli build --profile development --platform ios
```

Android produces an installable development build. Physical iOS builds require the user's Apple development team, signing credentials and registered test device. Those identifiers/credentials have not been supplied or invented. Remote build submission is a separate operation; these commands are documented, not evidence that a signed build has run.

For Metro, with the same public API configuration:

```sh
npm run start -- --dev-client
```

Google uses [the shared web flow](google-login.md). Register its additional HTTPS callback in the existing Google Cloud client. Expo Go remains usable for supported previews, but Google sign-in is disabled there.

## HTTPS invitation and recovery links

Existing native parsers and screens already support the approved invitation and password-recovery URLs. Follow [native links](native-links.md) for actual domain association. Configuration still needs the Apple Team ID and Android signing certificate fingerprints before association files can truthfully identify this installed app. Website fallback is preserved. No placeholder association file or claim of verified OS routing is added.

## Evidence

Type checks and platform JS exports validate source/configuration and bundling, not signing, installation, provider redirects, email receipt or OS link delivery. Record actual signed-build/device results before marking this work complete.

References: [Expo development profiles](https://docs.expo.dev/build/eas-json/) and [internal distribution](https://docs.expo.dev/build/internal-distribution/).
