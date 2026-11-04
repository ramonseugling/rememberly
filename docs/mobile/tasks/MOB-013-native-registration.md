# MOB-013 — Native email registration and password recovery

Status: implemented; outbound email and device validation pending.

## Outcome

The unauthenticated Expo stack now includes signup, forgot-password, and reset-password screens. The existing password login keeps its session feedback and gains links to signup and recovery. Authenticated tabs retain their existing session guard.

Signup sends an email verification code through `POST /api/v1/otp`, then submits the name, email, password, six-digit `otp_code`, required birth day/month/year, and explicit `marketing_consent` through `POST /api/v1/users`. Marketing consent starts off and remains optional. Successful creation uses the existing session controller to sign in; if that fails, the user can return to login without recreating the account. Resending a verification code replaces the previous code; the existing backend expires codes after ten minutes and limits attempts.

Recovery uses `POST /api/v1/password/forgot` and preserves its generic account-existence response. A Google-only response explains that Google sign-in is currently available through the website. Reset submits a token and new password to `POST /api/v1/password/reset`, then returns the user to normal password sign-in.

The reset screen accepts a single router token parameter or manual token entry. The parameter is removed from route state after intake, and the token field is concealed. Tokens and passwords are never logged, placed in public configuration, or stored persistently. Reset emails still use the backend's configured website link; native universal/app links and domain associations are not configured by this task.

## Transport and experience

- A small public API adapter uses injected `expo/fetch` against the validated configured API origin. HTTP is permitted only with the explicit development setting. Paths are fixed; cookies are omitted, redirects rejected, and requests cancelled after fifteen seconds or screen unmount.
- Errors are sanitized rather than displaying server or transport internals. Client checks cover names, emails, passwords/confirmation, verification codes, and real birth dates. The server remains authoritative.
- Native screens include safe areas, keyboard handling, readable labels, accessible actions, pending duplicate-submit protection, resend/retry, and success/error feedback. Requests are not queued offline.
- No backend contract, session persistence, dependencies, app identifiers, or signing configuration changed.

## Verification

Executed from `mobile/`:

- `npm run typecheck` — passed.
- `node --experimental-strip-types --test --test-isolation=none tests/auth.test.ts` — six tests passed. Coverage includes exact endpoints/bodies, transport cookie/redirect controls, origin rejection, response destination validation, sanitized errors, malformed responses, cancellation, Google-only recovery, and registration input validation.
- Scoped Prettier checks — passed.

These are local type and injected-transport checks. No outbound email, real signup/reset request, database suite, signed build, native export, production request, or device validation was run for this task. Cloud email provider access is unavailable, so inbox delivery and the complete verification/reset journey remain unverified. Existing backend email/OTP/reset behavior was inspected, not replaced with fabricated successful email delivery.

## Next validation

Use a supported development/staging email provider and disposable accounts to verify delivery, resend, expiration/attempt limits, invalid/consumed reset tokens, signup followed by session restoration, and password-change session revocation. Then validate iOS/Android rendering, keyboard/autofill, back navigation, cancellation, and network failures on real devices. Configure native links separately before promising email links will open this app.
