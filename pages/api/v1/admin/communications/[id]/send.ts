import type { NextApiResponse } from 'next';
import {
  communicationIdSchema,
  parseSchema,
  sendCommunicationSchema,
} from '@/lib/validators';
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
  const { confirm_recipients } = parseSchema(sendCommunicationSchema, req.body);

  res.status(200).json(await communication.send(id, confirm_recipients));
}
