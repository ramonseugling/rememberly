# Rememberly

## Product vision

A multi-user application to record important dates for people and receive email notifications on the day of the event.

**Problem it solves**: remembering annual dates like birthdays, weddings, and relationship anniversaries of the important people in your life.

### Entities

**User**

- `name` — full name
- `email` — email address (unique, case-insensitive)
- `password` — bcrypt hash (nullable — users who sign up via Google may not have a password)
- `birthday` — the user's own birthday (optional)
- `is_admin` — admin flag
- `id`, `created_at`, `updated_at`

**Event**

- `title` — free text (e.g. "Pedro", "Dating anniversary with Ana")
- `type` — enum: `birthday`, `dating_anniversary`, `wedding_anniversary`, `celebration`, `custom`
- `custom_type` — free text when `type = 'custom'`
- `date` — day + month (year optional — events repeat annually)
- `reminder_days_before` — how many days in advance to send a reminder. Valid values: `0, 1, 3, 7, 15, 30` (`0` = only on the day)
- `user_id` — FK to the owner user
- `id`, `created_at`, `updated_at`

**Group / GroupMember**

- Groups for sharing events across multiple users (e.g. family, team)
- `group_members` links `user_id` to `group_id` with a role

**Session, OtpToken, PasswordResetToken** — supporting tables for auth.

### Business rules

- Each user sees and manages only their own events (and those of groups they belong to)
- Events repeat annually on the same date
- On the event day the user receives an email; if `reminder_days_before > 0`, they also receive an advance reminder email
- A daily cron job (Vercel Cron) checks the day's events and sends the emails

### Main flow

1. Sign up with email OTP OR sign in with Google
2. User creates events (title, type, date, reminder advance)
3. Every morning they receive emails for events that fall today + reminders for upcoming events

### Access

- Open registration — via email (with OTP) or Google OAuth

## Technical decisions

### Notifications

- **Cron job**: Vercel Cron Jobs — runs daily in the morning by calling an internal endpoint (authorized via `CRON_SECRET`)
- **Email**: Resend (via `resend` SDK) — sender domain `rememberly.com.br`
- Locally: uses the Resend sandbox (`onboarding@resend.dev`), which only delivers to the account that owns the API key

### Auth

- Custom DB-backed session (HttpOnly cookie `session_token`, 30-day expiry)
- Sign up with email OTP (`otp_tokens` table)
- Password reset with token (`password_reset_tokens` table)
- Google OAuth login (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)

### UI

- **Tailwind CSS v4** with `@theme` (no `tailwind.config.ts`)
- **shadcn/ui** for base components (`components/ui/`)
- **Google Fonts**: Fredoka (headings) + Quicksand (body) via `next/font/google`
- Design system defined in `styles/globals.css`

### Observability

- Logging via `next-axiom` — datasets in Axiom (`AXIOM_DATASET`, `AXIOM_TOKEN`)
- Important events (email sent, internal errors) are logged with `log.info` / `log.error`

### Deploy

- Hosting: **Vercel** (required for Vercel Cron Jobs)
- Database: **Neon** (serverless Postgres, SSL required in production)

## Stack

- Next.js 16, React 19, TypeScript (strict mode)
- PostgreSQL (via `pg` — no ORM, raw parameterized SQL queries)
- `node-pg-migrate` for migrations
- Prettier: single quotes, semi, tabWidth 2, trailingComma all

## MVC Architecture

Simple implementation with well-defined layers and separated responsibilities.

```
HTTP Request
    ↓
[Controller]  pages/api/v1/*       → receives the request, calls model, returns response
    ↓
[Middleware]  infra/controller.ts  → authentication, authorization, error handling
    ↓
[Model]       models/*             → business logic and data access
    ↓
[Infra]       infra/database.ts    → PostgreSQL query execution
```

### Layers

**Controller** (`pages/api/v1/`)

- Receives the HTTP request
- Delegates to the corresponding model
- Returns the response

**Middleware** (`infra/controller.ts`)

- **Authentication**: validates whether the user is logged in (valid session)
- **Authorization**: validates whether the user has permission to access the resource
- **Errors**: catches exceptions and formats the error response

**Model** (`models/`)

- All business logic
- Database queries
- Domain validations

**Infra** (`infra/`)

