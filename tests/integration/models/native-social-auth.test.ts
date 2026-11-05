import { socialKeys } from 'tests/lib/native-social-fixtures';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import {
  createNativeSocialChallenge,
  exchangeNativeSocialIdentity,
} from 'models/native-social-auth';
import session from 'models/session';

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

let index = 0;
async function proof(provider: 'google' | 'apple' = 'google', claims = {}) {
  index++;
  const challenge = await createNativeSocialChallenge(provider);
  const identity = {
    sub: `fixture-subject-${index}`,
    email: `fixture-${index}@example.test`,
    ...claims,
  };
  const token = await keys.sign(challenge.nonce, identity, provider);
  const exchange = () =>
    exchangeNativeSocialIdentity(provider, challenge.challenge_id, token, {
      resolver: keys.resolver,
    });
  return { challenge, identity, token, exchange };
}

async function counts() {
  return (
    await database.query(`SELECT (SELECT count(*)::int FROM users) AS users,
    (SELECT count(*)::int FROM sessions) AS sessions,
    (SELECT count(*)::int FROM native_social_identities) AS identities`)
  ).rows[0];
}

test('stores only a nonce digest and issues an opaque persistent session for a new verified identity without marketing consent', async () => {
  const own = await proof();
  const stored = (
    await database.query('SELECT * FROM native_social_challenges WHERE id=$1', [
      own.challenge.challenge_id,
    ])
  ).rows[0];
  expect(stored.nonce_hash).toMatch(/^[0-9a-f]{64}$/);
  expect(stored.nonce_hash).not.toEqual(own.challenge.nonce);
  expect(stored.purpose).toBe('login');
  expect(stored.expires_at.getTime() - Date.now()).toBeLessThanOrEqual(300000);
  const result = await own.exchange();
  expect(result.token).toMatch(/^[0-9a-f]{96}$/);
  expect(result.expires_at).toBeNull();
  expect(await session.findOneValidByToken(result.token)).toMatchObject({
    user_id: result.user_id,
    email: own.identity.email,
  });
  expect(
    (
      await database.query(
        'SELECT password,marketing_consent FROM users WHERE id=$1',
        [result.user_id],
      )
    ).rows[0],
  ).toEqual({ password: null, marketing_consent: false });
  expect(
    (
      await database.query(
        'SELECT used_at FROM native_social_challenges WHERE id=$1',
        [own.challenge.challenge_id],
      )
    ).rows[0].used_at,
  ).toBeInstanceOf(Date);
  await expect(own.exchange()).rejects.toMatchObject({ code: 'invalid' });
});

test('concurrent replay of one challenge creates exactly one account, identity and session', async () => {
  const own = await proof();
  const before = await counts();
  const results = await Promise.allSettled([own.exchange(), own.exchange()]);
  expect(results.filter((value) => value.status === 'fulfilled')).toHaveLength(
    1,
  );
  expect(await counts()).toEqual({
    users: before.users + 1,
    sessions: before.sessions + 1,
    identities: before.identities + 1,
  });
});

test('different challenges for the same provider subject reuse one user under concurrency', async () => {
  const first = await proof();
  const second = await proof('google', first.identity);
  const before = await counts();
  const results = await Promise.all([first.exchange(), second.exchange()]);
  expect(results[0].user_id).toBe(results[1].user_id);
  expect(results[0].token).not.toBe(results[1].token);
  expect(await counts()).toEqual({
    users: before.users + 1,
    sessions: before.sessions + 2,
    identities: before.identities + 1,
  });
});

test.each(['nonce', 'provider', 'expired', 'unknown'])(
  'a %s mismatch cannot consume a challenge or issue a session',
  async (kind) => {
    const own = await proof();
    const before = await counts();
    if (kind === 'expired')
      await database.query(
        'UPDATE native_social_challenges SET expires_at=NOW() WHERE id=$1',
        [own.challenge.challenge_id],
      );
    const token =
      kind === 'nonce'
        ? await keys.sign('wrong-nonce', own.identity)
        : kind === 'provider'
          ? await keys.sign(own.challenge.nonce, own.identity, 'apple')
          : own.token;
    await expect(
      exchangeNativeSocialIdentity(
        kind === 'provider' ? 'apple' : 'google',
        kind === 'unknown'
          ? '00000000-0000-4000-8000-000000000000'
          : own.challenge.challenge_id,
        token,
        { resolver: keys.resolver },
      ),
    ).rejects.toMatchObject({ code: 'invalid' });
    expect(await counts()).toEqual(before);
    expect(
      (
        await database.query(
          'SELECT used_at FROM native_social_challenges WHERE id=$1',
          [own.challenge.challenge_id],
        )
      ).rows[0].used_at,
    ).toBeNull();
  },
);

