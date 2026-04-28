<div align="center">
  <img src="public/logo.svg" alt="rememberly" width="64" height="64" />
  <h1>rememberly</h1>
  <p>Nunca mais esqueça quem importa.</p>
  <p>Never forget the dates that matter most — birthdays, anniversaries and every special occasion.</p>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-myforeverdates.com.br-ff6b9d?style=for-the-badge&logo=vercel)](https://myforeverdates.com.br)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 📸 Preview

<div align="center">
  <img src="public/mockups/mockup-desktop.jpeg" alt="rememberly — Desktop" width="80%" />
  <br/><br/>
  <img src="public/mockups/mockup-ios.jpeg" alt="rememberly — Mobile" width="40%" />
</div>

---

## 📖 About

**rememberly** is a multi-user web app that lets you register important annual dates and receive email reminders right when they happen.

**The problem it solves:** we easily forget recurring dates — a friend's birthday, a wedding anniversary, the day a relationship started. This app keeps all of that in one place and sends you an email on the morning of each event, so you're always prepared to celebrate the people you care about.

**Core flow:**

1. Create an account and sign in
2. Register events with a title, type and date (day + month, repeating every year)
3. Receive an email notification on the morning of each event

---

## ✨ Features

- **Multiple event types** — `Birthday`, `Dating Anniversary`, `Wedding Anniversary`, `Celebration` and a fully custom type
- **Daily email notifications** — automated cron job fires every morning and sends one email per matching event via [Resend](https://resend.com)
- **Early reminders** — configure how many days before an event you want to be notified
- **Groups** — create or join groups (family, friends, co-workers) and automatically see everyone's birthdays in one place
- **Google OAuth** — sign in with Google in one click, in addition to email/password
- **Password reset** — via secure OTP token sent to the registered email
- **Responsive UI** — works on desktop and mobile, with a floating action button for quick event creation on small screens
- **Animated landing page** — built with Framer Motion, showcasing the product to new visitors

---

## 🛠️ Tech Stack

| Layer       | Technology                                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend    | [Next.js 16](https://nextjs.org) (Pages Router), [React 19](https://react.dev), [TypeScript 5](https://www.typescriptlang.org)                                 |
| Styling     | [Tailwind CSS v4](https://tailwindcss.com) (with `@theme`, no config file), [shadcn/ui](https://ui.shadcn.com), [Framer Motion](https://www.framer.com/motion) |
| Database    | [PostgreSQL 16](https://www.postgresql.org) — raw SQL via [`pg`](https://node-postgres.com), no ORM                                                            |
| Migrations  | [node-pg-migrate](https://github.com/salsita/node-pg-migrate)                                                                                                  |
| Email       | [Resend](https://resend.com)                                                                                                                                   |
| Auth        | Sessions stored in DB (HttpOnly cookie) + [Google OAuth](https://developers.google.com/identity)                                                               |
| Cron        | [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)                                                                                                          |
| Logging     | [Axiom](https://axiom.co) via [next-axiom](https://github.com/axiomhq/next-axiom)                                                                              |
| Testing     | [Jest](https://jestjs.io) — integration tests against a real DB, no mocks                                                                                      |
| Local infra | [Docker Compose](https://docs.docker.com/compose) (PostgreSQL)                                                                                                 |
| Deploy      | [Vercel](https://vercel.com) + [Neon](https://neon.tech) (PostgreSQL in production)                                                                            |

---

## 🏗️ Architecture

The project follows a simple **MVC** pattern with clear layer separation:

```
HTTP Request
    ↓
[Controller]   pages/api/v1/*        — receives request, calls model, returns response
    ↓
[Middleware]   infra/controller.ts   — auth, authorization, error handling
    ↓
[Model]        models/*              — business logic and DB queries
    ↓
[Infra]        infra/database.ts     — PostgreSQL connection pool
```

**Key design decisions:**

- **No ORM** — every query is plain parameterized SQL (`$1, $2`). This keeps the data layer transparent and easy to reason about.
- **No mocks in tests** — integration tests run against a real Postgres database and a live Next.js server, ensuring the full stack is covered.
- **Typed errors** — all API errors are thrown as typed classes from `infra/errors.ts` and serialized automatically by the controller middleware.

---

## 📁 Project Structure

```
├── pages/
│   ├── index.tsx            # Landing page (public)
│   ├── dates.tsx            # Main dashboard (protected)
│   ├── groups.tsx           # Groups (protected)
│   ├── login.tsx
│   ├── signup.tsx
│   └── api/v1/              # All API endpoints
│       ├── users/
│       ├── sessions/
│       ├── events/
│       ├── groups/
│       ├── notifications/
│       └── ...
├── components/
│   ├── ui/                  # shadcn/ui base components
│   ├── landing-page/        # Hero, features, how-it-works sections
│   ├── date-card/
│   ├── add-event-modal/
│   ├── group-card/
│   └── ...
├── models/                  # Business logic (user, event, session, group, ...)
├── infra/
│   ├── database.ts          # PostgreSQL pool
│   ├── errors.ts            # Typed error classes
│   ├── controller.ts        # Auth middleware and error handler
│   ├── migrations/          # SQL migrations (node-pg-migrate)
│   └── scripts/             # Dev utilities
├── lib/
│   ├── fonts.ts             # next/font/google instances
│   └── utils.ts             # cn() helper (clsx + tailwind-merge)
├── tests/
│   ├── orchestrator.ts      # DB setup/teardown helpers
│   └── integration/api/v1/  # Integration tests mirroring endpoint paths
└── styles/
    └── globals.css          # Tailwind v4 @theme design system
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Docker](https://www.docker.com) (for local PostgreSQL)

### Installation

```bash
# Clone the repository
git clone https://github.com/ramonseugling/my-forever-dates.git
cd my-forever-dates

# Install dependencies
npm install
```

### Environment Variables

Copy the example file and fill in the values:

```bash
cp .env.example .env.development
```

See the [Environment Variables](#-environment-variables) section below for a description of each variable.

### Running Locally

```bash
npm run dev
```

This single command handles everything: starts Docker (PostgreSQL), waits for the database to be ready, runs pending migrations and starts the Next.js dev server.

The app will be available at [http://localhost:3000](http://localhost:3000).

> **Email in development:** Emails are not sent locally. Use [MailCatcher](https://mailcatcher.me) or any local SMTP trap to inspect outgoing emails.

---

## 🧪 Running Tests

> The test suite requires the **dev server to be running** at `localhost:3000` before executing.

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Run a single test file
node --env-file=.env.development ./node_modules/.bin/jest --runInBand tests/integration/api/v1/users/post.test.ts
```

**Testing philosophy:**

- Zero mocks — tests run against a real PostgreSQL database and a live Next.js server
- Each test file calls `orchestrator.clearDatabase()` and `orchestrator.runPendingMigrations()` in `beforeAll` for a clean state
- Tests run sequentially (`--runInBand`) to avoid database conflicts
- Fake data generated with [`@faker-js/faker`](https://fakerjs.dev)

---

## 🔑 Environment Variables

| Variable           | Description                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`     | PostgreSQL connection string. Local: `postgres://local_user:local_password@localhost:5432/my_forever_dates` |
| `MIGRATIONS_TOKEN` | Secret token to authorize `POST /api/v1/migrations` (generate with `openssl rand -hex 32`)                  |
| `RESEND_API_KEY`   | Resend API key for sending emails ([get one here](https://resend.com/api-keys))                             |
| `EMAIL_FROM`       | Sender address — must be from a verified domain in Resend                                                   |
| `CRON_SECRET`      | Secret token to authorize the daily notification cron endpoint                                              |
| `APP_URL`          | Base URL of the app, used to build links in notification emails                                             |
| `AXIOM_DATASET`    | Axiom dataset name for structured logging                                                                   |
| `AXIOM_TOKEN`      | Axiom API token                                                                                             |

---

## ☁️ Deployment

The project is deployed on **[Vercel](https://vercel.com)** with **[Neon](https://neon.tech)** as the managed PostgreSQL database.

**Build command** (defined in `vercel.json`):

```bash
npm run migrations:up:production && next build
```

Migrations are applied automatically on every deploy before the new code goes live.

**Cron Jobs** (configured in `vercel.json`):

| Endpoint                                    | Schedule           | Purpose                                    |
| ------------------------------------------- | ------------------ | ------------------------------------------ |
| `POST /api/v1/notifications/send`           | Daily at 12:00 UTC | Send email for each event happening today  |
| `POST /api/v1/notifications/send-reminders` | Daily at 12:00 UTC | Send advance reminders for upcoming events |

---

## 🤝 Contributing

This project follows [Conventional Commits](https://www.conventionalcommits.org), enforced by [commitlint](https://commitlint.js.org) and [husky](https://typicode.github.io/husky).

Allowed prefixes:

| Prefix      | Use for                               |
| ----------- | ------------------------------------- |
| `feat:`     | New features                          |
| `fix:`      | Bug fixes                             |
| `docs:`     | Documentation changes                 |
| `refactor:` | Code refactoring (no behavior change) |
| `test:`     | Adding or updating tests              |
| `chore:`    | Build, tooling, dependencies          |

```bash
# Example
git commit -m "feat: add reminder days before event"
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to use, modify and distribute it, as long as the original copyright notice is preserved.
