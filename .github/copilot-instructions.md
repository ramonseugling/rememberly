# Copilot Instructions

## Domain

Multi-user app for registering important dates and receiving email notifications on the day of the event (birthdays, anniversaries, etc.).

**Core entities:**

- **User** — `name`, `email` (unique, lowercased), `password` (bcrypt hash)
- **Event** — `title` (free text), `type` (enum: `birthday` | `dating_anniversary` | `wedding_anniversary` | `celebration`), `date` (day + month only — no year; repeats annually), `user_id` (FK)

**Business rules:**

- Users see and manage only their own events
- A daily cron job (Vercel Cron Jobs) calls an internal endpoint each morning and sends one email per matching event via Nodemailer + SMTP
- Locally, use MailCatcher to intercept emails without real delivery

## Commands

```bash
npm run dev          # Start dev (starts Docker, waits for Postgres, runs migrations, starts Next.js)
npm run test         # Run all tests (requires dev server running at localhost:3000)
npm run test:watch   # Run tests in watch mode
npm run lint:check   # Check formatting with Prettier
npm run lint:fix     # Fix formatting with Prettier
npm run migrations:up  # Run pending migrations
```

**Run a single test file:**

```bash
node --env-file=.env.development ./node_modules/.bin/jest --runInBand tests/integration/api/v1/users/post.test.ts
```

> Tests hit a live Next.js server at `localhost:3000` — the server must be running before running tests.

## Architecture

MVC pattern with these layers:

- **`pages/api/v1/`** — Controllers: thin, receive request, call model, return response
- **`infra/controller.ts`** — Two wrappers: `controller()` for public routes, `authenticatedController()` for protected routes (validates `session_token` cookie or `Authorization: Bearer` header)
- **`models/`** — All business logic and DB queries
- **`infra/database.ts`** — PostgreSQL pool; `database.query(sql, params)` is the only way to query

## API Conventions

- All endpoints under `/api/v1/`
- Controllers export a single default: `export default controller({ POST: handlePost })`
- 201 for creation, 200 for success, 204 for empty responses
- All errors return `{ name, message, action, status_code }` — throw from `infra/errors.ts`, never craft error JSON manually
- User-facing error messages in Portuguese

## Error Handling

Throw typed errors from `infra/errors.ts`; `controller.ts` catches and serializes them automatically:

```ts
throw new ValidationError({
  message: 'E-mail inválido.',
  action: 'Corrija o e-mail.',
});
throw new NotFoundError({
  message: 'Evento não encontrado.',
  action: 'Verifique o ID.',
});
throw new UnauthorizedError({
  message: 'Sessão inválida.',
  action: 'Faça login novamente.',
});
```

`InternalServerError` is the fallback for unhandled exceptions — never throw it explicitly.

## Database

- Raw SQL only — no ORM. Always use `$1, $2` parameters, never string interpolation
- Always use `RETURNING *` (or explicit columns) on INSERT/UPDATE
- Email lookups: `WHERE LOWER(email) = LOWER($1)`
- All tables have: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Migrations: `node-pg-migrate` files in `infra/migrations/`. Set `exports.down = false` — no rollbacks

## Authentication

Sessions stored in DB with a 30-day `expires_at`. Token sent as `HttpOnly` cookie (`session_token`). Authenticated routes use `authenticatedController()` — handler receives `AuthenticatedRequest` with `req.user.{ id, name, email }`.

## Testing

- No mocks — tests run against a real Postgres DB and a live Next.js server
- Each test file calls `orchestrator.clearDatabase()` + `orchestrator.runPendingMigrations()` in `beforeAll`
- Test files mirror endpoint paths: `tests/integration/api/v1/users/post.test.ts` → `POST /api/v1/users`
- Use `@faker-js/faker` for test data generation
- Tests run with `--runInBand` (sequential) to avoid DB conflicts
- **Always create a corresponding test file for every new file created or edited**

## Component Conventions

- **Pages** (`pages/*.tsx`): `export default function PageName()`
- **Components** (`components/**/*.tsx`): `export const ComponentName = () => {}`
- One component per directory, named file (not `index.tsx`): `components/date-card/date-card.tsx`
- All imports use `@/` alias: `import { Button } from '@/components/ui/button'`
- No `any`; props typed with `interface`

## Fonts

Centralized in `lib/fonts.ts`. Applied in `pages/_app.tsx` via:

- `quicksand.className` on the wrapper `<div>` (body font via CSS inheritance)
- `fredoka.style.fontFamily` injected via `<style>` tag for `h1–h6` and `.font-heading`

Do not apply font variables via CSS custom properties in `_app.tsx` — they don't propagate to parent elements in Next.js Pages Router.

## Styling

Tailwind CSS v4 with `@theme` in `styles/globals.css` — no `tailwind.config.ts`. shadcn/ui components live in `components/ui/`.

## Local Infrastructure

Docker Compose (`infra/compose.yaml`) runs PostgreSQL locally. `npm run dev` handles the full startup sequence: `services:up` → `wait-for-postgres` → `migrations:up` → `next dev`. Environment variables come from `.env.development`.

## Commits

Follow Conventional Commits — enforced by commitlint + husky:
`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
