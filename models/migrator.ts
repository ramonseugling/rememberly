import { runner as migrationRunner } from 'node-pg-migrate';
import { join } from 'path';
import { Client } from 'pg';
import database from 'infra/database';
import { ServiceError } from 'infra/errors';

const migrationsDir = join('infra', 'migrations');

async function listPendingMigrations() {
  let dbClient: Client | undefined;

  try {
    dbClient = await database.getNewClient();

    return await migrationRunner({
      dbClient,
      dryRun: true,
      dir: migrationsDir,
      direction: 'up',
      verbose: false,
      migrationsTable: 'pgmigrations',
    });
  } catch {
    throw new ServiceError({
      message: 'Erro ao listar migrations pendentes.',
      action: 'Verifique a conexão com o banco de dados.',
    });
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient: Client | undefined;

  try {
    dbClient = await database.getNewClient();

    return await migrationRunner({
      dbClient,
      dryRun: false,
      dir: migrationsDir,
      direction: 'up',
      verbose: false,
      migrationsTable: 'pgmigrations',
    });
  } catch {
    throw new ServiceError({
      message: 'Erro ao executar migrations.',
      action: 'Verifique a conexão com o banco de dados.',
    });
  } finally {
    await dbClient?.end();
  }
}

const migrator = { listPendingMigrations, runPendingMigrations };

export default migrator;
