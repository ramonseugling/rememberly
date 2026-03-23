import { faker } from '@faker-js/faker';
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

async function createGroupEvent(
  token: string,
  groupId: string,
  overrides: Record<string, unknown> = {},
) {
  const eventData = {
    title: overrides.title ?? `Evento ${faker.person.firstName()}`,
    type: overrides.type ?? 'birthday',
    event_day: overrides.event_day ?? faker.number.int({ min: 1, max: 28 }),
    event_month: overrides.event_month ?? faker.number.int({ min: 1, max: 12 }),
    ...overrides,
  };

  const response = await fetch(
    `http://localhost:3000/api/v1/groups/${groupId}/events`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    },
  );

  return response.json();
}

const orchestrator = {
  clearDatabase,
  runPendingMigrations,
  createValidOtp,
  createAuthCookie,
  extractToken,
  createUserAndToken,
  createGroup,
  joinGroup,
  createGroupEvent,
};

export default orchestrator;
