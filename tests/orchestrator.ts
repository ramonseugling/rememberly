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

const orchestrator = {
  clearDatabase,
  runPendingMigrations,
  createValidOtp,
  createAuthCookie,
};

export default orchestrator;