test.each(['password', 'legacy-google'])(
  'verified email collision with a %s account never automatically links',
  async (kind) => {
    const existing = await orchestrator.createUser();
    if (kind === 'password')
      await database.query('UPDATE users SET password=$1 WHERE id=$2', [
        'fixture-hash',
        existing.id,
      ]);
    const own = await proof('google', { email: existing.email.toUpperCase() });
    const before = await counts();
    await expect(own.exchange()).rejects.toMatchObject({ code: 'collision' });
    expect(await counts()).toEqual(before);
    expect(
      (
        await database.query(
          'SELECT used_at FROM native_social_challenges WHERE id=$1',
          [own.challenge.challenge_id],
        )
      ).rows[0].used_at,
    ).toBeNull();
  },
);

test('provider subjects are isolated and changed email cannot reassign an existing identity', async () => {
  const google = await proof();
  const signedIn = await google.exchange();
  const other = await proof('apple', { sub: google.identity.sub });
  expect((await other.exchange()).user_id).not.toBe(signedIn.user_id);
  const existing = await orchestrator.createUser();
  const changed = await proof('google', {
    sub: google.identity.sub,
    email: existing.email,
  });
  expect((await changed.exchange()).user_id).toBe(signedIn.user_id);
});

test('Apple can restore an already mapped subject without receiving email again; a first login requires verified email', async () => {
  const apple = await proof('apple');
  const created = await apple.exchange();
  const repeat = await proof('apple', {
    sub: apple.identity.sub,
    email: undefined,
    email_verified: undefined,
  });
  expect((await repeat.exchange()).user_id).toBe(created.user_id);
  const first = await proof('apple', {
    email: undefined,
    email_verified: undefined,
  });
  await expect(first.exchange()).rejects.toMatchObject({ code: 'invalid' });
});

test('failed session insertion rolls back challenge use, new user and identity', async () => {
  const own = await proof();
  const before = await counts();
  await database.query(
    `CREATE FUNCTION fail_social_session() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic social issuance failure'; END $$`,
  );
  await database.query(
    'CREATE TRIGGER fail_social_session BEFORE INSERT ON sessions FOR EACH ROW EXECUTE FUNCTION fail_social_session()',
  );
  try {
    await expect(own.exchange()).rejects.toThrow(
      'Synthetic social issuance failure',
    );
    expect(await counts()).toEqual(before);
    expect(
      (
        await database.query(
          'SELECT used_at FROM native_social_challenges WHERE id=$1',
          [own.challenge.challenge_id],
        )
      ).rows[0].used_at,
    ).toBeNull();
  } finally {
    await database.query('DROP TRIGGER fail_social_session ON sessions');
    await database.query('DROP FUNCTION fail_social_session()');
  }
  await expect(own.exchange()).resolves.toMatchObject({ expires_at: null });
});

test('expired challenge cleanup is bounded and deleting a user cascades identity mappings', async () => {
  await database.query(`INSERT INTO native_social_challenges(provider,nonce_hash,expires_at)
    SELECT 'google', repeat('0',64), NOW()-interval '1 hour' FROM generate_series(1,110)`);
  const before = Number(
    (
      await database.query(
        'SELECT count(*) FROM native_social_challenges WHERE expires_at<=NOW()',
      )
    ).rows[0].count,
  );
  const own = await proof();
  expect(
    Number(
      (
        await database.query(
          'SELECT count(*) FROM native_social_challenges WHERE expires_at<=NOW()',
        )
      ).rows[0].count,
    ),
  ).toBe(before - 100);
  const created = await own.exchange();
  await database.query('DELETE FROM users WHERE id=$1', [created.user_id]);
  expect(
    (
      await database.query(
        'SELECT * FROM native_social_identities WHERE user_id=$1',
        [created.user_id],
      )
    ).rows,
  ).toHaveLength(0);
});
