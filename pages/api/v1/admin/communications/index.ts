import type { NextApiResponse } from 'next';
import { createCommunicationSchema, parseSchema } from '@/lib/validators';
import { assertAdmin } from 'infra/admin-guard';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import communication from 'models/communication';

export default authenticatedController({ GET: handleGet, POST: handlePost });

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  await assertAdmin(req);

  res.status(200).json({ communications: await communication.list() });
}

async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  await assertAdmin(req);

  const input = parseSchema(createCommunicationSchema, req.body);
  const created = await communication.create(input, req.user.id);

  res.status(201).json(created);
}
