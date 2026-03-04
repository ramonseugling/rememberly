import type { NextApiRequest, NextApiResponse } from 'next';
import controller from 'infra/controller';
import session from 'models/session';

export default controller({
  GET: handleGet,
  POST: handlePost,
  DELETE: handleDelete,
});

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.session_token;

  if (!token) {
    return res.status(401).json({ user: null });
  }

  const foundSession = await session.findOneValidByToken(token);

  if (!foundSession) {
    return res.status(401).json({ user: null });
  }

  res.status(200).json({
    user: {
      id: foundSession.user_id,
      name: foundSession.name,
      email: foundSession.email,
    },
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { email, password } = req.body;

  const createdSession = await session.create(email, password);

  const maxAge = 60 * 60 * 24 * 30; // 30 dias
  res.setHeader(
    'Set-Cookie',
    `session_token=${createdSession.token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}`,
  );

  res.status(201).json({
    user: {
      id: createdSession.user_id,
      name: createdSession.name,
      email: createdSession.email,
    },
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.session_token;

  if (token) {
    await session.expireByToken(token);
  }

  res.setHeader(
    'Set-Cookie',
    'session_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
  );

  res.status(204).end();
}