- `database.ts` — connection pool and query execution
- `errors.ts` — custom error classes
- `migrations/` — database schema

## Folder structure

```
pages/
  index.tsx
  _app.tsx           → global wrapper with fonts applied
  _document.tsx      → base HTML
  api/
    v1/              → all endpoints here
components/
  ui/                → shadcn/ui components (Button, Card, Badge...)
  layout/            → layout.tsx
  header/            → header.tsx
  footer/            → footer.tsx
  [feature]/         → each component in its own directory
lib/
  fonts.ts           → centralized next/font/google instances
  utils.ts           → cn() (clsx + tailwind-merge)
mocks/               → mock data for development
models/              → business logic (user, event, session, otp, password-reset, google-auth, group, group-member, notification, email, admin, ...)
infra/
  database.ts        → PostgreSQL connection pool
  errors.ts          → custom error classes
  controller.ts      → middleware: auth, authorization, errors
  migrations/        → migration files
  scripts/           → utilities (e.g. wait-for-postgres)
styles/
  globals.css        → design system (Tailwind v4 @theme, CSS vars, utilities)
tests/
  orchestrator.ts    → test setup/teardown
  integration/
    api/v1/          → tests mirroring endpoint structure
```

## API

- All endpoints under `/api/v1/`
- HTTP method routing via custom wrappers in `infra/controller.ts`:
  - `controller({ GET, POST, ... })` — public routes
  - `authenticatedController({ GET, POST, ... })` — protected routes (validates `session_token` cookie or `Authorization: Bearer` header); the handler receives `AuthenticatedRequest` with `req.user.{ id, name, email }`
- Responses: 201 for creation, 200 for success, 204 for empty, 4xx/5xx for errors
- Errors always return JSON with: `name`, `message`, `action`, `status_code`

## Custom errors (`infra/errors.ts`)

Error hierarchy with typed classes:

- `ValidationError` → 400
- `UnauthorizedError` → 401
- `NotFoundError` → 404
- `MethodNotAllowedError` → 405
- `TooManyRequestsError` → 429
- `ServiceError` → 503
- `InternalServerError` → 500 (automatic fallback for untyped exceptions — never throw explicitly)

Each error implements `toJSON()` for a consistent API response.

## Database

- Queries with parameters (`$1, $2`) — never string interpolation
- `RETURNING *` on create/update operations
- Case-insensitive checks for unique fields (username, email)
- Automatic SSL in production

## Migrations

- Use `node-pg-migrate`
- `exports.down = false` — no automatic rollback
- Default fields in all tables:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ DEFAULT NOW()`

## Tests

- Framework: Jest
- Philosophy: **no mocks** — use real services (real database, etc.)
- Tests mirror endpoint structure: `tests/integration/api/v1/...`
- `orchestrator.ts` centralizes: `clearDatabase()`, `runPendingMigrations()`, factories
- Use `@faker-js/faker` for generating test data
- Default timeout: 60 seconds
- Run with `--runInBand` (sequential) to avoid database conflicts

## Code conventions

### Components

- **Pages** (`pages/*.tsx`): `export default function PageName()`
- **Components** (`components/**/*.tsx`): `export const ComponentName = () => {}`
- One component per directory, file with explicit name (not `index.tsx`)
  - E.g. `components/date-card/date-card.tsx`
- Props typed with `interface`:
  ```ts
  interface DateCardProps {
    name: string;
    type: 'birthday' | 'anniversary';
  }
  ```
- Imports always with `@/` alias:
  - `import { Button } from '@/components/ui/button'`

### General

- No `any`
- No obvious comments
- User-facing error messages in Portuguese (pt-BR)

### Fonts (next/font/google)

Centralized instances in `lib/fonts.ts`. Applied in `pages/_app.tsx`:

- `quicksand.className` on the wrapper div → body font via CSS inheritance
- `fredoka.style.fontFamily` via `<style>` tag → applied to `h1-h6` and `.font-heading`

Reason: in Pages Router, font CSS variables are not available on parent elements (body/html) when applied to child divs. The `<style>` tag injects the actual font value generated by next/font.

## Commits

- Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Validated with commitlint + husky

## Local infrastructure

- Docker Compose in `infra/compose.yaml` for local PostgreSQL
- `wait-for-postgres` script before starting the server
- `.env.development` for local variables
