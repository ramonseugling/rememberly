import { readdirSync } from 'fs';
import { runner } from 'node-pg-migrate';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import migrator from 'models/migrator';
import session from 'models/session';

test('the forward migration preserves finite sessions and supports persistent sessions without a backfill', async () => {
  await orchestrator.clearDatabase();
  const client = await database.getNewClient();
  try {
    const previousMigrations = readdirSync('infra/migrations').filter(
      (file) =>
        file.endsWith('.ts') &&
        file < '1774000000000_allow-persistent-sessions.ts',
    ).length;
    await runner({
      dbClient: client,
      dir: 'infra/migrations',
      direction: 'up',
      count: previousMigrations,
      verbose: false,
      migrationsTable: 'pgmigrations',
    });
  } finally {
    await client.end();
  }
  const user = await orchestrator.createUser();
  const finite = await session.createForUser(user);
  const original = (
    await database.query('SELECT * FROM sessions WHERE id = $1', [finite.id])
  ).rows[0];
  const nullable = async () =>
    (
      await database.query(
        "SELECT is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'expires_at'",
      )
    ).rows[0].is_nullable;
  expect(await nullable()).toBe('NO');
  await migrator.runPendingMigrations();
  expect(await nullable()).toBe('YES');
  expect(
    (await database.query('SELECT * FROM sessions WHERE id = $1', [finite.id]))
      .rows[0],
  ).toEqual(original);
  await database.query('UPDATE sessions SET expires_at = NULL WHERE id = $1', [
    finite.id,
  ]);
  expect(await session.findOneValidByToken(finite.token)).not.toBeNull();
  expect(await migrator.runPendingMigrations()).toEqual([]);
});
