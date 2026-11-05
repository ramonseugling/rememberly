# MOB-016 — Durable login rate limits

Status: done

## Outcome

Apply one PostgreSQL-backed email/IP budget to web and mobile password login, preserving existing cookie and Bearer behavior. See [login rate limits](../login-rate-limits.md) for limits, identity trust, storage, responses, and deployment boundaries.

## Implementation

- Forward migration creates indexed durable buckets with scope and attempt constraints.
- Atomic, database-clock fixed-window admission; bounded expiry cleanup and sanitized fail-closed storage failures.
- Both login routes enforce the same budgets before password authentication.
- Dedicated pure identity, concurrent database, and real HTTP tests cover budgets, spoofing, successful/failed attempts, shared routes, and storage failures.

## Verification

Focused integration passed on the disposable local PostgreSQL database and a real Next.js server: 7 suites / 58 tests covering the limiter model, shared web/mobile HTTP limits, existing mobile sessions, and all four web session suites. The pure source-IP identity suite passed 4 tests, including spoofed headers, Vercel runtime markers, IPv6 normalization, and a conservative missing-IP fallback. Root TypeScript and formatting of owned files passed.

The first sandboxed integration attempt could not connect to localhost; the supported escalation allowed the same checks to pass. No production deployment, hosted CI run, or physical-device validation is included.

Next action: apply the forward migration before deploying either updated login route and observe authentication/error rates after release. Confirm trusted source-IP handling for the actual hosting provider before changing proxy infrastructure.
