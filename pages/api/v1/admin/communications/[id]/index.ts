import type { NextApiResponse } from 'next';
import {
  communicationIdSchema,
  parseSchema,
  updateCommunicationSchema,
} from '@/lib/validators';
import { assertAdmin } from 'infra/admin-guard';
import {
  AuthenticatedRequest,
  authenticatedController,
} from 'infra/controller';
import communication from 'models/communication';

export default authenticatedController({
  GET: handleGet,
  PATCH: handlePatch,
});

async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  await assertAdmin(req);
  const { id } = parseSchema(communicationIdSchema, req.query);

  res.status(200).json(await communication.findById(id));
}

async function handlePatch(req: AuthenticatedRequest, res: NextApiResponse) {
  await assertAdmin(req);
  const { id } = parseSchema(communicationIdSchema, req.query);
  const changes = parseSchema(updateCommunicationSchema, req.body);

  res.status(200).json(await communication.update(id, changes));
}
