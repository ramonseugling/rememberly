import type { NextApiRequest, NextApiResponse } from 'next';
import controller from 'infra/controller';
import user from 'models/user';

export default controller({ POST: handlePost });

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { name, email, password } = req.body;

  const createdUser = await user.create({ name, email, password });

  res.status(201).json(createdUser);
}
