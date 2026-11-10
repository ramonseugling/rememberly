import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import { getToday } from 'lib/date-utils';

const MESSAGE = 'É preciso ter 12 anos ou mais para usar o Rememberly.';

function birthDateTwelveYearsAgo(extraDays = 0) {
  const today = getToday();
  const date = new Date(
    today.getFullYear() - 12,
    today.getMonth(),
    today.getDate() + extraDays,
  );
  return {
    birth_day: date.getDate(),
    birth_month: date.getMonth() + 1,
    birth_year: date.getFullYear(),
  };
}

async function signUp(birth: Record<string, number>) {
  const email = faker.internet.email();
  const otpRecord = await orchestrator.createValidOtp(email);

  return fetch('http://localhost:3000/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: faker.person.fullName(),
      email,
      password: 'senha12345',
      otp_code: otpRecord.code,
      ...birth,
    }),
  });
}

async function patchBirth(cookie: string, birth: Record<string, number>) {
  return fetch('http://localhost:3000/api/v1/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(birth),
  });
}

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('minimum age of 12', () => {
  describe('POST /api/v1/users', () => {
    it('creates the account of someone who turns 12 today', async () => {
      const response = await signUp(birthDateTwelveYearsAgo());

      expect(response.status).toBe(201);
    });

    it('refuses someone who is 11 years and 364 days old', async () => {
      const response = await signUp(birthDateTwelveYearsAgo(1));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.name).toBe('ValidationError');
      expect(data.message).toBe(MESSAGE);
      expect(data.action).toBeDefined();
    });

    it('refuses a young child', async () => {
      const response = await signUp({
        birth_day: 1,
        birth_month: 1,
        birth_year: getToday().getFullYear() - 5,
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe(MESSAGE);
    });
  });

  describe('PATCH /api/v1/users', () => {
    it('refuses a birth date under 12', async () => {
      const cookie = await orchestrator.createAuthCookie();

      const response = await patchBirth(cookie, birthDateTwelveYearsAgo(1));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.name).toBe('ValidationError');
      expect(data.message).toBe(MESSAGE);
    });

    it('accepts a birth date of exactly 12 years today', async () => {
      const cookie = await orchestrator.createAuthCookie();

      const response = await patchBirth(cookie, birthDateTwelveYearsAgo());

      expect(response.status).toBe(200);
    });

    it('combines a partial update with the stored birth date', async () => {
      const cookie = await orchestrator.createAuthCookie();
      const stored = birthDateTwelveYearsAgo();
      await patchBirth(cookie, stored);

      const response = await patchBirth(cookie, {
        birth_year: stored.birth_year + 1,
      });

      expect(response.status).toBe(400);
    });

    it('allows a birth date without a stored year since the age cannot be verified', async () => {
      const email = faker.internet.email().toLowerCase();
      const cookie = await orchestrator.createAuthCookie({ email });
      await database.query(
        'UPDATE users SET birth_year = NULL WHERE email = $1',
        [email],
      );

      const response = await patchBirth(cookie, {
        birth_day: 10,
        birth_month: 11,
      });

      expect(response.status).toBe(200);
    });

    it('keeps updates without a birth date working', async () => {
      const cookie = await orchestrator.createAuthCookie();

      const response = await fetch('http://localhost:3000/api/v1/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ name: 'Maria Souza' }),
      });

      expect(response.status).toBe(200);
    });
  });
});
