import { faker } from '@faker-js/faker';
import { socialKeys } from 'tests/lib/native-social-fixtures';
import orchestrator from 'tests/orchestrator';
import { LEGAL_VERSION } from '@/lib/legal/shared';
import database from 'infra/database';
import googleAuth from 'models/google-auth';
import {
  createNativeSocialChallenge,
  exchangeNativeSocialIdentity,
} from 'models/native-social-auth';

let keys: Awaited<ReturnType<typeof socialKeys>>;
const environment = {
  google: process.env.GOOGLE_NATIVE_CLIENT_IDS,
  apple: process.env.APPLE_NATIVE_CLIENT_IDS,
};

beforeAll(async () => {
  process.env.GOOGLE_NATIVE_CLIENT_IDS = 'native-fixture-client';
  process.env.APPLE_NATIVE_CLIENT_IDS = 'native-fixture-client';
  keys = await socialKeys();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

afterAll(() => {
  for (const [name, value] of [
    ['GOOGLE_NATIVE_CLIENT_IDS', environment.google],
    ['APPLE_NATIVE_CLIENT_IDS', environment.apple],
  ]) {
    if (value === undefined) delete process.env[name!];
    else process.env[name!] = value;
  }
});

async function readTerms(email: string) {
  const result = await database.query(
    'SELECT terms_accepted_at, terms_version FROM users WHERE LOWER(email) = LOWER($1)',
    [email],
  );
  return result.rows[0];
}

async function nativeExchange(
  provider: 'google' | 'apple',
  subject: string,
  email: string,
) {
  const challenge = await createNativeSocialChallenge(provider);
  const token = await keys.sign(
    challenge.nonce,
    { sub: subject, email },
    provider,
  );
  return exchangeNativeSocialIdentity(provider, challenge.challenge_id, token, {
    resolver: keys.resolver,
  });
}

describe('terms acceptance on social account creation', () => {
  it('records acceptance when Google web creates a new user', async () => {
    const email = faker.internet.email().toLowerCase();

    await googleAuth.findOrCreateUser({
      email,
      name: faker.person.fullName(),
    });

    const row = await readTerms(email);
    expect(row.terms_version).toBe(LEGAL_VERSION);
    expect(row.terms_accepted_at).toBeInstanceOf(Date);
  });

  it.each(['google', 'apple'] as const)(
    'records acceptance when native %s creates a new user',
    async (provider) => {
      const email = `${provider}-${faker.string.alphanumeric(8).toLowerCase()}@example.test`;

      await nativeExchange(provider, `terms-${provider}-subject`, email);

      const row = await readTerms(email);
      expect(row.terms_version).toBe(LEGAL_VERSION);
      expect(row.terms_accepted_at).toBeInstanceOf(Date);
    },
  );

  it('leaves an existing user untouched when signing in again with Google', async () => {
    const email = faker.internet.email().toLowerCase();
    await database.query('INSERT INTO users (name, email) VALUES ($1, $2)', [
      faker.person.fullName(),
      email,
    ]);

    await googleAuth.findOrCreateUser({
      email,
      name: faker.person.fullName(),
    });

    const row = await readTerms(email);
    expect(row.terms_accepted_at).toBeNull();
    expect(row.terms_version).toBeNull();
  });

  it('keeps the original acceptance when a native user signs in again', async () => {
    const email = `again-${faker.string.alphanumeric(8).toLowerCase()}@example.test`;
    await nativeExchange('google', 'terms-again-subject', email);
    await database.query(
      `UPDATE users SET terms_accepted_at = NULL, terms_version = NULL WHERE email = $1`,
      [email],
    );

    await nativeExchange('google', 'terms-again-subject', email);

    const row = await readTerms(email);
    expect(row.terms_accepted_at).toBeNull();
    expect(row.terms_version).toBeNull();
  });
});
