import type { NextApiResponse } from 'next';
import { communicationIdSchema, parseSchema } from '@/lib/validators';
import { assertAdmin } from 'infra/admin-guard';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import communication from 'models/communication';

export default authenticatedController({ POST: handlePost });

async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  await assertAdmin(req);
  const { id } = parseSchema(communicationIdSchema, req.query);

  res.status(200).json(await communication.sendTest(id, req.user));
}
