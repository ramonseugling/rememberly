import type { NextApiRequest, NextApiResponse } from 'next';
import controller from 'infra/controller';
import migrator from 'models/migrator';

export default controller({
  GET: handleGet,
  POST: handlePost,
});

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const pendingMigrations = await migrator.listPendingMigrations();
  res.status(200).json(pendingMigrations);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const executedMigrations = await migrator.runPendingMigrations();
  const statusCode = executedMigrations.length > 0 ? 201 : 200;
  res.status(statusCode).json(executedMigrations);
}
