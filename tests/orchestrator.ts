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

const orchestrator = { clearDatabase, runPendingMigrations, createValidOtp };

export default orchestrator;
