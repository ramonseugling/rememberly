import database from 'infra/database';
import migrator from 'models/migrator';

async function clearDatabase() {
  await database.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

const orchestrator = { clearDatabase, runPendingMigrations };

export default orchestrator;
