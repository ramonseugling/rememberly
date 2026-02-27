import type { NextApiRequest, NextApiResponse } from 'next';
import controller from 'infra/controller';
import session from 'models/session';

export default controller({ POST: handlePost, DELETE: handleDelete });

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { email, password } = req.body;

  const createdSession = await session.create(email, password);

  res.status(201).json({
    token: createdSession.token,
    expires_at: createdSession.expires_at,
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    await session.expireByToken(token);
  }

  res.status(204).end();
}
