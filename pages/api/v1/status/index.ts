import type { NextApiRequest, NextApiResponse } from 'next';
import controller from 'infra/controller';
import database from 'infra/database';

export default controller({ GET: handleGet });

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const result = await database.query('SELECT version(), now() as updated_at');
  const { version, updated_at } = result.rows[0];

  res.status(200).json({
    updated_at,
    dependencies: {
      database: {
        version,
      },
    },
  });
}
