import type { NextApiRequest, NextApiResponse } from 'next';
import controller from 'infra/controller';
import { UnauthorizedError } from 'infra/errors';
import migrator from 'models/migrator';

export default controller({
  GET: handleGet,
  POST: handlePost,
});

function validateMigrationsToken(req: NextApiRequest) {
  const token = req.headers['x-migrations-token'];

  if (!process.env.MIGRATIONS_TOKEN || token !== process.env.MIGRATIONS_TOKEN) {
    throw new UnauthorizedError({
      message: 'Token de migrations inválido ou ausente.',
      action: 'Forneça um token válido no header X-Migrations-Token.',
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  validateMigrationsToken(req);

  const pendingMigrations = await migrator.listPendingMigrations();
  res.status(200).json(pendingMigrations);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  validateMigrationsToken(req);

  const executedMigrations = await migrator.runPendingMigrations();
  const statusCode = executedMigrations.length > 0 ? 201 : 200;
  res.status(statusCode).json(executedMigrations);
}
