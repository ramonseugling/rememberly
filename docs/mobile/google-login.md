# Google login: web parity

The mobile app uses the approved web Google flow: system-browser authorization, server-side code exchange and profile lookup, then `googleAuth.findOrCreateUser`. Existing accounts are selected by case-insensitive email, including legacy Google-only accounts. New users follow the same creation rules as web. There is no new account-linking UI or Apple login in this delivery.

## Configuration

Use the existing server-only `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `APP_URL`. In the same Google Cloud OAuth web client, add this authorized redirect URI without removing the existing web callback:

```text
<APP_URL>/api/v1/mobile/auth/google/callback
```

For a backend hosted at `https://rememberly.com.br`, that is `https://rememberly.com.br/api/v1/mobile/auth/google/callback`; use the actual configured host, including `www` when applicable. The current local configuration uses `http://localhost:3000`, which is unsuitable for a physical phone's browser callback. Device validation needs a reachable HTTPS development backend with a matching authorized Google redirect. No deployment or tunnel is created by this task.

The installed app uses the existing `rememberly` scheme. Google redirects to the server HTTPS callback, and the server returns to `rememberly://auth/google`. Google does not receive a custom-scheme redirect URI. Client secrets remain server-side. Expo Go cannot validate this flow; use an installed development build.

## Transport and session

1. The app generates an in-memory verifier and state and opens `/api/v1/mobile/auth/google/start?state=...&code_challenge=...` using `expo-web-browser`.
2. The server records an S256 challenge, random OAuth state digest and five-minute expiry. An HttpOnly SameSite=Lax cookie binds the browser's OAuth callback. Production cookies are Secure. The Google authorization URL uses the existing scopes and account-selection prompt.
3. `/callback` validates state/cookie/expiry before contacting Google, uses the shared web account resolution, and returns a random one-use code and app state. The code expires after one minute; its digest is stored. No Google token or Rememberly session is put in the return URL.
4. The app validates the return scheme, host, path, parameter count and state, then POSTs code, state and verifier to `/exchange`. That endpoint ignores web cookies and uses the existing IP login budget. Code consumption and persistent-session creation share a database transaction; concurrent reuse has one winner.
5. The existing session controller persists only the Rememberly token in SecureStore and handles revocation, failed writes, logout races and account switching. Browser cancellation leaves the app signed out.

The existing ID-token Google/Apple endpoints remain untouched for compatibility, but are not used by this UI. Their separate account-collision policy does not govern this browser flow.

## Validation boundary

Pure mobile tests cover return validation, cancellation, fixed-origin transport and secure-session integration. Real PostgreSQL tests cover shared web account lookup, state/cookie binding, expiry, PKCE rejection, replay, deleted users and concurrent redemption. HTTP tests cover route validation, cancellation and redemption. These checks do not establish real Google delivery, browser/OS callback handling or device readiness.

Official references: [Expo browser authentication](https://docs.expo.dev/versions/latest/sdk/webbrowser/) and [OAuth development-build requirements](https://docs.expo.dev/guides/authentication/).
