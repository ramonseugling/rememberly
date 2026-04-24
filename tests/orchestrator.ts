import { faker } from '@faker-js/faker';
import crypto from 'crypto';
import database from 'infra/database';
import migrator from 'models/migrator';
import otp from 'models/otp';

async function clearDatabase() {
  await database.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createValidOtp(email: string) {
  return await otp.create(email);
}

async function createUser(
  overrides: {
    name?: string;
    email?: string;
    birth_day?: number;
    birth_month?: number;
    birth_year?: number;
    is_admin?: boolean;
  } = {},
) {
  const result = await database.query(
    `INSERT INTO users (name, email, birth_day, birth_month, birth_year, is_admin)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, birth_day, birth_month, birth_year, is_admin, created_at`,
    [
      overrides.name ?? faker.person.fullName(),
      overrides.email ?? faker.internet.email().toLowerCase(),
      overrides.birth_day ?? faker.number.int({ min: 1, max: 28 }),
      overrides.birth_month ?? faker.number.int({ min: 1, max: 12 }),
      overrides.birth_year ?? faker.number.int({ min: 1950, max: 2005 }),
      overrides.is_admin ?? false,
    ],
  );
  return result.rows[0];
}

async function createSessionForUser(userId: string) {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const result = await database.query(
    `INSERT INTO sessions (token, user_id, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, token, user_id, expires_at, created_at`,
    [token, userId, expiresAt],
  );
  return result.rows[0];
}

async function createUserAndSession(
  overrides: Parameters<typeof createUser>[0] = {},
) {
  const user = await createUser(overrides);
  const session = await createSessionForUser(user.id);
  return { user, session };
}

async function createAdminUserAndSession() {
  return createUserAndSession({ is_admin: true });
}

async function createEvent(
  userId: string,
  overrides: {
    title?: string;
    type?: string;
    event_day?: number;
    event_month?: number;
    reminder_days_before?: number;
  } = {},
) {
  const result = await database.query(
    `INSERT INTO events (title, type, event_day, event_month, reminder_days_before, user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      overrides.title ?? faker.person.fullName(),
      overrides.type ?? 'birthday',
      overrides.event_day ?? faker.number.int({ min: 1, max: 28 }),
      overrides.event_month ?? faker.number.int({ min: 1, max: 12 }),
      overrides.reminder_days_before ?? 0,
      userId,
    ],
  );
  return result.rows[0];
}

async function createAuthCookie(
  user: {
    name?: string;
    email?: string;
    password?: string;
    birth_day?: number;
    birth_month?: number;
    birth_year?: number;
  } = {},
): Promise<string> {
  const data = {
    name: user.name ?? faker.person.fullName(),
    email: user.email ?? faker.internet.email(),
    password: user.password ?? 'senha123',
    birth_day: user.birth_day ?? faker.number.int({ min: 1, max: 28 }),
    birth_month: user.birth_month ?? faker.number.int({ min: 1, max: 12 }),
    birth_year: user.birth_year ?? faker.number.int({ min: 1950, max: 2005 }),
  };

  const otpRecord = await createValidOtp(data.email);

  await fetch('http://localhost:3000/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, otp_code: otpRecord.code }),
  });

  const loginRes = await fetch('http://localhost:3000/api/v1/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: data.email, password: data.password }),
  });

  return loginRes.headers.get('set-cookie') ?? '';
}

function extractToken(cookie: string): string {
  return cookie.match(/session_token=([^;]+)/)?.[1] ?? '';
}

async function createUserAndToken(
  user: Parameters<typeof createAuthCookie>[0] = {},
) {
  const cookie = await createAuthCookie(user);
  return extractToken(cookie);
}

async function createGroup(token: string, name?: string) {
  const response = await fetch('http://localhost:3000/api/v1/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: name ?? `Grupo ${faker.word.noun()}` }),
  });

  return response.json();
}

async function joinGroup(token: string, inviteCode: string) {
  const response = await fetch('http://localhost:3000/api/v1/groups/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ invite_code: inviteCode }),
  });

  return response.json();
}

const orchestrator = {
  clearDatabase,
  runPendingMigrations,
  createValidOtp,
  createUser,
  createSessionForUser,
  createUserAndSession,
  createAdminUserAndSession,
  createEvent,
  createAuthCookie,
  extractToken,
  createUserAndToken,
  createGroup,
  joinGroup,
};

export default orchestrator;
